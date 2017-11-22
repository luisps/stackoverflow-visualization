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
    let dataNodes = {};
    let dataLinks = {};
    console.log('Loading...');

    d3.csv('data/es.stackoverflow.com_clusters.csv', (data) => {
        data.forEach((row) => {
            dataClusters['$' + row.tag] = '$' + row.cluster;
        });

        console.log('Loaded clusters!');
        d3.csv('data/es.stackoverflow.com_community.csv', (data) => {
            data.forEach((row) => {
                row.year = +row.year;
                row.month = +row.month;
                row.day = +row.day;
                row.answercount = +row.answercount;
                row.commentcount = +row.commentcount;
                row.questioncount = +row.questioncount;
                row.upvotes = +row.upvotes;
                row.downvotes = +row.downvotes;

                row.id = '$' + row.tag;
                row.cluster = dataClusters[row.id];

                if (row.cluster === undefined)
                    return;

                let dataNodesByYear = dataNodes[row.year] = dataNodes[row.year] || {};
                let dataNodesByMonthAndYear = dataNodesByYear[row.month] = dataNodesByYear[row.month] || {};
                let dataNodesByDayAndMonthAndYear = dataNodesByMonthAndYear[row.day] = dataNodesByMonthAndYear[row.day] || {};
                let clusterNode = dataNodesByDayAndMonthAndYear[row.cluster] = dataNodesByDayAndMonthAndYear[row.cluster] || { children: {}, links: [] };

                // Process clusters
                if (row.id === row.cluster) { // We found the parent
                    row.children = clusterNode.children;
                    row.links = clusterNode.links;
                    dataNodesByDayAndMonthAndYear[row.cluster] = row;
                } else {
                    clusterNode.children[row.id] = row;
                }
            });

            console.log('Loaded community!');
            d3.csv('data/es.stackoverflow.com_skills.csv', function (data) {
                data.forEach((row) => {
                    row.count = +row.count;
                    row.tag1 = '$' + row.tag1;
                    row.tag2 = '$' + row.tag2;
                    row.cluster1 = dataClusters[row.tag1];
                    row.cluster2 = dataClusters[row.tag2];

                    if (row.cluster1 !== row.cluster2 && (row.tag1 !== row.cluster1 || row.tag2 !== row.cluster2))
                        return;

                    let year = +row.year;
                    let month = +row.month;
                    let dataNodesByYear = dataNodes[year];
                    let dataNodesByMonthAndYear = dataNodesByYear[month];
                        dataNodesByMonthAndYear = dataNodesByMonthAndYear[Object.keys(dataNodesByMonthAndYear)[0]];

                    if (row.cluster1 === row.cluster2) { // Same cluster
                        let clusterNode = dataNodesByMonthAndYear[row.cluster1];
                        clusterNode.links.push({ source: clusterNode.children[row.tag1], target: clusterNode.children[row.tag2], value: row.count });
                    } else { // Different clusters
                        let dataLinksByYear = dataLinks[year] = dataLinks[year] || {};
                        let dataLinksByMonthAndYear = dataLinksByYear[month] = dataLinksByYear[month] || [];
                        dataLinksByMonthAndYear.push({ source: dataNodesByMonthAndYear[row.tag1], target: dataNodesByMonthAndYear[row.tag2], value: row.count });
                    }
                });

                console.log('Loaded skills!');
                initGraph();
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

};
