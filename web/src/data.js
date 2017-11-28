const data = (function () {

    // Constants
    const PATH_CLUSTERS = 'data/{region}.stackoverflow.com_clusters.csv';
    const PATH_COMMUNITY = 'data/{region}.stackoverflow.com_community.csv';
    const PATH_SKILLS = 'data/{region}.stackoverflow.com_skills.csv';

    // Variables
    let $dispatcher = d3.dispatch('load'),
        clusters = {},
        links = {},
        nodes = {}
    ;

    return {
        $dispatcher,
        clusters,
        links,
        nodes,
        load,
        deltaLinks,
        deltaNodes,
        seriesNodes
    };

    function load(region) {
        d3.csv(PATH_CLUSTERS.replace('{region}', region), (data) => {
            console.time('data.load.clusters');
            loadClusters(data);
            console.timeEnd('data.load.clusters');

            d3.csv(PATH_COMMUNITY.replace('{region}', region), (data) => {
                console.time('data.load.community');
                loadNodes(data);
                console.timeEnd('data.load.community');

                d3.csv(PATH_SKILLS.replace('{region}', region), (data) => {
                    console.time('data.load.skills');
                    loadLinks(data);
                    console.timeEnd('data.load.skills');

                    $dispatcher.call('load', this, { nodes: nodes[2017][8][1], links: links[2017][8] });
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
                if (cluster1 !== cluster2 && (tag1 !== cluster1 || tag2 !== cluster2)) return; // Remove links between children from different parents
                if (cluster1 === cluster2 && (tag1 === cluster1 || tag2 === cluster2)) return; // Remove links between child and parent

                let nodesByYear = nodes[year];
                let nodesByMonthAndYear = nodesByYear[month];
                nodesByMonthAndYear = nodesByMonthAndYear[Object.keys(nodesByMonthAndYear).pop()];

                let cluster1Node = nodesByMonthAndYear[cluster1];
                let link = _newLink(tag1, cluster1Node, tag2,  nodesByMonthAndYear[cluster2], count);

                if (cluster1 === cluster2) { // Same cluster
                    cluster1Node.childrenLinks.push(link);
                } else { // Different clusters
                    let linksByYear = links[year] = links[year] || {};
                    let linksByMonthAndYear = linksByYear[month] = linksByYear[month] || [];
                    linksByMonthAndYear.push(link);
                }
            });
        });
    }
    function deltaLinks(dateStart, dateEnd, nodes) {
        console.time('data.deltaLinks');

        let linksStart = links[dateStart.year][dateStart.month],
            linksEnd = links[dateEnd.year][dateEnd.month],
            result = []
        ;

        for (let i = 0; i < linksStart.length; i ++) {
            let linkStart = linksStart[i],
                linkEnd = linksEnd[i],
                resultLink = _subLink(linkEnd, linkStart)
            ;

            let sourceNode = nodes[linkStart.source.id],
                targetNode = nodes[linkStart.target.id]
            ;

            // Ignore links which don't have any activity during the selected period
            if (resultLink.value === 0 || sourceNode === undefined || targetNode === undefined)
                continue;

            sourceNode.linkCount ++;
            targetNode.linkCount ++;

            resultLink.source = sourceNode;
            resultLink.target = targetNode;

            (sourceNode.cluster === targetNode.cluster) ?
                sourceNode.childrenLinks.push(resultLink) : // Same cluster
                result.push(resultLink);                    // Different clusters
        }

        console.timeEnd('data.deltaLinks');
        return result;
    }

    function _newLink(tag1, node1, tag2, node2, count) {
        return node1.cluster === node2.cluster ?
            {
                source: tag1 === node1.cluster ? node1 : node1.children[tag1],
                target: tag2 === node1.cluster ? node1 : node1.children[tag2],
                value: count
            } : {
                source: node1,
                target: node2,
                value: count
            };
    }
    function _subLink(linkEnd, linkStart) {
        return {
            source: linkStart.source,
            target: linkStart.target,
            value: linkEnd.value - linkStart.value
        }
    }

    function loadNodes(data) {
        data.forEach((row) => {
            let date = row['$date$'].split('-');
            let year = +date[0], month = +date[1], day = +date[2];

            delete row['$date$'];
            Object.keys(row).forEach((key) => {
                let node = _newNode(key, row[key].split('-'));
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
    function deltaNodes(dateStart, dateEnd) {
        console.time('data.deltaNodes');

        let nodesStart = nodes[dateStart.year][dateStart.month][dateStart.day],
            nodesEnd = nodes[dateEnd.year][dateEnd.month][dateEnd.day],
            result = {}
        ;

        Object.values(nodesStart).forEach((n) => {
            let nodeStart = n,
                nodeEnd = nodesEnd[nodeStart.id],
                resultNode = _subNode(nodeEnd, nodeStart)
            ;

            // Ignore nodes which don't have any activity during the selected period
            if (resultNode.radius === 0)
                return;

            result[n.id] = resultNode;
        });

        console.timeEnd('data.deltaNodes');
        return result;
    }
    function seriesNodes(dateStart, dateEnd) {
        console.time('data.seriesNodes');

        // Calculate previous date
        let previousDate = new Date(dateStart.date);
        previousDate.setDate(dateStart.date.getDate() - 1);
        previousDate = previousDate.getTime() < dateStart.date.getTime() ? dateStart.date : previousDate;

        let result = {},
            resultDates = {};

        Object.keys(nodes[dateStart.year][dateStart.month][dateStart.day]).forEach((tag) => {
            let nodeStart = nodes[previousDate.getFullYear()][previousDate.getMonth() + 1][previousDate.getDate()][tag];
            let series = result[tag] = [];
            let year = dateStart.year,
                month = dateStart.month,
                day = dateStart.day
            ;

            for (; year <= dateEnd.year && nodes[year]; year ++) {
                for (; (year < dateEnd.year || month <= dateEnd.month) && nodes[year][month]; month ++) {
                    for (; (year < dateEnd.year || month < dateEnd.month || day <= dateEnd.day) && nodes[year][month][day]; day ++) {
                        let nodeEnd = nodes[year][month][day][tag];
                        let resultNode = _subNode(nodeEnd, nodeStart);

                        let resultDateByYear = resultDates[year] = resultDates[year] || {},
                            resultDateByMonthAndYear = resultDateByYear[month] = resultDateByYear[month] || {};
                        resultNode.date = resultDateByMonthAndYear[day] = resultDateByMonthAndYear[day] || new Date(Date.UTC(year, month - 1, day));

                        series.push(resultNode);
                        nodeStart = nodeEnd;
                    }
                    day = 1;
                }
                month = 1;
            }
        });

        console.timeEnd('data.seriesNodes');
        return result;
    }

    function _newNode(tag, value) {
        let node = {
            tag: tag,
            answercount: +value[0],
            commentcount: +value[1],
            questioncount: +value[2],
            upvotes: +value[3],
            downvotes: +value[4],
            linkCount: 0
        };

        node.id = '$' + tag;
        node.cluster = clusters[node.id];
        node.radius = node.answercount + node.commentcount + node.questioncount + node.upvotes + node.downvotes;

        return node;
    }
    function _subNode(nodeEnd, nodeStart) {
        let node = {
            id: nodeStart.id,
            cluster: nodeStart.cluster,
            tag: nodeStart.tag,
            answercount: nodeEnd.answercount - nodeStart.answercount,
            commentcount: nodeEnd.commentcount - nodeStart.commentcount,
            questioncount: nodeEnd.questioncount - nodeStart.questioncount,
            upvotes: nodeEnd.upvotes - nodeStart.upvotes,
            downvotes: nodeEnd.downvotes - nodeStart.downvotes,
            linkCount: 0,
            radius: nodeEnd.radius - nodeStart.radius
        };

        // Sub children
        if (nodeStart.children !== undefined) {
            node.children = {};
            node.childrenLinks = [];

            Object.values(nodeStart.children).forEach((n) => node.children[n.id] = _subNode(nodeEnd.children[n.id], n))
        }

        return node;
    }

}());
