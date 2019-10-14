//Callback functions
var error = function (err, response, body) {
  console.log("ERROR [%s]", err);
};
var success = function (data) {
  console.log("Data [%s]", data);
};

// var Twitter = require("twitter-node-client").Twitter;

var Twit = require("twit");

var cytoscape = require('cytoscape');

var T = new Twit({
  consumer_key: "BH4FzEHkxbKTlbRLeB8zw91Me",
  consumer_secret: "1XSLd2o7SCKtm8D7d1h4HJWAXfeJELji2Bm309xmoutUrynQze",
  access_token: "739637463900114944-JdoEZqLQuh4CcqECRqpZ5D7xOdkgRTt",
  access_token_secret: "gMCGW9KMmXu70WXNMyVzQQiI5Aut3eDKS1zI82aPMK9zS",
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: false // optional - requires SSL certificates to be valid.
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
    let node = graph.nodes.find(n => n.screenName == user.screen_name);
    if (!node) {
      let newNode =
      {
        name: user.name.slice(0, 30),
        screenName: user.screen_name,
        id: user.id_str,
        tweets: user.statuses_count || Math.round(Math.random() * 100),
        profileColor: user.profile_background_color,
        friends: user.friends_count || Math.round(Math.random() * 100),
        followers: user.followers_count || Math.round(Math.random() * 100),
        location: user.location || 'NA'
      };

      //add flags for randomly generated values: 
      if (!user.statuses_count) {
        newNode.random_tweets = true;
      }
      if (!user.friends_count) {
        newNode.random_friends = true;
      }
      if (!user.followers_count) {
        newNode.random_followers = true;
      }


      graph.nodes.push(newNode);
      //   console.log(user.screen_name,user.friends_count,user.followers.count)
    }
    return;
  }

  function addEdgeByName(source, target, type) {
    let sourceNode = graph.nodes.find(n => n.screenName == source);
    let targetNode = graph.nodes.find(n => n.screenName == target);

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
        sourceNode,
        targetNode,
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
    if (sourceIndex > -1 && targetIndex > -1) {
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

    // console.log('added', tweets[0].user, graph.nodes[0].screenName)
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
    await T.get("statuses/user_timeline", {
      screen_name: graph.nodes[edge.target].screenName,
      count: numTweets
    })
      .catch(function (err) {
        console.log('caught error', err)
      })
      .then(function (tweets) {
        // `result` is an Object with keys "data" and "resp".
        // `data` and `resp` are the same objects as the ones passed
        // to the callback.
        // See https://github.com/ttezel/twit#tgetpath-params-callback
        // for details.

        if (tweets) {
          // console.log("getting tweets for ", graph.nodes[edge.target].name);
          parse_tweets(tweets.data);
        }


      })


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

    var cy = cytoscape({
      elements: {
        nodes: [],
        edges: []
      }
    });

    //add nodes and edges to cytoscape graph;


    // let eles = cy.add(
    //   graph.nodes.map(n=>{n.id = n.screenName; return {group:'nodes',data:n}}).concat(
    //     graph.links.map((l,i)=>{l.id = 'e'+i; return {group:'edges',data:{id:l.id,source:graph.nodes[l.source].id,target:graph.nodes[l.target].id}}})   

    //   )   
    // );

    // console.log(cy.nodes().length)
    // console.log(cy.edges().length)


    // const comp = cy.elements().components(); 
    // // console.log(comp[0].nodes()); 
    // console.log(comp[0].length)

    // let tree = cy.elements().kruskal();
    // console.log(tree.nodes().length);
    // console.log(tree.edges().length)

    // var ks = cy.elements().kargerStein();

    //   // console.log(ks.cut.select());
    //   console.log(ks.partition1.nodes().length)
    //   console.log(ks.partition2.nodes().length)

    //   var dcn = cy.$().dcn();


    // console.log(cy.nodes())

    // var pr = eles.pageRank();

    // console.log('nobre rank: ' + pr.rank('#carolinanobre84'));

    // console.log(eles.componentsOf(cy.getElementById('#carolinanobre84')))

    // console.log(cy.getElementById('#carolinanobre84').component())
    // console.log(eles.components())

    // markovCluster({
    //   attributes: [
    //     function( edge ){ return edge.data('closeness'); }
    //   ]
    // });

    // console.log(cy.edges('[source = "carolinanobre84"]'))

    let nodeCap;
       //remove self edges; 
       graph.links = graph.links.filter(l => l.source !== l.target);


    let sortNsnip = (num) => {

      //only keep top X nodes;
      nodeCap = num 

      //sort nodes by degree;
      graph.nodes.map((n, i) => {
        let nodeEdges = graph.links.filter(l => l.source == i || l.target == i);
        n.degree = nodeEdges.length;
        //  n.dcn = dcn.degree('#' + n.screenName);
        //  n.dc = cy.$().dc({ root: '#'+n.screenName }).degree
        // n.keep =  nodeEdges.length>3;
      })

      // console.log(handle.slice(1))
      graph.nodes.sort((a, b) => {
        if (a.screenName == 'carolinanobre84' || b.screenName == 'carolinanobre84'){
          console.log(handle.slice(1))
        }
        // console.log(a.screenName,handle.slice(1))
        if (a.screenName == handle.slice(1) || b.screenName == handle.slice(1)) {
          console.log(' keeping ' , a.screenName)
          return -2
        }
        // if (a.screenName == 'Oprah') {
        //   return -1.5
        // }
        // if (a.random_followers) {
        //   return 2;
        // }
        // return a.dc > b.dc ? -1 : 1
        return a.degree > b.degree ? -1 : 1

      })

      graph.nodes.map((n, i) => i < nodeCap ? n.keep = true : n.keep = false)

   
      let filteredNodes = graph.nodes.slice(0, nodeCap);
      console.log(filteredNodes[0])


      graph.links = graph.links.filter(l => l.sourceNode.keep && l.targetNode.keep);

      graph.links.map(l => {
        l.source = filteredNodes.indexOf(l.sourceNode)
        l.target = filteredNodes.indexOf(l.targetNode)
      })
      graph.nodes = filteredNodes;

    }

    // sortNsnip(5);
    sortNsnip(10);
    sortNsnip(5);


    let eles = cy.add(
      graph.nodes.map(n => { n.id = n.screenName; return { group: 'nodes', data: n } }).concat(
        graph.links.map((l, i) => { l.id = 'e' + i; return { group: 'edges', data: { id: l.id, source: graph.nodes[l.source].id, target: graph.nodes[l.target].id } } })

      )
    );

    // console.log(cy.nodes().length)
    // console.log(cy.edges().length)


    const comp = cy.elements().components();

    console.log(' nodeCap is ', nodeCap)
    // console.log(comp[0].nodes()); 
    // console.log(comp[0].length)

    // let tree = cy.elements().kruskal();
    // console.log(tree.nodes().length);
    // console.log(tree.edges().length)


    // let collection = cy.elements()
    // graph.nodes.map((n,i)=>{
    //   var ks = collection.kargerStein();

    //   // console.log(ks.cut.select());
    //   console.log(ks.partition1.nodes().length)
    //   console.log(ks.partition2.nodes().length)
    //   console.log(ks.cut.select()[0])
    //   collection = ks.cut.select();
    // })


    // var dcn = cy.$().dcn();





    fs.writeFileSync(
      "data/" + nodeCap + "Nodes/graph_" + handle + ".json",
      JSON.stringify(graph, null, 4)
    );
    res.end(JSON.stringify(graph));
  });



});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

