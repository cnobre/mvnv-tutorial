function showTooltip(data, delay = 200) {
  let tooltip = d3.select(".tooltip");

  tooltip
    .html(data)
    .style("left", window.event.clientX + 10 + "px")
    .style("top", window.event.clientY - 20 + "px");

  tooltip
    .transition()
    .duration(delay)
    .style("opacity", 0.9);
}

function hideTooltip() {
  d3.select(".tooltip")
    .transition()
    .duration(100)
    .style("opacity", 0);
}

d3.selectAll(".tag").on("click", function () {
  let twitterHandle = d3.select(this).attr('id');

  d3.json('data/presets/graph_' + twitterHandle + '.json').then((graph) => {
    drawGraph(graph);
  })
});

d3.select(".input").on("change", function () {
  response = d3
    // .json('http://13.58.168.88:5000/?handle=' + this.value)
    .json("http://0.0.0.0:5000/?handle=" + this.value)
    .then(graph => {
      console.log(graph)
      drawGraph(graph);
    });
});

function drawGraph(data) {
  d3.select(".table").style("visibility", "visible");

  //Populate node table
  {
    let rows = d3
      .select(".nodeTable")
      .select("tbody")
      .selectAll("tr")
      .data(data.nodes);

    let rowsEnter = rows.enter().append("tr");

    rowsEnter.append("th").attr("class", "name");
    rowsEnter.append("td").attr("class", "screen_name");
    rowsEnter.append("td").attr("class", "tweets");

    rowsEnter.append("td").attr("class", "friends");
    rowsEnter.append("td").attr("class", "followers");
    rowsEnter.append("td").attr("class", "location");

    rows.exit().remove();

    rows = rowsEnter.merge(rows);

    rows.select(".name").html(d => d.name);
    rows.select(".screen_name").html(d => d.screenName);
    rows.select(".tweets")
      .html(d => d.tweets)
      .classed('random', d => d.random_tweets)


    rows.select(".friends").html(d => d.friends).classed('random', d => d.random_friends)
    rows.select(".followers").html(d => d.followers).classed('random', d => d.random_followers)
    rows.select(".location").html(d => d.location);
  }

  //Populate Edge Table
  {
    rows = d3
      .select(".edgeTable")
      .select("tbody")
      .selectAll("tr")
      .data(data.links);

    rowsEnter = rows.enter().append("tr");

    rowsEnter.append("td").attr("class", "source");
    rowsEnter.append("td").attr("class", "target");
    rowsEnter.append("td").attr("class", "type");
    rowsEnter.append("td").attr("class", "count");

    rows.exit().remove();

    rows = rowsEnter.merge(rows);

    rows.select(".source").html(d => data.nodes[d.source].name);
    rows.select(".target").html(d => data.nodes[d.target].name);
    rows.select(".type").html(d => d.type);
    rows.select(".count").html(d => d.weight);
  }

  //Draw Twitter Graph
  {
    var width = 560,
      height = 400;

    const links = data.links; //.map(d => Object.create(d));
    const nodes = data.nodes; //.map(d => Object.create(d));

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links)) //.id(d => d.id))
      .force(
        "charge",
        d3.forceManyBody()
          .strength(-800)
        // .strength(function(node) {
        //   return node.degree*-30;
        // })
      )
      .force("center", d3.forceCenter(width / 2, height / 2));

    let drag = simulation => {
      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(this).classed("fixed", (d.fixed = true));
      }

      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function releaseNodes(d) {
        d3.selectAll("fixed").classed("fixed", (d.fixed = false));
      }

      // function dragended(d) {
      //     if (!d3.event.active) simulation.alphaTarget(0);
      //     d.fx = null;
      //     d.fy = null;
      // }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
      // .on("dblclick", dblclick);
      // .on("end", dragended);
    };
    let scale = d3.scaleOrdinal(d3.schemeCategory10);

    let sizeScale = d3
      .scaleLinear()
      .domain(d3.extent(data.nodes.map(n => n.followers)))
      .range([7, 25]);

    let edgeWidthScale = d3
      .scaleLinear()
      .domain(d3.extent(data.links.map(n => n.weight)))
      .range([3, 12]);

    color = d => scale(d.group);

    d3.select(".graphCol")
      .select("svg")
      .remove();

    const svg = d3
      .select(".graphCol")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    svg.append("svg:defs").selectAll("marker")
      .data(["end"])      // Different link/path types can be defined here
      .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 12)
      .attr("markerHeight", 12)
      .attr("markerUnits","userSpaceOnUse")
      .attr("orient", "auto")
      .attr("color","hsl(203, 100%, 50%)")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    const link = svg
      .append("g")
      // .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("stroke-width", d => edgeWidthScale(d.weight))
      .on("mouseover", function (d) {
        let tooltipData = d.type;
        showTooltip(tooltipData);
      })
      .on("mouseout", function () {
        hideTooltip();
      });

    let radius = 12;
    let node = svg
      .append("g")
      .attr("class", "nodes")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes);

    let nodeEnter = node.enter().append("g");

    nodeEnter.append("circle");
    nodeEnter.append("text");

    node.exit().remove();

    node = nodeEnter.merge(node);

    node.select("text").text(d => d.name);

    node
      .select("circle")
      // .attr("r", d => sizeScale(d.followers))
      // .attr("r", radius)
      // .attr("fill", color)
      .on("mouseover", function (d) {
        let tooltipData = d.name;
        showTooltip(tooltipData);
      })
      .on("mouseout", function () {
        hideTooltip();
      })
      .call(drag(simulation));

    link.attr("class", d => d.type + " link")
      .attr("marker-end", "url(#end)");

    simulation.on("tick", () => {
      link.attr("d", d => {
        return arcPath(d, d.type == "mention");
      });

      node.attr("transform", d => {
        d.x = Math.max(radius, Math.min(width - radius, d.x));
        d.y = Math.max(radius, Math.min(height - radius, d.y));

        return "translate(" + d.x + "," + d.y + ")";
      });
    });
  }

  function arcPath(d, leftHand) {
    let source = d.source;
    let target = d.target;

    // console.log(d.source,source)

    var x1 = source.x, //leftHand ? source.x : target.x,
      y1 = source.y ,//leftHand ? source.y : target.y,
      x2 = target.x ,//leftHand ? target.x : source.x,
      y2 = target.y ;//leftHand ? target.y : source.y;
    (dx = x2 - x1),
      (dy = y2 - y1),
      (dr = Math.sqrt(dx * dx + dy * dy)),
      (drx = dr),
      (dry = dr),
      (sweep = 0 ); //leftHand ? 0 : 1);
    (xRotation = 50), (largeArc = 0);

    if (d.type !== "quote") {
      return (
        "M" +
        x1 +
        "," +
        y1 +
        "A" +
        -drx +
        ", " +
        -dry +
        " " +
        xRotation +
        ", " +
        largeArc +
        ", " +
        sweep +
        " " +
        x2 +
        "," +
        y2
      );
    } else {
      return (
        "M " + source.x + " " + source.y + " L " + target.x + " " + target.y
      );
    }

    // return ("M" + x1 + "," + y1
    //    + "S" + x2 + "," + y2
    //    + " " + x2 + "," + y2)
  }

}
