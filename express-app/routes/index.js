const express = require('express');
const router = express.Router();
const axios = require('axios');

const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const Analyzer = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

const asyncRedis = require("async-redis"); // NOTE: async wrapper package for redis package
const client = asyncRedis.createClient();
client.on("error", err => console.error(err));

const AWS = require('aws-sdk');
AWS.config.getCredentials(err => { if (err) console.log(err.stack); });

function getQueryResult(query) {
    const S3 = new AWS.S3({ apiVersion: '2006-03-01' });
    const bucketName = "a2-twitter-feed-bucket";
    const S3Key = query;
    const redisKey = `twitterSearchRes:${query}`;
    const redisSecondsToExpire = 60 * 60 * 3;

    return client.get(redisKey)
        .then(redisRes => {
            if (redisRes) return JSON.parse(redisRes);
            else {
                const getS3Result = S3.getObject({
                    Bucket: bucketName,
                    Key: S3Key
                }).promise();
                
                return getS3Result.then(s3Res => {
                    const resultJSON = JSON.parse(s3Res.Body);
                    client.setex(redisKey, redisSecondsToExpire, JSON.stringify(resultJSON)).then(succ => {
                        if (succ) console.log('Successfully uploaded data to Redis at ' + redisKey);
                    }).catch(err => console.log(err)); 
                    return resultJSON; 
                })
                .catch(() => {
                    return axios.get("https://api.twitter.com/2/tweets/search/recent", { 
                        headers: {
                            "Authorization" : "Bearer " + process.env.TWITTER_BEARER_TOKEN
                        },
                        params: {
                            query: query,
                            max_results: "100"
                        }
                    })
                    .then(searchRes => {
                        const resultJSON = JSON.stringify(searchRes.data.data);

                        client.setex(redisKey, redisSecondsToExpire, resultJSON).then(succ => {
                            if (succ) console.log('Successfully uploaded data to Redis at ' + redisKey);
                        }).catch(err => console.log(err)); 

                        S3.putObject({ 
                            Bucket: bucketName, Key: S3Key, Body: resultJSON 
                        }).promise().then(() => {
                            console.log('Successfully uploaded data to S3 Bucket at ' + bucketName + '/' + S3Key);
                        }).catch(err => console.error(err));

                        return searchRes.data.data;
                    })
                    .catch(err => console.error(err));
                });
            }
        })
        .catch(err => console.log(err));
}

router.get('/search/:query', (req, res) => {
    getQueryResult(req.params.query).then(searchData => {
        let wordsFromTweets = [];
        let tweetsWithSentiment = [];

        searchData.forEach(tweet => {
            const wordsFromText = tokenizer.tokenize(tweet.text);
            tweetsWithSentiment.push({
                id: tweet.id,
                text: tweet.text,
                sentiment: analyzer.getSentiment(wordsFromText)
            });
            wordsFromText.forEach(word => wordsFromTweets.push(word));
        });

        return Promise.all([wordsFromTweets, tweetsWithSentiment]);
    })
    .then(([wordsFromTweets, tweetsWithSentiment]) => {
        res.json({
            tweetsWithSentiment: tweetsWithSentiment,
            overallSentiment: analyzer.getSentiment(wordsFromTweets)
        });
    })
    .catch(err => console.log(err));
});

module.exports = router;
