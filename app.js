//Callback functions
var error = function(err, response, body) {
  console.log("ERROR [%s]", err);
};
var success = function(data) {
  console.log("Data [%s]", data);
};

// var Twitter = require("twitter-node-client").Twitter;

var Twit = require("twit");

var T = new Twit({
  consumer_key: "BH4FzEHkxbKTlbRLeB8zw91Me",
  consumer_secret: "1XSLd2o7SCKtm8D7d1h4HJWAXfeJELji2Bm309xmoutUrynQze",
  access_token: "739637463900114944-JdoEZqLQuh4CcqECRqpZ5D7xOdkgRTt",
  access_token_secret: "gMCGW9KMmXu70WXNMyVzQQiI5Aut3eDKS1zI82aPMK9zS",
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true // optional - requires SSL certificates to be valid.
});

//
//  tweet 'hello world!'
//
//   T.post('statuses/update', { status: 'hello world!' }, function(err, data, response) {
//     console.log(data)
//   })

//
//  search twitter for all tweets containing the word 'banana' since July 11, 2011
//

const http = require("http");
var url = require("url");

const hostname = "0.0.0.0";
const port = 3000;

const server = http.createServer(async (req, res) => {
  //   res.statusCode = 200;
  //   res.setHeader('Content-Type', 'text/plain');
  res.writeHead(200, {
    "Content-Type": "text/html",
    "Access-Control-Allow-Origin": "*"
  });

  var q = url.parse(req.url, true).query;
  var handle = q.handle;

  let graph = { nodes: [], links: [] };

  let numTweets = 5;

  function addNode(user) {
    //check if source node exists
    let node = graph.nodes.find(n => n.name == user.screen_name);
    if (!node) {
      graph.nodes.push({
        name: user.screen_name,
        group: Math.random() > 0.5 ? 4 : 1,
        friends: user.friends_count  || 0,
        followers: user.followers_count || 0,
        location:user.location || 'NA'
      });
    //   console.log(user.screen_name,user.friends_count,user.followers.count)
    }
    return;
  }

  function addEdge(source, target, type) {
    let sourceNode = graph.nodes.find(n => n.name == source);
    let targetNode = graph.nodes.find(n => n.name == target);

    let sourceIndex = graph.nodes.indexOf(sourceNode);
    let targetIndex = graph.nodes.indexOf(targetNode);
    let edge = graph.links.find(
      e => e.source == sourceIndex && e.target == targetIndex && e.type == type
    );

    if (edge) {
      //edge exists, increase count
      edge.weight = edge.weight + 1;
    } else {
      //create new edge
      graph.links.push({
        source: sourceIndex,
        target: targetIndex,
        weight: 1,
        type
      });
    }
  }

  function parse_tweets(tweets) {
    if (tweets.length == 0) {
      console.log("no tweets found");
      return;
    }
    //only adds user node if it don't already exist
    addNode(tweets[0].user);

    console.log(tweets[0].user.friends_count,tweets[0].user.followers_count)

    tweets.map(tweet => {
      //check if it's  a retweet:
      if (tweet.retweeted_status) {
        addNode(tweet.retweeted_status.user);
        addEdge(
          tweet.user.screen_name,
          tweet.retweeted_status.user.screen_name,
          "retweet"
        );
      } else {
        //check for quoted:
        if (tweet.quoted_status) {
          addNode(tweet.quoted_status.user);
          addEdge(
            tweet.user.screen_name,
            tweet.quoted_status.user.screen_name,
            "quote"
          );
        }
        //check for user mentions
        if (tweet.entities.user_mentions) {
          tweet.entities.user_mentions.map(m => {
            addNode(m);
            addEdge(tweet.user.screen_name, m.screen_name, "mention");
          });
        }
      }
    });
  }

  var fs = require("fs");

  let tweets = await T.get("statuses/user_timeline", {
    screen_name: handle,
    count: numTweets
  });

  console.log("getting tweets for ", handle);

  parse_tweets(tweets.data);

  //create copy of seed edges to iterate through;
  let seed_edges = JSON.parse(JSON.stringify(graph.links));

  //   console.log(seed_edges);
  //for each user neighbor, get their neighbors;
  let edgeMap = seed_edges.map(async edge => {
    //   console.log('target is ', edge.target)
    let tweets = await T.get("statuses/user_timeline", {
      screen_name: graph.nodes[edge.target].name,
      count: numTweets
    });

    console.log("getting tweets for ", graph.nodes[edge.target].name);
    

    parse_tweets(tweets.data);
  });

  Promise.all(edgeMap).then(d => {
    console.log("done with promises");
    //   console.log(graph)
    res.end(JSON.stringify(graph));
  });

  fs.writeFileSync(
    "tweets_" + handle + ".json",
    JSON.stringify(tweets, null, 4)
  );

  //   fs.readFile("data/twitter_config", "utf8", function(err, contents) {
  //     twitter = new Twitter(JSON.parse(contents));

  //     //Example calls
  //     twitter.getUserTimeline(
  //       { screen_name: handle, count: "5" },
  //       (error = () => res.end(JSON.stringify({ data: "problem" }))),
  //       (success = data => {
  //         //Iterate through all the mentions;

  //         let tweets = JSON.parse(data);
  //         let edges = parse_tweets(tweets);

  //         edges.filter(e=>e.type === "mention").map(mention => {
  //           twitter.getUserTimeline(
  //             { screen_name: mention.target, count: "1" },
  //             (error = () => res.end(JSON.stringify({ data: "problem" }))),
  //             (success = data => {
  //               let edges = parse_tweets(JSON.parse(data));
  //               console.log("parsed tweets for", mention.target, edges);
  //             })
  //           );
  //         });

  //         // for each mention get their latest 5 tweets and who they mention/etc...

  //         // fs.writeFileSync(
  //         //   "tweets.json",
  //         //   JSON.stringify(JSON.parse(data), null, 4)
  //         // );

  //         res.end(JSON.stringify({ edges }));
  //       })
  //     );

  //     // res.end(JSON.stringify({data:answer}))

  //     // twitter.getMentionsTimeline({ count: '10'}, error, success);

  //     // twitter.getHomeTimeline({ count: '10'}, error, success);

  //     // twitter.getReTweetsOfMe({ count: '10'}, error, success);

  //     // twitter.getTweet({ id: '1111111111'}, error, success);

  //     //
  //     // Get 10 tweets containing the hashtag haiku
  //     //

  //     // twitter.getSearch({'q':'#haiku','count': 10}, error, success);

  //     //
  //     // Get 10 popular tweets with a positive attitude about a movie that is not scary
  //     //

  //     // twitter.getSearch({'q':' movie -scary :) since:2013-12-27', 'count': 10, 'result\_type':'popular'}, error, success)
  //   });

  //  console.log(txt)
  //   res.end(txt);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

// var twitter = new Twitter();
