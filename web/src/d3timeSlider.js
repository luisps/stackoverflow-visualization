const d3timeSlider = (function () {

    // Variables
    let timeSlider,
        formatDate = d3.timeFormat("%b %y"),
        num_ticks = 12
        ;

    return {
        init
    };

    function init() {

        timeSlider = d3.slider()
                  .orient("bottom")
                  .axis(d3.axisBottom().ticks(num_ticks).tickFormat(formatDate));

        //event listeners
        //in d3 v4 event 'end' means slider stopped moving
        timeSlider.on("end", function(e, value) {
            startInterval = new Date(value[0]);
            endInterval = new Date(value[1]);

            intervalChanged(startInterval, endInterval);
        });

        data.$dispatcher.on('load.timeSlider', update);

    }

    function intervalChanged(startInterval, endInterval) {

        //startInterval and endInterval are Date objects, which represent time in a
        //continuous fashion, we are only interested however in the year, month and day
        var startYear = startInterval.getFullYear(), endYear = endInterval.getFullYear();
        var startMonth = startInterval.getMonth()+1, endMonth = endInterval.getMonth()+1;
        var startDay = startInterval.getDate(), endDay = endInterval.getDate();

        //delegate to data module responsibility to change underlying data structures
        data.$dispatcher.call('intervalChanged', null,
                              {year: startYear, month: startMonth, day: startDay},
                              {year: endYear, month: endMonth, day: endDay}
                             );
    }
    

    //the update for the time slider is called when the underlying dataset changes
    //as the selected region changes, it's not called for each slide movement
    function update() {

        //calculate the dates on both ends of time slider
        //we don't sort the keys' arrays since we rely on ES2015
        //key order, which is already ordered for integers
        var sortedYear = Object.keys(data.dataset_nodes);
        var startYear = sortedYear[0], endYear = sortedYear.pop();

        var startMonth = Object.keys(data.dataset_nodes[startYear])[0];
        var endMonth = Object.keys(data.dataset_nodes[endYear]).pop();

        var startDay = Object.keys(data.dataset_nodes[startYear][startMonth])[0];
        var endDay = Object.keys(data.dataset_nodes[endYear][endMonth]).pop();

        //JS Date's range is 0-11 and in our data we're using 1-12
        startMonth -= 1;
        endMonth -= 1;

        startDate = new Date(startYear, startMonth, startDay);
        endDate = new Date(endYear, endMonth, endDay);

        //console.log(startDate);
        //console.log(endDate);

        //select a fifth of slider for initial interval
        var initialSelectedLeft = startDate;
        var initialSelectedRight = new Date(startDate.getTime() + ((endDate.getTime() - startDate.getTime()) / 5));

        timeSlider.scale(d3.scaleTime().domain([startDate, endDate]))
                  .value([initialSelectedLeft, initialSelectedRight])

        d3.select('#time-slider').call(timeSlider);
        intervalChanged(initialSelectedLeft, initialSelectedRight);

    }

    /*
    function init2() {

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
    */

}());
