window.onload = function () {
    d3graph.init();
    d3heatmap.init();
    data.load('es');



    /*
    var dataClusters = {};
    var dataNodes = {};
    var dataLinks = {};

    region = 'es'

    prefix = 'data/' + region + '.stackoverflow.com';
    console.log('Loading data for region', region);

    d3.csv(prefix + '_clusters.csv', (data) => {
        data.forEach((row) => dataClusters['$' + row.tag] = '$' + row.cluster);

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

    */


}



