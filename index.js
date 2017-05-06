var express = require('express')
var twitter = require('twitter')
var app = express();
var swearjar = require('swearjar')
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
const getTweet = "statuses/show"
const getUser = "users/lookup"
const getTimeline = "statuses/user_timeline"
var tokens = require('./tokens.json')
var routes = require('./routes.js')

var client = new twitter({
    consumer_key: tokens.c_key,
    consumer_secret: tokens.c_sec,
    access_token_key: tokens.atk,
    access_token_secret: tokens.atks
})

// get all data/stuff of the body (POST) parameters
// parse application/json 
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public'));

app.use('/routes', routes)

app.get('/error', (req, res) => {
    res.sendFile(__dirname + '/public/views/error.html')
})

app.get('/:name', (req, res) => {
    let term = req.params.name
    let userTweets = []
    res.sendfile('./public/views/user.html');
    getTweets(term, null, userTweets, () => {
        let profaneTweets = []
        console.log(userTweets)
        if (userTweets.length === 0) {
            console.log("no tweets gotten, was there an error?")
            res.redirect('/error')
        } else {
            //console.log(Object.keys(userTweets[0]))
            console.log("Length of tweets object: " + userTweets.length)
            for (i = 0; i < userTweets.length; i++) {
                if (swearjar.profane(userTweets[i].text)) {
                    profaneTweets.push(userTweets[i])
                }
            }
            //res.send("Number of Profane Tweets: " + profaneTweets.length)

            setTimeout(() => {
                console.log("Number of tweets containing profanity: " + profaneTweets.length)
                for (i = 0; i <= profaneTweets.length - 1; i++) {
                    console.log("Index: " + i)
                    console.log("Created At: " + profaneTweets[i].created_at)
                    console.log("Tweet ID: " + profaneTweets[i].id)
                    console.log("Tweet Content: " + profaneTweets[i].text)
                    if (profaneTweets[i].in_reply_to_status_id !== null) {
                        console.log("In reply to ID: " + profaneTweets[i].in_reply_to_status_id)
                        console.log("In reply to user ID: " + profaneTweets[i].in_reply_to_user_id)
                        console.log("In reply to Screen Name: " + profaneTweets[i].in_reply_to_screen_name)
                    }
                }
            }, 5000)
        }
    })
    // client.get(getTimeline, { screen_name: req.params.name, count: 200 }, (error, user, response) => {
    //     if (error) return res.send(error)
    //     console.log(user)
    //     console.log(Object.keys(user).length - 1)
    //     res.send("Lowest ID: " + user[Object.keys(user).length - 1].id)
    //     //console.log(user.statusses_count)
    //     //console.log(response)
    //     //var obj = JSON.parse(response)
    // })
})

app.get('*', (req, res) => {
    res.sendfile('./public/views/index.html');
})

function getTweets(term, maxID = null, tweetList, callback) {
    if (maxID === null) {
        client.get(getTimeline, { screen_name: term, count: 200, include_rts: true }, (error, user, response) => {
            if (user[0] === undefined) {
                tweetList = null
                return callback(tweetList)
            }
            //console.log(Object.keys(user))
            //let tTemp = JSON.parse(user)
            console.log("Status count: " + user[0].user.statuses_count)
            for (i = 0; i < Object.keys(user).length; i++) {
                tweetList.push(user[i])
            }
            console.log("Temp array length: " + Object.keys(user).length)
            if (tweetList.length < user[0].user.statuses_count) {
                getTweets(term, user[Object.keys(user).length - 1].id, tweetList, callback)
            } else {
                console.log("End of tweets!")
                return callback(tweetList)
            }
        })
    } else {
        client.get(getTimeline, { screen_name: term, count: 200, include_rts: true, max_id: maxID }, (error, user, response) => {
            if (error) {
                tweetList = null
                return callback(tweetList)
            } else if (user[0] === undefined) {
                console.log("Looks like we're out of retrievable tweets!")
                return callback(tweetList)
            }
            console.log("Length of tweet array: " + tweetList.length)
            // console.log(Object.keys(user))
            // console.log(Object.keys(user).length)
            for (i = 0; i < Object.keys(user).length; i++) {
                tweetList.push(user[i])
            }
            console.log("Temp array length: " + Object.keys(user).length)
            if (tweetList.length < user[0].user.statuses_count) {
                getTweets(term, user[Object.keys(user).length - 1].id, tweetList, callback)
            } else {
                console.log("End of tweets!")
                return callback(tweetList)
            }
        })
    }
}

app.listen(3000)