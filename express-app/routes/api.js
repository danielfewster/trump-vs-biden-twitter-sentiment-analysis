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

const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    accessSecretKey: process.env.AWS_SECRET_KEY,
    region: "ap-southeast-2"
});

const dynamodb = new AWS.DynamoDB();
const dynamodbDocClient = new AWS.DynamoDB.DocumentClient();

const dynamodbInfo = {};
const twitterQueriesToTrack = ["Trump", "Biden"];
twitterQueriesToTrack.forEach(query => dynamodbInfo[query] = createDynamoDB(query));

const apiURL = "https://api.twitter.com/2/tweets/search/recent";
const timeBetweenQueries = 900000; // ms

const asyncRedis = require("async-redis");
const asyncRedisClient = asyncRedis.createClient({ host: "redis", port: 6379 });
asyncRedisClient.on("error", err => console.error(err));

function createDynamoDB(candidate) {
    const info = {
        TableName: "Twitter" + candidate, 
        HashDateKey: "dateOfQuery",
        RangeUnixKey: "unixTimeOfQuery", 
        GenerateKeys: function() {
            return {
                TableName: this.TableName,
                Item: {
                    [this.HashDateKey] : moment().format('DD-MM-YYYY'),
                    [this.RangeUnixKey] : moment().unix()
                }
            }
        },
        GenerateKeysWithInfo: function(info) {
            let temp = this.GenerateKeys(); temp.Item.info = info; return temp;
        },
        axiosOptions: {
            headers: {
                "Authorization" : "Bearer " + process.env.TWITTER_BEARER_TOKEN
            },
            params: {
                query: candidate + " election",
                max_results: Math.round(100 / twitterQueriesToTrack.length).toString() // NOTE: keep this split under 100
            }
        }
    };

    dynamodb.createTable({
        TableName : info.TableName,
        KeySchema: [       
            { AttributeName: info.HashDateKey, KeyType: "HASH"},
            { AttributeName: info.RangeUnixKey, KeyType: "RANGE"} 
        ],
        AttributeDefinitions: [    
            { AttributeName: info.HashDateKey, AttributeType: "S" },
            { AttributeName: info.RangeUnixKey, AttributeType: "N" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 5, 
            WriteCapacityUnits: 5
        }
    }, err => {
        if (err)
            if (err.code === "ResourceInUseException") console.log(`The DynamoDB table '${info.TableName}' already exists`);
            else console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        else console.log(`Created DynamoDB table: ${info.TableName}`);
    });

    return info;
}

function addSentimentAndCompromiseToData(twitterData) {
    let wordsFromTweets = [];
    let tweetsWithSentiment = [];

    let topicsOnTweets = { 
        places: [],
        people: [],
    };
    
    let occurencesOfTopics = {
        places: {},
        people: {},
    };

    twitterData.forEach(tweet => {
        const tweetDoc = compromise(tweet.text);
        tweetDoc.places().map(place => topicsOnTweets.places.push(place.text('reduced').trim()));
        tweetDoc.people().map(person => topicsOnTweets.people.push(person.text('reduced').trim()));

        const wordsFromText = tokenizer.tokenize(tweet.text);
        const sentiment = Math.round(analyzer.getSentiment(wordsFromText) * 100);

        tweetsWithSentiment.push({
            id: tweet.id,
            text: tweet.text,
            sentiment: sentiment
        });
    });

    let filteredTweets = tweetsWithSentiment.filter((thing, index, self) =>
        index === self.findIndex(t => t.id === thing.id || t.text === thing.text)
    );
    
    filteredTweets.sort((a, b) => b.sentiment - a.sentiment);

    const sentimentRanked = {
        topPos: filteredTweets.slice(0, 5),
        topNeg: filteredTweets.slice(-5).reverse()
    };

    [...sentimentRanked.topPos, ...sentimentRanked.topNeg].forEach(tweet => {
        tokenizer.tokenize(tweet.text).forEach(word => wordsFromTweets.push(word));
    });

    const countOccurences = (arr, valToCount) => arr.reduce((acc, currVal) => currVal === valToCount ? acc + 1 : acc, 0);
    for (const [topicType, topicTypeOnTweets] of Object.entries(topicsOnTweets)) {
        topicTypeOnTweets.forEach(topic => occurencesOfTopics[topicType][topic] ? 
            occurencesOfTopics[topicType][topic] += countOccurences(topicTypeOnTweets, topic) 
            : occurencesOfTopics[topicType][topic] = countOccurences(topicTypeOnTweets, topic));        
    }

    return {
        sentimentRanked: sentimentRanked,
        overallSentiment: analyzer.getSentiment(wordsFromTweets) * 100,
        occurencesOfTopics: {
            people: Object.entries(occurencesOfTopics.people).sort((a, b) => b[1] - a[1]).slice(0, 5), 
            places: Object.entries(occurencesOfTopics.places).sort((a, b) => b[1] - a[1]).slice(0, 5)
        }
    }
}

function pushTwitterData(candidate) { // NOTE: add raw tweets to the db to run analysis on during route call
    return axios.get(apiURL, dynamodbInfo[candidate].axiosOptions)
        .then(searchRes => {
            const resultJSON = JSON.stringify(searchRes.data.data);
            dynamodbDocClient.put(dynamodbInfo[candidate].GenerateKeysWithInfo(resultJSON)).promise().then(() => {
                console.log(`Successfully uploaded data to DynamoDB at ${dynamodbInfo[candidate].TableName}`);
            }).catch(err => console.error(err));
        })
        .catch(err => console.error(err));
}

setInterval(() => { // NOTE: adds a new set of data to dynamodb 
    Object.keys(dynamodbInfo).forEach(table => pushTwitterData(table));
}, timeBetweenQueries);

function redisCheck(key, callback) {
    return asyncRedisClient.get(key)
        .then(res => {
            if (res) return JSON.parse(res);
            else return callback();
        })
        .catch(err => console.log(err));
}

function redisAdd(key, secondsToExpire, data) {
    asyncRedisClient.setex(key, secondsToExpire, JSON.stringify(data)).then(succ => {
        if (succ) console.log('Successfully uploaded data to Redis at ' + key);
    }).catch(err => console.log(err));
}

function generateResponse(data) { // NOTE: get all tweets over a time period and run the analysis on them collectively
    let tweets = [];
    data.Items.forEach(o => JSON.parse(o.info).forEach(tweet => tweets.push(tweet)));
    return addSentimentAndCompromiseToData(tweets);
}

router.get('/api/no-redis-sentiment/:unix/:candidate', (req, res) => {
    return dynamodbDocClient.scan({
        TableName : dynamodbInfo[req.params.candidate].TableName,
        FilterExpression: `${dynamodbInfo[req.params.candidate].RangeUnixKey} between :lastTime and :currTime`,
        ExpressionAttributeValues: {
            ":lastTime": moment.unix(req.params.unix).unix(),
            ":currTime": moment().unix()
        }
    }).promise()
    .then(data => generateResponse(data))
    .then(data => res.json(data))
    .catch(err => res.json({ error: err }));
});

router.get('/api/redis-sentiment/:unix/:candidate', (req, res) => {
    const timeToExpire = 60 * 6 * 10; // 60 mins
    const redisKey = moment.unix(req.params.unix).format("dddH") + req.params.candidate;

    redisCheck(redisKey, () => {
        return dynamodbDocClient.scan({
            TableName : dynamodbInfo[req.params.candidate].TableName,
            FilterExpression: `${dynamodbInfo[req.params.candidate].RangeUnixKey} between :lastTime and :currTime`,
            ExpressionAttributeValues: {
                ":lastTime": moment.unix(req.params.unix).unix(),
                ":currTime": moment().unix()
            }
        }).promise()
        .then(data => generateResponse(data))
        .then(data => {
            redisAdd(redisKey, timeToExpire, data);
            return data;
        });
    })
    .then(data => res.json(data))
    .catch(err => res.json({ error: err }));
});

module.exports = router;
