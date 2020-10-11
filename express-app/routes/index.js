const express = require('express');
const router = express.Router();
const axios = require('axios');

const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const Analyzer = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

router.get('/search', (req, res) => {
    const url = "https://api.twitter.com/2/tweets/search/recent";

    return axios.get(url, {
        headers: {
            "Authorization" : "Bearer " + process.env.TWITTER_BEARER_TOKEN
        },
        params: {
            query: "trump",
            max_results: "100"
        }
    })
    .then(searchRes => searchRes.data.data)
    .then(searchRes => {
        let wordsFromTweets = [];
        let tweetsWithSentiment = [];

        searchRes.forEach(tweet => {
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
