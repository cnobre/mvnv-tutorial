//Callback functions
var error = function (err, response, body) {
    console.log('ERROR [%s]', err);
};
var success = function (data) {
    console.log('Data [%s]', data);
};

var Twitter = require('twitter-node-client').Twitter;

//Get this data from your twitter apps dashboard
// {
//     "consumerKey": "BH4FzEHkxbKTlbRLeB8zw91Me",
//     "consumerSecret": "1XSLd2o7SCKtm8D7d1h4HJWAXfeJELji2Bm309xmoutUrynQze",
//     "accessToken": "739637463900114944-JdoEZqLQuh4CcqECRqpZ5D7xOdkgRTt",
//     "accessTokenSecret": "gMCGW9KMmXu70WXNMyVzQQiI5Aut3eDKS1zI82aPMK9zS",
//     "callBackUrl": "http://127.0.0.1:8080"
// }

// make a directory in the root folder of your project called data
// copy the node_modules/twitter-node-client/twitter_config file over into data/twitter_config`
// Open `data/twitter_config` and supply your applications `consumerKey`, 'consumerSecret', 'accessToken', 'accessTokenSecret', 'callBackUrl' to the appropriate fields in your data/twitter_config file

var twitter;
// var fs = require('fs');
//     fs.readFile('data/twitter_config', 'utf8', function(err, contents) {
//          twitter = new Twitter(JSON.parse(contents));


//                 //Example calls

//         twitter.getUserTimeline({ screen_name: 'BoyCook', count: '10'}, error, success);

//         twitter.getMentionsTimeline({ count: '10'}, error, success);

//         twitter.getHomeTimeline({ count: '10'}, error, success);

//         twitter.getReTweetsOfMe({ count: '10'}, error, success);

//         twitter.getTweet({ id: '1111111111'}, error, success);


//         //
//         // Get 10 tweets containing the hashtag haiku
//         //

//         twitter.getSearch({'q':'#haiku','count': 10}, error, success);

//         //
//         // Get 10 popular tweets with a positive attitude about a movie that is not scary 
//         //

//         twitter.getSearch({'q':' movie -scary :) since:2013-12-27', 'count': 10, 'result\_type':'popular'}, error, success)

//     });


    const http = require('http');
    var url = require('url');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
  res.writeHead(200, {'Content-Type': 'text/html'});

  var q = url.parse(req.url, true).query;
  var handle = q.handle;

  var twitter;
var fs = require('fs');
    fs.readFile('data/twitter_config', 'utf8', function(err, contents) {
         twitter = new Twitter(JSON.parse(contents));


                //Example calls
        let answer = twitter.getUserTimeline({ screen_name:handle, count: '1'}, error, success)
        res.end(answer);

        // twitter.getMentionsTimeline({ count: '10'}, error, success);

        // twitter.getHomeTimeline({ count: '10'}, error, success);

        // twitter.getReTweetsOfMe({ count: '10'}, error, success);

        // twitter.getTweet({ id: '1111111111'}, error, success);


        //
        // Get 10 tweets containing the hashtag haiku
        //

        // twitter.getSearch({'q':'#haiku','count': 10}, error, success);

        //
        // Get 10 popular tweets with a positive attitude about a movie that is not scary 
        //

        // twitter.getSearch({'q':' movie -scary :) since:2013-12-27', 'count': 10, 'result\_type':'popular'}, error, success)

    });


//  console.log(txt)
//   res.end(txt);
});



server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


// var twitter = new Twitter();

