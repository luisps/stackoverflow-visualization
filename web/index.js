window.onload = function () {
    d3graph.init();
    d3heatmap.init();
    data.load('es');
    //data.initTimeSlider();

    function initTimeSlider() {

        //left and right limits of slider
        startDate = new Date(2012, 1, 1);
        endDate = new Date(2014, 1, 1);

        //select a fifth of slider on initial configuration
        initialSelectedLeft = startDate;
        initialSelectedRight = new Date(startDate.getTime() + ((endDate.getTime() - startDate.getTime()) / 5));

        var num_ticks = 12;
        var formatDate = d3.timeFormat("%b %y");

        timeSlider = d3.slider()
                  .scale(d3.scaleTime().domain([startDate, endDate]))
                  .value([initialSelectedLeft, initialSelectedRight])
                  .orient("bottom")
                  .axis(d3.axisBottom().ticks(num_ticks).tickFormat(formatDate));

        d3.select('#time-slider').call(timeSlider);

        timeSlider.on("end", function(e, value) {
            console.log('Start date:', new Date(value[0]));
            console.log('End date:', new Date(value[1]));
        });

    }

    function initTimeSlider2() {

        function updateTick(tick, value) {
            //setting tick position
            tick.setAttribute('transform', 'translate(' + xPos(value) + ',0)');

            //setting tick's text
            tick.children[1].innerHTML = formatDate(value);
        }

        //left and right limits of slider
        startDate = new Date(2012, 1, 1);
        endDate = new Date(2014, 1, 1);

        //select a fifth of slider on initial configuration
        initialSelectedLeft = startDate;
        initialSelectedRight = new Date(startDate.getTime() + ((endDate.getTime() - startDate.getTime()) / 5));

        //ticks at beginning and end of slider will be fixed
        var tickValues = [startDate, endDate, initialSelectedLeft, initialSelectedRight]
        var formatDate = d3.timeFormat("%b %y");

        timeSlider = d3.slider()
                  .scale(d3.scaleTime().domain([startDate, endDate]))
                  .value([initialSelectedLeft, initialSelectedRight])
                  .orient("bottom")
                  .axis(d3.axisBottom().tickValues(tickValues).tickFormat(formatDate));

        d3.select('#time-slider').call(timeSlider);
        
        //update ticks while slide is moving
        var xPos = timeSlider.axis().scale();
        ticks = $('#time-slider .tick');

        timeSlider.on("slide", function(e, value) {
            updateTick(ticks[2], value[0]);
            updateTick(ticks[3], value[1]);
        });

        //hide tick lines as they don't look good in a moving slider
        ticks.find('line').css('visibility', 'hidden')

        timeSlider.on("end", function(e, value) {
            console.log('Start date:', new Date(value[0]));
            console.log('End date:', new Date(value[1]));
        });

    }


    //initTimeSlider();
    initTimeSlider2();

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



