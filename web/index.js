window.onload = function () {

    let d3graph = d3.select('#graph');
    let d3graphDimensions = window.getComputedStyle(d3graph.node());
        d3graphDimensions = { height: parseInt(d3graphDimensions.height), width: parseInt(d3graphDimensions.width) };
    let d3graphNodes, d3graphNodesRadiusScale;
    let d3graphLinks, d3graphLinksValueScale;

    let d3simulation = d3.forceSimulation()
        .force('center', d3.forceCenter(d3graphDimensions.width / 2, d3graphDimensions.height / 2))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('link', d3.forceLink().id((n) => n.id).distance((l) => 1 / d3graphLinksValueScale(l.value) + 64).strength((l) => d3graphLinksValueScale(l.value)))
        .force('collision', d3.forceCollide().radius((n) => d3graphNodesRadiusScale(n.answercount + n.questioncount + n.commentcount) + 4))
    ;

    // Load all the data
    let dataClusters = {};
    dataNodes = {};
    let dataLinks = {};
    console.log('Loading...');

    d3.csv('data/es.stackoverflow.com_clusters.csv', (data) => {
        data.forEach((row) => {
            dataClusters['$' + row.tag] = '$' + row.cluster;
        });

        console.log('Loaded clusters!');
        d3.csv('data/es.stackoverflow.com_community.csv', (data) => {
            data.forEach((row) => {
                let date = row['$date$'].split('-');
                let year = +date[0], month = +date[1], day = +date[2];

                delete row['$date$'];
                Object.keys(row).forEach((key) => {
                    let value = row[key].split('-');
                    let node = {
                        tag: key,
                        answercount: +value[0],
                        commentcount: +value[1],
                        questioncount: +value[2],
                        upvotes: +value[3],
                        downvotes: +value[4]
                    };

                    node.id = '$' + key;
                    node.cluster = dataClusters[node.id];

                    if (node.cluster === undefined)
                        return;

                    let dataNodesByYear = dataNodes[year] = dataNodes[year] || {};
                    let dataNodesByMonthAndYear = dataNodesByYear[month] = dataNodesByYear[month] || {};
                    let dataNodesByDayAndMonthAndYear = dataNodesByMonthAndYear[day] = dataNodesByMonthAndYear[day] || {};
                    let clusterNode = dataNodesByDayAndMonthAndYear[node.cluster] = dataNodesByDayAndMonthAndYear[node.cluster] || {
                        children: {},
                        links: []
                    };

                    // Process clusters
                    if (node.id === node.cluster) { // We found the parent
                        node.children = clusterNode.children;
                        node.links = clusterNode.links;
                        dataNodesByDayAndMonthAndYear[node.cluster] = node;
                    } else {
                        clusterNode.children[node.id] = node;
                    }
                });
            });

            console.log('Loaded community!');
            d3.csv('data/es.stackoverflow.com_skills.csv', function (data) {
                data.forEach((row) => {
                    let date = row['$date$'].split('-');
                    let year = +date[0], month = +date[1];

                    delete row['$date$'];
                    Object.keys(row).forEach((key) => {
                        let count = +row[key];
                        let tag1 = '$' + key.split('$')[0];
                        let tag2 = '$' + key.split('$')[1];

                        let cluster1 = dataClusters[tag1];
                        let cluster2 = dataClusters[tag2];
                        if (cluster1 !== cluster2 && (tag1 !== cluster1 || tag2 !== cluster2))
                            return;

                        let dataNodesByYear = dataNodes[year];
                        let dataNodesByMonthAndYear = dataNodesByYear[month];
                        dataNodesByMonthAndYear = dataNodesByMonthAndYear[Object.keys(dataNodesByMonthAndYear)[0]];

                        if (cluster1 === cluster2) { // Same cluster
                            let clusterNode = dataNodesByMonthAndYear[cluster1];
                            clusterNode.links.push({
                                source: clusterNode.children[tag1],
                                target: clusterNode.children[tag2],
                                value: count
                            });
                        } else { // Different clusters
                            let dataLinksByYear = dataLinks[year] = dataLinks[year] || {};
                            let dataLinksByMonthAndYear = dataLinksByYear[month] = dataLinksByYear[month] || [];
                            dataLinksByMonthAndYear.push({
                                source: dataNodesByMonthAndYear[tag1],
                                target: dataNodesByMonthAndYear[tag2],
                                value: count
                            });
                        }
                    });
                });

                console.log('Loaded skills!');
                initGraph();
                initHeatmap();
            });
        });
    });

    function initGraph() {
        // TODO: use the year and month selected from the timeline
        let links = dataLinks[2017][8];
        let nodes = Object.values(dataNodes[2017][8][1]);

        d3graphLinksValueScale = d3.scaleLinear()
            .domain(d3.extent(links, (l) => l.value))
            .range([0.1, 1]);
        d3graphNodesRadiusScale = d3.scaleLog()
            .domain(d3.extent(nodes, (n) => n.answercount + n.questioncount + n.commentcount))
            .range([4, 24]);

        d3simulation.force("link")
            .links(links);
        d3simulation
            .nodes(nodes)
            .on('tick', d3simulationOnTick);

        d3graphLinks = d3graph.append('g')
            .attr('class', 'edges')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
        //.attr('stroke-width', function (d) { return Math.sqrt(d.value) })
        ;

        d3graphNodes = d3graph.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(nodes)
            .enter()
            .append('g')
        ;
        d3graphNodes.append('circle')
            .attr('r', (n) => d3graphNodesRadiusScale(n.answercount + n.questioncount + n.commentcount))
            .attr('fill', 'red');
        d3graphNodes.append('text')
            .text(function (d) { return d.tag })
        ;

        function d3simulationOnTick() {
            /*
            d3graphLinks
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            */

            d3graphNodes.selectAll('circle')
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
            d3graphNodes.selectAll('text')
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
        }

    }

    function initHeatmap() {

    //setting tag here, eventually tag will be selected on graph
    var tag = 'javascript';

    function getActivity(dataNodes, tag) {
      activity = []

      for (var year in dataNodes)
        for (var month in dataNodes[year])
          for (var day in dataNodes[year][month]) {
            tagActivity = dataNodes[year][month][day]['$' + tag];

            activity.push({
              date: new Date(year, month, day),
              questioncount: tagActivity.questioncount,
              answercount: tagActivity.answercount,
              commentcount: tagActivity.commentcount
            });
          }

      return activity;
    }

    function getMetricData(activity, metric) {
      return activity.map(function(node) {
        return {
          date: node.date,
          count: node[metric]
        };
      });
    }


    var metrics = ['questioncount', 'answercount', 'commentcount']
    var metricNames = ['Question', 'Answer', 'Comment']

    activity = getActivity(dataNodes, tag)

    var metricData = getMetricData(activity, metrics[0]);
    var metricName = metricNames[0];
    var heatmap = calendarHeatmap()
    .data(metricData)
    .selector('.heatmap-container')
    .tooltipEnabled(true)
    .tooltipUnit(metricName)
    .colorRange(['#f4f7f7', '#79a8a9'])
    .onClick(function (data) {
    console.log('data', data);
    });

    heatmap();  // render the chart

    $('.metrics').on('afterChange', function(ev, slick, currentSlide) {
      metricData = getMetricData(activity, metrics[currentSlide]);
      metricName = metricNames[currentSlide];

      heatmap.data(metricData);
      heatmap.tooltipUnit(metricName);
      heatmap();
    });

    $('.metrics').attr('visibility', 'visible');
    $('.metrics').slick();

    }

};

