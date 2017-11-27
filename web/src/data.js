const data = (function () {

    // Constants
    const PATH_CLUSTERS = 'data/{region}.stackoverflow.com_clusters.csv';
    const PATH_COMMUNITY = 'data/{region}.stackoverflow.com_community.csv';
    const PATH_SKILLS = 'data/{region}.stackoverflow.com_skills.csv';

    // Variables
    let $dispatcher = d3.dispatch('load', 'load.timeSlider', 'update', 'update-graph', 'update.heatmap', 'intervalChanged'),  //refactor
        dataset_clusters = {},
        dataset_links = {},
        dataset_nodes = {},
        clusters = {},
        links = {},
        nodes = {}
    ;

    return {
        init,
        $dispatcher,
        clusters,
        links,
        nodes,
        dataset_clusters,
        dataset_links,
        dataset_nodes,
        load
    };

    function intervalChanged(startInterval, endInterval) {

        var startYear = startInterval['year'], startMonth = startInterval['month'], startDay = startInterval['day'];
        var endYear = endInterval['year'], endMonth = endInterval['month'], endDay = endInterval['day'];

        console.log('Start: ' + startYear + ' ' + startMonth + ' ' + startDay);
        console.log('End: ' + endYear + ' ' + endMonth + ' ' + endDay);

        //unfinished - doing it just for graph
        
        //do some variable renaming, like linkDeltas, nodeDeltas, etc
        nodes = [];

        startNodes = data.dataset_nodes[startYear][startMonth][startDay];
        endNodes = data.dataset_nodes[endYear][endMonth][endDay];

        Object.keys(startNodes).forEach(function(tag) {
            nodes.push({tag: startNodes[tag].tag,
                        answercount: endNodes[tag].answercount - startNodes[tag].answercount,
                        questioncount: endNodes[tag].questioncount - startNodes[tag].questioncount,
                        commentcount: endNodes[tag].commentcount - startNodes[tag].commentcount

                      });
        });

        console.log(nodes);

        //still not sure if we apply the same delta operation to links as we did to nodes above
        links = data.dataset_links[startYear][startMonth];

        /*
        links = [];

        startLinks = data.dataset_links[startYear][startMonth];
        endLinks = data.dataset_links[endYear][endMonth];

        startLinks.forEach(function(elem) {
            links.push({tag: startNodes[tag].tag,
                        answercount: endNodes[tag].answercount - startNodes[tag].answercount,
                        questioncount: endNodes[tag].questioncount - startNodes[tag].questioncount,
                        commentcount: endNodes[tag].commentcount - startNodes[tag].commentcount

                      });
        });

        console.log(nodes);
        */

        //calling graph update through data module looks weird - got no time left
        data.$dispatcher.call('update-graph', null, links, nodes);

    }

    function init() {

        //event handlers
        $dispatcher.on('intervalChanged', intervalChanged);

    }


    function load(region) {
        d3.csv(PATH_CLUSTERS.replace('{region}', region), (data) => {
            loadClusters(data);
            console.log('Loaded clusters!');

            d3.csv(PATH_COMMUNITY.replace('{region}', region), (data) => {
                loadNodes(data);
                console.log('Loaded community!');

                d3.csv(PATH_SKILLS.replace('{region}', region), (data) => {
                    loadLinks(data);
                    console.log('Loaded skills!');

                    $dispatcher.call('load');
                });
            });
        });
    }

    function loadClusters(data) {
        data.forEach((row) => dataset_clusters['$' + row.tag] = '$' + row.cluster);
    }

    function loadNodes(data) {
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
                node.cluster = dataset_clusters[node.id];
                node.radius = node.answercount + node.commentcount + node.questioncount + node.upvotes + node.downvotes;

                if (node.cluster === undefined)
                    return;

                let nodesByYear = dataset_nodes[year] = dataset_nodes[year] || {};
                let nodesByMonthAndYear = nodesByYear[month] = nodesByYear[month] || {};
                let nodesByDayAndMonthAndYear = nodesByMonthAndYear[day] = nodesByMonthAndYear[day] || {};
                let clusterNode = nodesByDayAndMonthAndYear[node.cluster] = nodesByDayAndMonthAndYear[node.cluster] || {
                    children: {},
                    childrenLinks: []
                };

                // Process clusters
                if (node.id === node.cluster) { // We found the parent
                    node.children = clusterNode.children;
                    node.childrenLinks = clusterNode.childrenLinks;
                    nodesByDayAndMonthAndYear[node.cluster] = node;
                } else {
                    clusterNode.children[node.id] = node;
                }
            });
        });
    }

    function loadLinks(data) {
        data.forEach((row) => {
            let date = row['$date$'].split('-');
            let year = +date[0], month = +date[1];

            delete row['$date$'];
            Object.keys(row).forEach((key) => {
                let count = +row[key];
                let tag1 = '$' + key.split('$')[0];
                let tag2 = '$' + key.split('$')[1];

                let cluster1 = dataset_clusters[tag1];
                let cluster2 = dataset_clusters[tag2];
                if (cluster1 !== cluster2 && (tag1 !== cluster1 || tag2 !== cluster2))
                    return;

                let nodesByYear = dataset_nodes[year];
                let nodesByMonthAndYear = nodesByYear[month];
                nodesByMonthAndYear = nodesByMonthAndYear[Object.keys(nodesByMonthAndYear)[0]];

                if (cluster1 === cluster2) { // Same cluster
                    let clusterNode = nodesByMonthAndYear[cluster1];
                    clusterNode.childrenLinks.push({
                        source: clusterNode.children[tag1],
                        target: clusterNode.children[tag2],
                        value: count
                    });
                } else { // Different clusters
                    let linksByYear = dataset_links[year] = dataset_links[year] || {};
                    let linksByMonthAndYear = linksByYear[month] = linksByYear[month] || [];
                    linksByMonthAndYear.push({
                        source: nodesByMonthAndYear[cluster1],
                        target: nodesByMonthAndYear[cluster2],
                        value: count
                    });
                }
            });
        });
    }

}());
