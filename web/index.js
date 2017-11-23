window.onload = function () {



    function load_data(region) {
    }

    function initGraph() {

        d3graph = d3.select('#graph');
        d3graphDimensions = window.getComputedStyle(d3graph.node());
            d3graphDimensions = { height: parseInt(d3graphDimensions.height), width: parseInt(d3graphDimensions.width) };
        //d3graphNodes, d3graphNodesRadiusScale;
        //var d3graphLinks, d3graphLinksValueScale;

        d3simulation = d3.forceSimulation()
            .force('center', d3.forceCenter(d3graphDimensions.width / 2, d3graphDimensions.height / 2))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('link', d3.forceLink().id((n) => n.id).distance((l) => 1 / d3graphLinksValueScale(l.value) + 64).strength((l) => d3graphLinksValueScale(l.value)))
            .force('collision', d3.forceCollide().radius((n) => d3graphNodesRadiusScale(n.answercount + n.questioncount + n.commentcount) + 4))
        ;
    }

    function updateGraph() {
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

        d3graphLinks.exit().remove();
        d3graphNodes.exit().remove();
        //d3graphLinks.exit().remove();

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

        metrics = ['questioncount', 'answercount', 'commentcount']
        metricNames = ['Question', 'Answer', 'Comment']
        selectedMetric = 0;

        //initial tag - to remove if we start with no selected tag
        selectedTag = 'javascript';

        //initialize heatmap
        heatmap = calendarHeatmap()
            .selector('.heatmap-container')
            .tooltipEnabled(true)
            .colorRange(['#f4f7f7', '#79a8a9'])
            .onClick(function (data) {
                console.log('data', data);
        });

        //initialize heatmap slider
        $('.metrics').css('visibility', 'visible');
        $('.metrics').slick();

        //update metric on slider change
        $('.metrics').on('afterChange', function(ev, slick, currentSlide) {
            selectedMetric = currentSlide;
            updateHeatmapMetric();
        });
        
        //update tag on node mouse click
        d3graphNodes.on('click', function(n) {
            if (selectedTag == n.tag)
                return;

            selectedTag = n.tag;
            console.log(selectedTag);
            updateHeatmapTag();
            updateHeatmapMetric();
        
        });

    }

    function updateHeatmapTag() {
        tagActivity = []

        for (var year in dataNodes) {
          for (var month in dataNodes[year]) {
            for (var day in dataNodes[year][month]) {

              activity = dataNodes[year][month][day]['$' + selectedTag];
              tagActivity.push({
                date: new Date(year, month, day),
                questioncount: activity.questioncount,
                answercount: activity.answercount,
                commentcount: activity.commentcount
              });
            }
          }
        }

    }

    function getMetricData(tagActivity, metric) {
        return tagActivity.map(function(node) {
            return {
                date: node.date,
                count: node[metric]
            };
        });
    }

    function updateHeatmapMetric() {
        var metricData = getMetricData(tagActivity, metrics[selectedMetric]);
        var metricName = metricNames[selectedMetric];

        heatmap.data(metricData);
        heatmap.tooltipUnit(metricName);
        heatmap();  // render the chart
    }


    /*
    var res = load_data('es');
    dataClusters = res['dataClusters'];
    dataNodes = res['dataNodes'];
    dataLinks = res['dataLinks'];
    */

    var dataClusters = {};
    var dataNodes = {};
    var dataLinks = {};

    region = 'es'

    prefix = 'data/' + region + '.stackoverflow.com';
    console.log('Loading data for region', region);

    d3.csv(prefix + '_clusters.csv', (data) => {
        data.forEach((row) => {
            dataClusters['$' + row.tag] = '$' + row.cluster;
        });

        console.log('Loaded clusters!');
        d3.csv(prefix + '_community.csv', (data) => {
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
            d3.csv(prefix + '_skills.csv', function (data) {
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
                updateGraph();

                initHeatmap();
                updateHeatmapTag();
                updateHeatmapMetric();


            });
        });
    });


}



