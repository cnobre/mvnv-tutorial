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


const http = require("http");
var url = require("url");

const hostname = "0.0.0.0";
const port = 5000;

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

  let numTweets = 30;

  function addNode(user) {
    //check if source node exists
    let node = graph.nodes.find(n => n.name == user.screen_name);
    if (!node) {
      graph.nodes.push({
        name: user.screen_name,
        id: user.id_str,
        tweets:user.statuses_count,
        profileColor:user.profile_background_color,
        group: Math.random() > 0.5 ? 4 : 1,
        friends: user.friends_count  || 0,
        followers: user.followers_count || 0,
        location:user.location || 'NA'
      });
    //   console.log(user.screen_name,user.friends_count,user.followers.count)
    }
    return;
  }

  function addEdgeByName(source, target, type) {
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


  function addEdgeById(sourceID, targetID, type) {
    let sourceNode = graph.nodes.find(n => n.id == sourceID);
    let targetNode = graph.nodes.find(n => n.id == targetID);

    let sourceIndex = graph.nodes.indexOf(sourceNode);
    let targetIndex = graph.nodes.indexOf(targetNode);
  
    // console.log(sourceIndex,targetIndex)
    if (sourceIndex>-1 && targetIndex>-1) {
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
    //only adds user node if it doesn't already exist
    addNode(tweets[0].user);

    tweets.map(tweet => {
      //check if it's  a retweet:
      if (tweet.retweeted_status) {
        addNode(tweet.retweeted_status.user);
        addEdgeByName(
          tweet.user.screen_name,
          tweet.retweeted_status.user.screen_name,
          "retweet"
        );
      } else {
        //check for quoted:
        if (tweet.quoted_status) {
          addNode(tweet.quoted_status.user);
          addEdgeByName(
            tweet.user.screen_name,
            tweet.quoted_status.user.screen_name,
            "quote"
          );
        }
        //check for user mentions
        if (tweet.entities.user_mentions) {
          tweet.entities.user_mentions.map(m => {
            addNode(m);
            addEdgeByName(tweet.user.screen_name, m.screen_name, "mention");
          });
        }
      }
    });
  }

  var fs = require("fs");

  let tweets = await T.get("statuses/user_timeline", {
    screen_name: handle,
    count: numTweets
  }).catch(function (err) {
    console.log('caught error', err.stack)
  })

  

//   console.log('folowers are ', followers)

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
    })
    .catch(function (err) {
        console.log('caught error', err.stack)
      })

    console.log("getting tweets for ", graph.nodes[edge.target].name);
    

    parse_tweets(tweets.data);
  });

  //create any following edges between existing nodes

//   graph.nodes.map(async n=>{

//     //   let followers = await T.get('followers/ids', { screen_name: handle });
//   let followers = await T.get('friends/ids', { screen_name: n.name });


// //   fs.writeFileSync(
// //   "friends_" + handle + ".json",
// //   JSON.stringify(followers, null, 4)
// // );

// followers.data.ids.map(followerId=>{
//   let seedNode = graph.nodes.find(n=>n.name == n.name);
//   addEdgeById(seedNode.id,followerId,'follower')
// })

//   })

  Promise.all(edgeMap).then(d => {
    console.log("done with promises");

    //sort nodes by degree;
graph.nodes.map((n,i)=>{
    let nodeEdges = graph.links.filter(l=> l.source == i || l.target == i);
     n.degree = nodeEdges.length;
    // n.keep =  nodeEdges.length>3;
})

graph.nodes.sort((a,b)=>{
    a.name == handle.slice() ? 1 : 
    a.degree>b.degree ? 1: -1

})
graph.nodes.map((n,i)=>i<10 ? n.keep = true : n.keep = false)

//only keep top 10 nodes;
let filteredNodes = graph.nodes.slice(0,10);

graph.links = graph.links.filter(l=>graph.nodes[l.source].keep && graph.nodes[l.target].keep);
// let filteredNodes = graph.nodes.filter(n=>n.keep)

console.log('original nodes',graph.nodes.length, 'filtered nodes', filteredNodes.length)

graph.links.map(l=>{
    l.source = filteredNodes.indexOf(graph.nodes[l.source])
    l.target = filteredNodes.indexOf(graph.nodes[l.target])
})
graph.nodes = filteredNodes;

// console.log(graph.nodes)
    //   console.log(graph)
    res.end(JSON.stringify(graph));
  });



});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

