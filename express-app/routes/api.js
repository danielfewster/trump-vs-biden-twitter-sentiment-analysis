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

const apiURL = "https://api.twitter.com/2/tweets/search/recent"
const timeBetweenQueries = 9000; // ms

const asyncRedis = require("async-redis"); // NOTE: async wrapper package for redis package
const client = asyncRedis.createClient();
client.on("error", err => console.error(err));

const AWS = require('aws-sdk');
const { request } = require('http');
AWS.config.getCredentials(err => { if (err) console.log(err.stack); });
AWS.config.update({ region: "ap-southeast-2" });

const dynamodb = new AWS.DynamoDB();
const dynamodbDocClient = new AWS.DynamoDB.DocumentClient();

function axiosOptions (candidate) {
    return{
        headers: {
            "Authorization" : "Bearer " + process.env.TWITTER_BEARER_TOKEN
        },
        params: {
            query: candidate + " election",
            max_results: "50"
        }
    }
}

function GenerateKeys (candidate) {
    return {
        TableName: "TwitterData" + candidate,
        Item: {
            "dateOfQuery" : moment().format('DD-MM-YYYY'),
            "unixTimeOfQuery" : moment().unix()
        }
    }
}
function GenerateKeysWithInfo (info, candidate) {
    let temp = GenerateKeys(candidate); temp.Item.info = info; return temp;
}

function dynamodbTable(candidate) {
    let dbInfo = {
        TableName: "TwitterData" + candidate, 
        HashDateKey: "dateOfQuery", 
        RangeUnixKey: "unixTimeOfQuery", 
    }
    return (
        dynamodb.createTable({
            TableName : dbInfo.TableName,
            KeySchema: [       
                { AttributeName: dbInfo.HashDateKey, KeyType: "HASH"},
                { AttributeName: dbInfo.RangeUnixKey, KeyType: "RANGE"} 
            ],
            AttributeDefinitions: [    
                { AttributeName: dbInfo.HashDateKey, AttributeType: "S" },
                { AttributeName: dbInfo.RangeUnixKey, AttributeType: "N" }
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
        })
    )
}
dynamodbTable('Trump');
dynamodbTable('Biden');


function addSentimentAndCompromiseToData(twitterData) {
    let wordsFromTweets = [];
    let tweetsWithSentiment = [];
    let topicsOnTweets = { 
        places: [],
        people: [],
    };
    let occurencesOfTopics = { // NOTE: I wish .topics() came organised -.- 
        places: [{}],
        people: [{}],
    };

    twitterData.forEach(tweet => {
        const tweetDoc = compromise(tweet.text);
        tweetDoc.places().map(place => topicsOnTweets.places.push(place.text('reduced').trim()));
        tweetDoc.people().map(person => topicsOnTweets.people.push(person.text('reduced').trim()));

        const wordsFromText = tokenizer.tokenize(tweet.text);
        const sentiment = Math.round(analyzer.getSentiment(wordsFromText) * 100)
        if(sentiment != 0) {
            wordsFromText.forEach(word => wordsFromTweets.push(word));
        }
        tweetsWithSentiment.push({
            id: tweet.id,
            text: tweet.text,
            sentiment: sentiment 
        });  
    });
    
    tweetsWithSentiment.sort((a, b) => b.sentiment - a.sentiment);

    const sentimentRanked = {
        topPos: tweetsWithSentiment.slice(0, 5),
        topNeg: tweetsWithSentiment.slice(0).slice(-5)
    };

    const countOccurences = (arr, valToCount) => arr.reduce((acc, currVal) => currVal === valToCount ? acc + 1 : acc, 0);
    for (const [topicType, topicTypeOnTweets] of Object.entries(topicsOnTweets)) {
        topicTypeOnTweets.forEach(topic => occurencesOfTopics[topicType][topic] ? 
            occurencesOfTopics[topicType][topic] += countOccurences(topicTypeOnTweets, topic) 
            : occurencesOfTopics[topicType][topic] = countOccurences(topicTypeOnTweets, topic));        
    }


    return {
        sentimentRanked: sentimentRanked,
        overallSentiment: analyzer.getSentiment(wordsFromTweets) * 100,
        occurencesOfTopics: occurencesOfTopics,
    };
}
function pushTwitterData(candidate) {
    return axios.get(apiURL, axiosOptions(candidate))
    .then(searchRes => {
        const resultJSON = JSON.stringify(addSentimentAndCompromiseToData(searchRes.data.data)); // NOTE: might need to be async, sequential should be fine here though)
        dynamodbDocClient.put(GenerateKeysWithInfo(resultJSON, candidate)).promise().then(() => {
            console.log('Successfully uploaded data to DynamoDB at  TwitterData' + candidate);
        }).catch(err => console.error(err));  
    })
    .catch(err => console.error(err))   
}

setInterval(() => { // NOTE: adds a new set of data to dynamodb 
    pushTwitterData("Trump");
    pushTwitterData("Biden");
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


  

router.get('/api/overall-sentiment/:unix/:candidate', (req, res) => {
    const timeToExpire = 60 * 10; // 10 mins

    redisCheck(req.params.unix + req.params.candidate , () => {
        return dynamodbDocClient.scan({
            TableName : "TwitterData" + req.params.candidate,
            FilterExpression: `unixTimeOfQuery between :lastTime and :currTime`,
            ExpressionAttributeValues: {
                ":lastTime": moment.unix(req.params.unix).unix(),
                ":currTime": moment().unix()
            }
        }).promise()
        .then(data => {
            redisAdd(req.params.unix + req.params.candidate, timeToExpire, data);
            return data;
        })
        .catch(err => res.json({ error: err })); 
    })
    .then(data => {            
            let topPosSentiment = [];
            let topNegSentiment = [];
            let oSentiment = 0;
            let tempTopics = {
                places: [],
                people: [],
            };

            let finalTopics = {
                places: {},
                people: {},
            };

            data.Items.forEach(object => {
                    let o = JSON.parse(object.info);
                    o.sentimentRanked.topPos.forEach(e => topPosSentiment.push(e));
                    o.sentimentRanked.topNeg.forEach(e => topNegSentiment.push(e));
                    oSentiment = oSentiment + o.overallSentiment;
                    tempTopics.places.push(o.occurencesOfTopics.places);
                    tempTopics.people.push(o.occurencesOfTopics.people);
                }  
            )


            // why the fuck doesn't this work.
            // I honestly can't see why this won't return the value I want. 
            // I have tried to run this and also pass it directly to the final topics variable. 
            const countTopics = data => {
                let result = {}; //(1)
              
                data.forEach(topic => { //(2)
                  for (let [key, value] of Object.entries(topic)) { //(3)
                    if (result[key]) { //(4)
                      result[key] += value; //(5)
                    } else { //(6)
                      result[key] = value;
                    }
                   }
                   console.log(result); // this gives me the result that I want on the final pass
                });
                console.log(result); // this has no value and wont console log WTF!!!
                return result; //(7)
            };
              
            const people = countTopics(tempTopics.people);
               
            
            let uniqPos = topPosSentiment.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                t.id === thing.id
                ))
            )
            let uniqNeg = topNegSentiment.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                t.id === thing.id
                ))
            )
            let sentimentRanked = {
                topPos: uniqPos.sort((a, b) => b.sentiment - a.sentiment).slice(0, 5),
                topNeg: uniqNeg.sort((a, b) => b.sentiment - a.sentiment).slice(0).slice(-5)
            }
            oSentiment = oSentiment / data.Items.length
            let processedData = {
                sentimentRanked: sentimentRanked,
                overallSentiment: oSentiment,
                occurencesOfTopics: finalTopics,
            }
            res.json(processedData);
    })
    .catch(err => res.json({ error: err })); 
});

router.get('/api/latest/:candidate', (req, res) => { 
    dynamodbDocClient.query({
        TableName: "TwitterData" + req.params.candidate,
        KeyConditionExpression: `unixTimeOfQuery = :currDate`,
        ExpressionAttributeValues: { ":currDate": moment().format('DD-MM-YYYY') },
        ScanIndexForward: "false",
        Limit: 1
    }).promise()
    .then(data => res.json(data))
    .catch(err => res.json({ error: err })); 
});

module.exports = router;
