const data = (function () {

    // Constants
    const PATH_CLUSTERS = 'data/{region}.stackoverflow.com_clusters.csv';
    const PATH_COMMUNITY = 'data/{region}.stackoverflow.com_community.csv';
    const PATH_ICONS = 'data/icons.csv';
    const PATH_SKILLS = 'data/{region}.stackoverflow.com_skills.csv';

    // Variables
    let $dispatcher = d3.dispatch('load', 'icons', 'update'),
        clusters,
        icons,
        links,
        nodes,
        dateMin,
        dateMax
    ;

    return {
        $dispatcher,
        load,
        nodesByTagByDay,
        nodesByTagByWeek
    };

    function load(region) {
        d3.csv(PATH_ICONS, (data) => {
            console.time('data.load.icons');
            iconsLoad(data);
            console.timeEnd('data.load.icons');

            $dispatcher.call('icons', this, { icons });
            d3.csv(PATH_CLUSTERS.replace('{region}', region), (data) => {
                console.time('data.load.$clusters');
                clustersLoad(data);
                console.timeEnd('data.load.$clusters');

                d3.csv(PATH_COMMUNITY.replace('{region}', region), (data) => {
                    console.time('data.load.community');
                    nodesLoad(data);
                    console.timeEnd('data.load.community');

                    d3.csv(PATH_SKILLS.replace('{region}', region), (data) => {
                        console.time('data.load.skills');
                        linksLoad(data);
                        console.timeEnd('data.load.skills');

                        $dispatcher.call('load', this, { dateMin, dateMax });
                    });
                });
            });
        });

        // Event listeners
        d3time.$dispatcher.on('update.data', update);
    }

    function update(data) {
        console.time('data.time');

        let nodes = nodesByYear(data.year),
            links = linksByYear(data.year)
        ;

        // Merge links with nodes
        links.forEach((link) => {
            link.source = nodes[link.tag1];
            link.target = nodes[link.tag2];

            link.source.$links = link.source.$links || [];
            link.source.$links.push(link);
            link.target.$links = link.target.$links || [];
            link.target.$links.push(link);
        });

        $dispatcher.call('update', this, {
            nodes: Object.values(nodes),
            links
        });

        /*
        console.log('data.update()', 'dateStart', data.dateStart, 'dateEnd', data.dateEnd)      ;

        let dateStart = data.dateStart,
            dateEnd = data.dateEnd,

            nodesDelta = deltaNodes(dateStart, dateEnd),
            //nodesSeries = seriesNodes(dateStart, dateEnd),
            linksDelta = deltaLinks(dateStart, dateEnd, nodesDelta)
        ;

        $dispatcher.call('update', this, {
            dateStart,
            dateEnd,
            links: linksDelta,
            nodes: nodesDelta
        });
        */

        console.timeEnd('data.time');
    }

    function clustersLoad(data) {
        clusters = {};
        data.forEach((row) => clusters[row.tag] = row.cluster);
    }

    function iconsLoad(data) {
        icons = {};
        data.forEach((row) => icons[row.tag] = {
            id: 'icon_' + row.icon,
            url: 'img/icons/' + row.icon + '.png'
        });
    }

    function linksLoad(data) {
        links = {};
        data.forEach((row) => {
            let year = +row['year'];

            let tag1 = row['tag1'],
                tag2 = row['tag2'],
                cluster1 = clusters[tag1],
                cluster2 = clusters[tag2];

            // Remove links between children from different parents
            // Remove links between siblings
            if (cluster1 !== cluster2 && (tag1 !== cluster1 || tag2 !== cluster2)) return;
            if (cluster1 === cluster2) return;

            let link = _linksNew(
                row['tag1'],
                row['tag2'],
                +row['count'],
                +row['rank1'],
                +row['rank2']
            );

            let linksByYear = links[year] = links[year] || [];
                linksByYear.push(link);
        });
    }
    function linksByYear(year) {
        return links[year];
    }

    function _linksNew(tag1, tag2, value, rank1, rank2) {
        return {
            tag1,
            tag2,
            value,
            rank: rank1 < rank2 ? rank1 : rank2,
            rank1,
            rank2
        };
    }

    function nodesLoad(data) {
        nodes = {};
        data.forEach((row) => {
            let year = +row['year'],
                month = +row['month'],
                day = +row['day'];

            let node = _nodesNew(
                { year, month, day },
                row['tag'],
                +row['answercount'],
                +row['commentcount'],
                +row['questioncount'],
                +row['upvotes'],
                +row['downvotes'],
                +row['offensivevotes']
            );

            let nodesByYear = nodes[year] = nodes[year] || {};
            let nodesByMonthAndYear = nodesByYear[month] = nodesByYear[month] || {};
            let nodesByDayAndMonthAndYear = nodesByMonthAndYear[day] = nodesByMonthAndYear[day] || {};
            let clusterNode = nodesByDayAndMonthAndYear[node.$cluster] = nodesByDayAndMonthAndYear[node.$cluster] || {
                $children: {}
            };

            // Process clusters
            if (node.$tag === node.$cluster) { // We found the parent
                node.$children = clusterNode.$children;
                nodesByDayAndMonthAndYear[node.$cluster] = node;
            } else {
                clusterNode.$children[node.$tag] = node;
            }
        });

        // Calculate dateMin and dateMax
        let years = Object.keys(nodes).sort(),
            yearStart = +years[0],
            yearEnd = +years.pop(),
            monthStart = +Object.keys(nodes[yearStart])[0],
            monthEnd = +Object.keys(nodes[yearEnd]).pop(),
            dayStart = +Object.keys(nodes[yearStart][monthStart])[0],
            dayEnd = +Object.keys(nodes[yearEnd][monthEnd]).pop()
        ;

        dateMin = new Date(yearStart, monthStart - 1, dayStart);
        dateMax = new Date(yearEnd, monthEnd - 1, dayEnd);

        // Make sure there are no holes
        for (let date = new Date(dateMin); date <= dateMax; date.setDate(date.getDate() + 1)) {
            let year = date.getFullYear(),
                month = date.getMonth() + 1,
                day = date.getDate();

            let nodesByYear = nodes[year] = nodes[year] || {},
                nodesByMonth = nodesByYear[month] = nodesByYear[month] || {},
                nodesByDay = nodesByMonth[day] = nodesByMonth[day] || {};

            // Remove oprhans (children with no parent)
            Object.keys(nodesByDay).forEach((tag) => {
                if (nodesByDay[tag].$tag === undefined)
                    delete nodesByDay[tag];
            })
        }
    }
    function nodesByTagByDay(year, tag) {
        console.time('data.nodesByTagByDay');

        let nodesByMonth, nodesByDay;
        let result = [];

        Object.keys(nodesByMonth = nodes[year]).forEach((month) => {
            Object.keys(nodesByDay = nodesByMonth[month]).forEach((day) => {
                let node = nodesByDay[day][tag] || _nodesNew({ year, month, day }, tag, 0, 0, 0, 0, 0, 0);
                result.push(node);
            })
        });

        console.timeEnd('data.nodesByTagByDay');
        return result;
    }
    function nodesByTagByWeek(year, tag) {
        console.time('data.nodesByTagByWeek');

        let nodesByMonth, nodesByDay;
        let result = [],
            resultByWeek = null,
            resultWeek = null;

        Object.keys(nodesByMonth = nodes[year]).forEach((month) => {
            Object.keys(nodesByDay = nodesByMonth[month]).forEach((day) => {
                let node = nodesByDay[day][tag] || null,
                    week = _getWeek(year, month, day);

                if (resultByWeek === null || resultWeek !== week) {
                    resultWeek = week;
                    resultByWeek = _nodesNew({ year, month, week }, tag, 0, 0, 0, 0, 0, 0);
                    result.push(resultByWeek);
                }

                if (node !== null)
                    _nodesSum(resultByWeek, node);
            })
        });

        console.timeEnd('data.nodesByTagByWeek');
        return result;
    }
    function nodesByYear(year) {
        console.time('data.nodesByYear');

        let nodesByYear, nodesByMonth, nodesByDay;
        let result = {};

        Object.keys(nodesByYear = nodes[year]).forEach((month) => {
            Object.keys(nodesByMonth = nodesByYear[month]).forEach((day) => {
                Object.keys(nodesByDay = nodesByMonth[day]).forEach((tag) => {
                    let node = nodesByDay[tag],
                        resultNode = result[tag] = result[tag] || _nodesNew({ year }, tag, 0, 0, 0, 0, 0, 0);

                    _nodesSum(resultNode, node);
                })
            })
        });

        console.timeEnd('data.nodesByYear');
        return result;
    }

    function _nodesNew(date, tag, answercount, commentcount, questioncount, upvotes, downvotes, offensivevotes) {
        return {
            $date: date,
            $id: '$' + tag,
            $icon: icons[tag] ? icons[tag].id : null,
            $children: null,
            $cluster: clusters[tag],
            $radius: answercount + commentcount + questioncount + upvotes + downvotes + offensivevotes,
            $tag: tag,
            answercount,
            commentcount,
            questioncount,
            upvotes,
            downvotes,
            offensivevotes
        };
    }
    function _nodesSum(nodeResult, node) {
        nodeResult.$radius += node.$radius;
        nodeResult.answercount += node.answercount;
        nodeResult.commentcount += node.commentcount;
        nodeResult.upvotes += node.upvotes;
        nodeResult.downvotes += node.downvotes;
        nodeResult.offensivevotes += node.offensivevotes;

        // Sum children
        if (node.$children !== null) {
            nodeResult.$children = {};

            Object.keys(node.$children).forEach((tag) => {
                let child = node.$children[tag],
                    childResult = nodeResult.$children[tag] = nodeResult.$children[tag] || _nodesNew(nodeResult.$date, tag,  0, 0, 0, 0, 0, 0);
                _nodesSum(childResult, child);
            });
        }
    }

    // Thanks to https://gist.github.com/dblock/1081513
    function _getWeek(year, month, day) {
        let target = new Date(year, month - 1, day),
            dayNr = (target.getDay() + 6) % 7,
            jan4    = new Date(target.getFullYear(), 0, 4);

        target.setDate(target.getDate() - dayNr + 3);
        return 1 + Math.ceil((target - jan4) / 86400000 / 7);
    }

}());
