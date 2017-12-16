const d3heatmap = (function () {

    // Private Variables
    let d3svg,
        d3svgDimensions,
        xAxisMonth,
        xAxisWeek,
        xScaleMonth,
        xScaleWeek,
        opacityScale
    ;

    return {
        init
    };

    function init() {
        d3svg = d3.select('#heatmap');
        d3svgDimensions = window.getComputedStyle(d3svg.node());
        d3svgDimensions = { height: parseInt(d3svgDimensions.height), width: parseInt(d3svgDimensions.width) };

        // Initialize axis
        xScaleMonth = d3.scaleTime().range([0, d3svgDimensions.width]);
        xScaleWeek = d3.scaleTime().range([0, d3svgDimensions.width - d3svgDimensions.width / 53 / 2]);
        xAxisMonth = d3.axisBottom(xScaleMonth).tickFormat(d3.timeFormat('%b'));
        xAxisWeek = d3.axisBottom(xScaleWeek).tickFormat(d3.timeFormat('%V'));

        // Initialize Scales
        opacityScale = d3.scaleLinear().range([0.1, 1]);

        // Event Listeners
        d3sidebar.$dispatcher.on('load.sidebar', load);
    }

    function load(data) {
        console.time('d3heatmap.load');
        let nodes = data.nodesByDay;

        // Update axis
        let dateStart = { year: nodes[0].$date.getFullYear(), month: 1, day: 1 },
            dateEnd = { year: nodes[nodes.length - 1].$date.getFullYear(), month: 12, day: 31 },
            domain = [
                new Date(dateStart.year, dateStart.month - 1, dateStart.day),
                new Date(dateEnd.year, dateEnd.month - 1, dateEnd.day)
            ];

        xScaleMonth.domain(domain);
        xScaleWeek.domain(domain).nice();

        d3svg.select('.axis-month').call(xAxisMonth.ticks(12));
        d3svg.select('.axis-week').call(xAxisWeek.ticks(53));

        // Update scales
        opacityScale.domain(d3.extent(nodes, (n) => n.answercount + n.commentcount + n.questioncount));

        // Update chart
        let numWeeks = Math.max(util.getWeek(dateStart.year, 12, 31), util.getWeek(dateStart.year, 12, 24)),
            rectWidth = (d3svgDimensions.width - (numWeeks - 1) * 2) / numWeeks,
            rectHeight = (d3svgDimensions.height - (1.7 + 0.9) * util.getRem()) / 7 - 1.5;

        let chart = d3svg.select('.chart').selectAll('rect').data(nodes);
        chart.exit().remove();          // Items to be removed
        chart.enter().append('rect')    // Items to be added
            .attr('x', (n) => d3.timeWeek.count(d3.timeYear(n.$date), n.$date) * (rectWidth + 2))
            .attr('y', (n) => n.$date.getDay() * (rectHeight + 1.5))
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('fill', COLOR_PRIMARY)
            .attr('opacity', (n) => opacityScale(n.answercount + n.commentcount + n.questioncount));
        chart                           // Items to be updated
            .attr('opacity', (n) => opacityScale(n.answercount + n.commentcount + n.questioncount));

        console.timeEnd('d3heatmap.load');
    }

})();