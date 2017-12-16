const d3heatmap = (function () {

    // Constants
    const PADDING_BOTTOM = 16;
    const PADDING_LEFT = 6;
    const PADDING_RIGHT = 6;
    const TICK_FORMAT = (d) => console.log(m) || m === 0 ? '' : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];

    // Private Variables
    let d3svg,
        d3svgDimensions,
        xAxisMonth,
        xAxisWeek,
        xScaleMonth,
        xScaleWeek

    ;

    return {
        init
    };

    function init() {
        d3svg = d3.select('#heatmap');
        d3svgDimensions = window.getComputedStyle(d3svg.node());
        d3svgDimensions = { height: parseInt(d3svgDimensions.height), width: parseInt(d3svgDimensions.width) };

        // Initialize axis
        xScaleMonth = d3.scaleTime().range([0, d3svgDimensions.width - d3svgDimensions.width / 13 / 2]);
        xScaleWeek = d3.scaleTime().range([0, d3svgDimensions.width - d3svgDimensions.width / 53 / 2]);
        xAxisMonth = d3.axisBottom(xScaleMonth).tickFormat(d3.timeFormat('%b'));
        xAxisWeek = d3.axisBottom(xScaleWeek).tickFormat(d3.timeFormat('%V'));

        // Event Listeners
        d3sidebar.$dispatcher.on('load.sidebar', load);
    }

    function load(data) {
        let nodes = data.nodesByDay,
            nodesByWeek = data.nodesByWeek;

        // Update axis
        let dateStart = nodesByWeek[0].$date,
            dateEnd = nodesByWeek[nodesByWeek.length - 1].$date,
            domain = [
                new Date(dateStart.year, dateStart.month - 1, 1),
                new Date(dateEnd.year, dateEnd.month - 1, 25)
            ];

        xScaleMonth.domain(domain);
        xScaleWeek.domain(domain);

        d3svg.select('.axis-month').call(xAxisMonth.ticks(12));
        d3svg.select('.axis-week').call(xAxisWeek.ticks(53));
        /*
        let weekStart = nodesByWeek[0].$date.week,
            weekEnd = nodesByWeek[nodesByWeek.length - 1].$date.week;

        console.log('months', Array.from(Array(weekEnd - weekStart + 2).keys()))
        xScaleWeek.domain(Array.from(Array(weekEnd - weekStart + 2).keys()));
        d3svg.select('.axis-week').call(xAxisWeek);
        */


        //console.log('weekStart', weekStart, 'weekEnd', weekEnd);
        //console.log('heatmap data', data);

        


    }

})();