const express = require('express');
const router = express.Router();
const axios = require('axios');
const moment = require('moment');

const compromise = require('compromise');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const Analyzer = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

const twitterQuery = "trump";
const timeBetweenQueries = 6000; // ms

const asyncRedis = require("async-redis"); // NOTE: async wrapper package for redis package
const client = asyncRedis.createClient();
client.on("error", err => console.error(err));

const AWS = require('aws-sdk');
AWS.config.getCredentials(err => { if (err) console.log(err.stack); });
AWS.config.update({ region: "ap-southeast-2" });

const dynamodb = new AWS.DynamoDB();
const dynamodbDocClient = new AWS.DynamoDB.DocumentClient();
const dynamodbInfo = { 
    TableName: "TwitterData", 
    HashDateKey: "dateOfQuery", 
    RangeUnixKey: "unixTimeOfQuery",
    GenerateKeys: function() {
        return {
            TableName: this.TableName,
            Item: {
                [this.HashDateKey]: moment().format('DD-MM-YYYY'),
                [this.RangeUnixKey]: moment().unix()
            }
        }
    },    
    GenerateKeysWithInfo: function(info) {
        let temp = this.GenerateKeys(); temp.Item.info = info; return temp;
    }
};

dynamodb.createTable({
    TableName : dynamodbInfo.TableName,
    KeySchema: [       
        { AttributeName: dynamodbInfo.HashDateKey, KeyType: "HASH"},
        { AttributeName: dynamodbInfo.RangeUnixKey, KeyType: "RANGE"} 
    ],
    AttributeDefinitions: [    
        { AttributeName: dynamodbInfo.HashDateKey, AttributeType: "S" },
        { AttributeName: dynamodbInfo.RangeUnixKey, AttributeType: "N" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
    }
}, err => {
    if (err)
        if (err.code === "ResourceInUseException") console.log("The DynamoDB table already exists");
        else console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    else console.log("Created DynamoDB table");
});

function addSentimentAndCompromiseToData(twitterData) {
    let wordsFromTweets = [];
    let tweetsWithSentiment = [];

    let topicsOnTweets = { 
        places: [],
        people: [],
        organizations: []
    };

    let occurencesOfTopics = { // NOTE: I wish .topics() came organised -.- 
        places: {},
        people: {},
        organizations: {}
    };

    twitterData.forEach(tweet => {
        const tweetDoc = compromise(tweet.text);
        tweetDoc.places().map(place => topicsOnTweets.places.push(place.text('reduced').trim()));
        tweetDoc.people().map(place => topicsOnTweets.people.push(place.text('reduced').trim()));
        tweetDoc.organizations().map(place => topicsOnTweets.organizations.push(place.text('reduced').trim()));

        const wordsFromText = tokenizer.tokenize(tweet.text);
        wordsFromText.forEach(word => wordsFromTweets.push(word));

        tweetsWithSentiment.push({
            id: tweet.id,
            text: tweet.text,
            sentiment: analyzer.getSentiment(wordsFromText)
        });
    });

    tweetsWithSentiment.sort((a, b) => b.sentiment - a.sentiment);
    const sentimentRanked = {
        topPos: tweetsWithSentiment.slice(0, 5),
        topNeg: tweetsWithSentiment.slice(-5)
    };

    const countOccurences = (arr, valToCount) => arr.reduce((acc, currVal) => currVal === valToCount ? acc + 1 : acc, 0);
    for (const [topicType, topicTypeOnTweets] of Object.entries(topicsOnTweets)) {
        topicTypeOnTweets.forEach(topic => occurencesOfTopics[topicType][topic] ? 
            occurencesOfTopics[topicType][topic] += countOccurences(topicTypeOnTweets, topic) 
            : occurencesOfTopics[topicType][topic] = countOccurences(topicTypeOnTweets, topic));        
    }

    return {
        sentimentRanked: sentimentRanked,
        overallSentiment: analyzer.getSentiment(wordsFromTweets),
        occurencesOfTopics: occurencesOfTopics
    };
}

setInterval(() => { // NOTE: adds a new set of data to dynamodb 
    axios.get("https://api.twitter.com/2/tweets/search/recent", { 
        headers: {
            "Authorization" : "Bearer " + process.env.TWITTER_BEARER_TOKEN
        },
        params: {
            query: twitterQuery,
            max_results: "100"
        }
    })
    .then(searchRes => {
        const resultJSON = JSON.stringify(addSentimentAndCompromiseToData(searchRes.data.data)); // NOTE: might need to be async, sequential should be fine here though)
        dynamodbDocClient.put(dynamodbInfo.GenerateKeysWithInfo(resultJSON)).promise().then(() => {
            console.log('Successfully uploaded data to DynamoDB at ' + dynamodbInfo.TableName);
        }).catch(err => console.error(err));
    })
    .catch(err => console.error(err));
}, timeBetweenQueries);

function redisCheck(key, callback) {
    return client.get(key)
        .then(res => {
            if (res) return JSON.parse(res);
            else return callback();
        })
        .catch(err => console.log(err));
}

function redisAdd(key, secondsToExpire, data) {
    client.setex(key, secondsToExpire, JSON.stringify(data)).then(succ => {
        if (succ) console.log('Successfully uploaded data to Redis at ' + key);
    }).catch(err => console.log(err));
}

router.get('/sentiment-over-time/:unix', (req, res) => {
    const timeToExpire = 60 * 10; // 10 mins
    redisCheck(req.params.unix, () => {
        return dynamodbDocClient.scan({
            TableName : dynamodbInfo.TableName,
            FilterExpression: `${dynamodbInfo.RangeUnixKey} between :lastTime and :currTime`,
            ExpressionAttributeValues: {
                ":lastTime": moment.unix(req.params.unix).unix(),
                ":currTime": moment().unix()
            }
        }).promise()
        .then(data => {
            redisAdd(req.params.unix, timeToExpire, data);
            return data;
        })
        .catch(err => res.json({ error: err })); 
    })
    .then(data => res.json(data))
    .catch(err => res.json({ error: err })); 
});

router.get('/latest', (req, res) => { 
    dynamodbDocClient.query({
        TableName: dynamodbInfo.TableName,
        KeyConditionExpression: `${dynamodbInfo.HashDateKey} = :currDate`,
        ExpressionAttributeValues: { ":currDate": moment().format('DD-MM-YYYY') },
        ScanIndexForward: "false",
        Limit: 1
    }).promise()
    .then(data => res.json(data))
    .catch(err => res.json({ error: err })); 
});

module.exports = router;
