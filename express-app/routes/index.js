const express = require('express');
const router = express.Router();
const natural = require("natural");
const Twitter = require('twitter');

const user = new Twitter({ // NOTE: using app auth here because apparently it has higher rate limits (I think this means query limit)
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

const response = await user.getBearerToken();
const app = new Twitter({
    bearer_token: response.access_token
});

router.get('/', (req, res) => {
    
});

module.exports = router;
