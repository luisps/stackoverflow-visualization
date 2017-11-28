const d3time = (function () {

    // Constants
    const TICK_FORMAT = '%b %y';
    const TICK_NUM = 12;

    // Variables
    let $dispatcher = d3.dispatch('update'),
        timeSlider
    ;

    return {
        $dispatcher,
        init
    };

    function init() {
        timeSlider = d3.slider()
            .orient("bottom")
            .axis(d3.axisBottom().ticks(TICK_NUM).tickFormat(d3.timeFormat(TICK_FORMAT)))
        ;

        // Event listeners
        timeSlider.on("end", update);
        data.$dispatcher.on('load.time', load);

    }

    //the update for the time slider is called when the underlying dataset changes
    //as the selected region changes, it's not called for each slide movement
    function load() {
        //calculate the dates on both ends of time slider
        //we don't sort the keys' arrays since we rely on ES2015
        //key order, which is already ordered for integers
        let years = Object.keys(data.nodes),
            yearStart = years[0],
            yearEnd = years.pop()
        ;

        let monthStart = Object.keys(data.nodes[yearStart])[0],
            monthEnd = Object.keys(data.nodes[yearEnd]).pop()
        ;

        let dayStart = Object.keys(data.nodes[yearStart][monthStart])[0],
            dayEnd = Object.keys(data.nodes[yearEnd][monthEnd]).pop()
        ;

        let dateStart = Date.UTC(yearStart, monthStart - 1, dayStart),
            dateEnd = Date.UTC(yearEnd, monthEnd - 1, dayEnd)
        ;

        // Select last 3 months by default
        let value = [
            Date.UTC(yearEnd, monthEnd - 4, 1),
            Date.UTC(yearEnd, monthEnd - 1, dayEnd)
        ];

        timeSlider
            .scale(d3.scaleTime().domain([dateStart, dateEnd]))
            .value(value);
        d3.select('#time-slider').call(timeSlider);

        update(null, value);
    }

    function update(e, value) {
        console.clear();

        let dateStart = new Date(value[0]),
            dateEnd = new Date(value[1])
        ;
        dateStart = { date: dateStart, year: dateStart.getFullYear(), month: dateStart.getMonth() + 1, day: dateStart.getDate() };
        dateEnd = { date: dateEnd, year: dateEnd.getFullYear(), month: dateEnd.getMonth() + 1, day: dateEnd.getDate() };

        let deltaNodes = data.deltaNodes(dateStart, dateEnd),
            deltaLinks = data.deltaLinks(dateStart, dateEnd, deltaNodes),
            seriesNodes = data.seriesNodes(dateStart, dateEnd)
        ;

        $dispatcher.call('update', this, {
            dateStart,
            dateEnd,
            delta: {
                links: deltaLinks,
                nodes: deltaNodes
            },
            series: {
                nodes: seriesNodes
            }
        });
    }

}());
