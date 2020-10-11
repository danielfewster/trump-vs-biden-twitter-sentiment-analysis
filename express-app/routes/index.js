const express = require('express');
const router = express.Router();
const natural = require("natural");
const axios = require('axios');



router.get('/search', async (req, res) => {
   
    const url = "https://api.twitter.com/2/tweets/search/recent?query=trump"

    axios.get(url, {
        headers: { "Authorization" : "Bearer " + process.env.TWITTER_BEARER_TOKEN}
    })
    .then(res => console.log(res.data.data))

})


module.exports = router;
