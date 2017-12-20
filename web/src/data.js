const data = (function () {

    // Constants
    const PATH_CLUSTERS = 'data/{region}.stackoverflow.com_clusters.csv';
    const PATH_COMMUNITY = 'data/{region}.stackoverflow.com_community.csv';
    const PATH_ICONS = 'data/icons.csv';
    const PATH_SKILLS = 'data/{region}.stackoverflow.com_skills.csv';

    // Variables
    let $dispatcher = d3.dispatch('load', 'icons', 'update'),
        $clusters,
        $icons,
        $links,
        $nodes,
        $dateMin,
        $dateMax
    ;

    return {
        $dispatcher,
        init,
        nodesByTagByDay,
        nodesByTagByWeek
    };

    function init() {
        // Event listeners
        d3region.$dispatcher.on('click.data', load);
    }

    function load(data) {
        let region = data.region.substr(0, this.innerText.indexOf('.'));
            region = region === 'stackoverflow' ? 'en' : region;

        d3.csv(PATH_ICONS, (data) => {
            //console.time('data.load.icons');
            iconsLoad(data);
            //console.timeEnd('data.load.icons');

            $dispatcher.call('icons', this, { icons: $icons });
            d3.csv(PATH_CLUSTERS.replace('{region}', region), (data) => {
                //console.time('data.load.$clusters');
                clustersLoad(data);
                //console.timeEnd('data.load.$clusters');

                d3.csv(PATH_COMMUNITY.replace('{region}', region), (data) => {
                    //console.time('data.load.community');
                    nodesLoad(data);
                    //console.timeEnd('data.load.community');

                    d3.csv(PATH_SKILLS.replace('{region}', region), (data) => {
                        //console.time('data.load.skills');
                        linksLoad(data);
                        //console.timeEnd('data.load.skills');

                        $dispatcher.call('load', this, { dateMin: $dateMin, dateMax: $dateMax, nodesByWeek: nodesByTagByWeek(null, null) });
                    });
                });
            });
        });

        // Event listeners
        d3time.$dispatcher.on('update.data', update);
    }

    function update(year) {
        //console.time('data.update');

        let nodes = nodesByYear(year),
            links = linksByYear(year)
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
            nodesByDay: nodesByTagByDay(year, null),
            nodesByWeek: nodesByTagByWeek(year, null),
            nodesByYear: Object.values(nodes),
            linksByYear: links
        });

        //console.timeEnd('data.update');
    }

    function clustersLoad(data) {
        $clusters = {};
        data.forEach((row) => $clusters[row.tag] = row.cluster);
    }

    function iconsLoad(data) {
        $icons = {};
        data.forEach((row) => $icons[row.tag] = {
            id: 'icon_' + row.icon,
            url: 'img/icons/' + row.icon + '.png'
        });
    }

    function linksLoad(data) {
        $links = {};
        data.forEach((row) => {
            let year = +row['year'];

            let tag1 = row['tag1'],
                tag2 = row['tag2'],
                cluster1 = $clusters[tag1],
                cluster2 = $clusters[tag2];

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

            let linksByYear = $links[year] = $links[year] || [];
                linksByYear.push(link);
        });
    }
    function linksByYear(year) {
        return $links[year];
    }

    function _linksNew(tag1, tag2, value, rank1, rank2) {
        return {
            tag1,
            tag2,
            value,
            rankMin: rank1 < rank2 ? rank1 : rank2,
            rankMax: rank1 < rank2 ? rank2 : rank1,
            rank1,
            rank2
        };
    }

    function nodesLoad(data) {
        $nodes = {};
        data.forEach((row) => {
            let year = +row['year'],
                month = +row['month'],
                day = +row['day'];

            let node = _nodesNew(
                new Date(year, month - 1, day),
                row['tag'],
                +row['answercount'],
                +row['commentcount'],
                +row['questioncount'],
                +row['upvotes'],
                +row['downvotes'],
                +row['offensivevotes']
            );

            let nodesByYear = $nodes[year] = $nodes[year] || {};
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
        let years = Object.keys($nodes).sort(),
            yearStart = +years[0],
            yearEnd = +years.pop(),
            monthStart = +Object.keys($nodes[yearStart])[0],
            monthEnd = +Object.keys($nodes[yearEnd]).pop(),
            dayStart = +Object.keys($nodes[yearStart][monthStart])[0],
            dayEnd = +Object.keys($nodes[yearEnd][monthEnd]).pop()
        ;

        $dateMin = new Date(yearStart, monthStart - 1, dayStart);
        $dateMax = new Date(yearEnd, monthEnd - 1, dayEnd);

        // Make sure there are no holes
        for (let date = new Date($dateMin); date <= $dateMax; date.setDate(date.getDate() + 1)) {
            let year = date.getFullYear(),
                month = date.getMonth() + 1,
                day = date.getDate();

            let nodesByYear = $nodes[year] = $nodes[year] || {},
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
        //console.time('data.nodesByTagByDay(' + year + ',' + tag + ')');

        let nodesByMonth, nodesByDay;
        let result = [],
            resultByDay = null;

        (year === null ? Object.keys($nodes) : [year]).forEach((year) => {
            Object.keys(nodesByMonth = $nodes[year]).forEach((month) => {
                Object.keys(nodesByDay = nodesByMonth[month]).forEach((day) => {
                    resultByDay = _nodesNew(new Date(year, month - 1, day), tag, 0, 0, 0, 0, 0, 0);
                    result.push(resultByDay);

                    (tag === null ? Object.keys(nodesByDay[day]) : [tag]).forEach((tag) => {
                        let node = nodesByDay[day][tag] || null;
                        if (node !== null)
                            _nodesSum(resultByDay, node);
                    });
                })
            });
        });

        //console.timeEnd('data.nodesByTagByDay(' + year + ',' + tag + ')');
        return result;
    }
    function nodesByTagByWeek(year, tag) {
        //console.time('data.nodesByTagByWeek(' + year + ',' + tag + ')');

        let nodesByMonth, nodesByDay;
        let result = [],
            resultByWeek = null,
            resultWeek = null;

        (year === null ? Object.keys($nodes) : [year]).forEach((year) => {
            Object.keys(nodesByMonth = $nodes[year]).forEach((month) => {
                Object.keys(nodesByDay = nodesByMonth[month]).forEach((day) => {
                    let date = new Date(year, month - 1, day);
                        date.setDate(date.getDate() - date.getDay());
                    let week = util.getWeek(date);

                    if (resultByWeek === null || resultWeek !== week) {
                        resultWeek = week;
                        resultByWeek = _nodesNew(date, tag, 0, 0, 0, 0, 0, 0);
                        result.push(resultByWeek);
                    }

                    (tag === null ? Object.keys(nodesByDay[day]) : [tag]).forEach((tag) => {
                        let node = nodesByDay[day][tag] || null;
                        if (node !== null)
                           _nodesSum(resultByWeek, node);
                    });
                })
            });
        });

        //console.timeEnd('data.nodesByTagByWeek(' + year + ',' + tag + ')');
        return result;
    }
    function nodesByYear(year) {
        //console.time('data.nodesByYear(' + year + ')');

        let nodesByYear, nodesByMonth, nodesByDay;
        let result = {};

        Object.keys(nodesByYear = $nodes[year]).forEach((month) => {
            Object.keys(nodesByMonth = nodesByYear[month]).forEach((day) => {
                Object.keys(nodesByDay = nodesByMonth[day]).forEach((tag) => {
                    let node = nodesByDay[tag],
                        resultNode = result[tag] = result[tag] || _nodesNew(new Date(year, 0, 1), tag, 0, 0, 0, 0, 0, 0);

                    _nodesSum(resultNode, node);
                })
            })
        });

        //console.timeEnd('data.nodesByYear(' + year + ')');
        return result;
    }

    function _nodesNew(date, tag, answercount, commentcount, questioncount, upvotes, downvotes, offensivevotes) {
        return {
            $date: date,
            $id: tag ? '$' + tag : null,
            $icon: $icons[tag] ? $icons[tag] : null,
            $children: null,
            $cluster: $clusters[tag] ? $clusters[tag] : null,
            $radius: answercount + commentcount + questioncount + upvotes + downvotes + offensivevotes,
            $tag: tag ? tag : null,
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
        nodeResult.questioncount += node.questioncount;
        nodeResult.upvotes += node.upvotes;
        nodeResult.downvotes += node.downvotes;
        nodeResult.offensivevotes += node.offensivevotes;

        // Sum children
        if (node.$children !== null) {
            nodeResult.$children = nodeResult.$children || {};

            Object.keys(node.$children).forEach((tag) => {
                let child = node.$children[tag],
                    childResult = nodeResult.$children[tag] = nodeResult.$children[tag] || _nodesNew(nodeResult.$date, tag,  0, 0, 0, 0, 0, 0);
                _nodesSum(childResult, child);
            });
        }
    }

}());
