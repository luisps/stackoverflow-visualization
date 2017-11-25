const data = (function () {

    // Constants
    const PATH_CLUSTERS = 'data/{region}.stackoverflow.com_clusters.csv';
    const PATH_COMMUNITY = 'data/{region}.stackoverflow.com_community.csv';
    const PATH_SKILLS = 'data/{region}.stackoverflow.com_skills.csv';

    // Variables
    let $dispatcher = d3.dispatch('load', 'load.heatmap', 'load.graph'),
        clusters = {},
        links = {},
        nodes = {}
    ;

    return {
        $dispatcher,
        clusters,
        links,
        nodes,
        load
    };

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
        data.forEach((row) => clusters['$' + row.tag] = '$' + row.cluster);
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

                let cluster1 = clusters[tag1];
                let cluster2 = clusters[tag2];
                if (cluster1 !== cluster2 && (tag1 !== cluster1 || tag2 !== cluster2))
                    return;

                let nodesByYear = nodes[year];
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
                    let linksByYear = links[year] = links[year] || {};
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
                node.cluster = clusters[node.id];
                node.radius = node.answercount + node.commentcount + node.questioncount + node.upvotes + node.downvotes;

                if (node.cluster === undefined)
                    return;

                let nodesByYear = nodes[year] = nodes[year] || {};
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

}());