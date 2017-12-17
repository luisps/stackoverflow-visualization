const d3heatmap = (function () {

    // Constants
    const FORMAT_DAY = d3.timeFormat('%B %d');
    const FORMAT_WEEK = d3.timeFormat('%V');

    // Private Variables
    let d3svg,
        d3svgDimensions,
        d3tooltip,
        d3tooltipDimensions,
        $nodes,
        $nodesByWeek,
        $nodeHeight,
        $nodeWidth,
        opacityScale,
        xAxisMonth,
        xScaleMonth
    ;

    return {
        init
    };

    function init() {
        d3svg = d3.select('#heatmap');
        d3svgDimensions = d3svg.node().getBoundingClientRect();

        // Initialize axis
        xScaleMonth = d3.scaleTime().range([0, d3svgDimensions.width]);
        xAxisMonth = d3.axisBottom(xScaleMonth).tickFormat(d3.timeFormat('%b'));

        // MS Edge doesn't support transforms via CSS
        d3svg.select('.axis-month').attr('transform', 'translate(' + (d3svgDimensions.width / 13 / 2) + ', 0)');
        d3svg.select('.axis-week').attr('transform', 'translate(' + 0.1 * util.getRem() + ', ' + d3svgDimensions.height + ')');
        d3svg.selectAll('.chart, .chart-area').attr('transform', 'translate(0, ' + (1.7 * util.getRem()) + ')');

        // Initialize scales
        opacityScale = d3.scaleLinear().range([0.1, 1]);

        // Initialize tooltip
        d3tooltip = d3svg.select('.tooltip');
        d3tooltipDimensions = d3tooltip.node().getBoundingClientRect();

        // Event Listeners
        d3sidebar.$dispatcher.on('load.sidebar', load);
        d3svg.select('.chart-area')
            .on('mousemove', onMouseEvent)
            .on('mouseover', onMouseEvent)
            .on('mouseout', onMouseEvent)
        ;
    }

    function load(data) {
        console.time('d3heatmap.load');
        $nodes = data.nodesByDay;
        $nodesByWeek = data.nodesByWeek;

        let year = $nodes[0].$date.getFullYear(),
            weeks = util.getWeeksByYear(year),
            numWeeks = weeks.length;

        $nodeWidth = d3svgDimensions.width / numWeeks;
        $nodeHeight = (d3svgDimensions.height - (1.7 + 0.9) * util.getRem()) / 7;

        console.log(weeks[0], 'vs', $nodesByWeek[0].$date);
        console.log(util.getWeek(weeks[0]), 'vs', util.getWeek($nodesByWeek[0].$date));
        console.log(FORMAT_WEEK(weeks[0]), 'vs', FORMAT_WEEK($nodesByWeek[0].$date))

        // Update axis
        let axis = d3svg.select('.axis-week').selectAll('text').data(weeks);
        axis.exit().remove();           // Items to be removed
        axis.enter().append('text')     // Items to be added
            .attr('x', (d) => weeks.indexOf(d) * $nodeWidth)
            .text((d) => FORMAT_WEEK(d));
        axis                            // Items to be updated
            .attr('x', (d) => weeks.indexOf(d) * $nodeWidth)
            .text((d) => FORMAT_WEEK(d));

        xScaleMonth.domain([new Date(year, 0, 1), new Date(year, 11, 31)]);
        d3svg.select('.axis-month').call(xAxisMonth.ticks(12));

        // Update scales
        opacityScale.domain(d3.extent($nodes, (n) => n.answercount + n.commentcount + n.questioncount));

        // Update chart
        let chart = d3svg.select('.chart').selectAll('rect').data($nodes);
        chart.exit().remove();          // Items to be removed
        chart.enter().append('rect')    // Items to be added
            .attr('x', (n) => d3.timeWeek.count(d3.timeYear(n.$date), n.$date) * $nodeWidth)
            .attr('y', (n) => n.$date.getDay() * $nodeHeight)
            .attr('width', $nodeWidth - 2)
            .attr('height', $nodeHeight - 1.5)
            .attr('fill', COLOR_PRIMARY)
            .attr('opacity', (n) => opacityScale(n.answercount + n.commentcount + n.questioncount));
        chart                           // Items to be updated
            .attr('x', (n) => d3.timeWeek.count(d3.timeYear(n.$date), n.$date) * $nodeWidth)
            .attr('y', (n) => n.$date.getDay() * $nodeHeight)
            .attr('opacity', (n) => opacityScale(n.answercount + n.commentcount + n.questioncount));

        d3svg.select('.chart-area')
            .attr('height', $nodeHeight * 7)
            .attr('width', $nodeWidth * (1 + d3.timeWeek.count(d3.timeYear($nodes[$nodes.length - 1].$date), $nodes[$nodes.length - 1].$date)));

        console.timeEnd('d3heatmap.load');
    }

    function onMouseEvent() {
        let e = d3.event,
            tooltip = d3tooltip.node(),
            x = e.pageX - d3svgDimensions.left,
            y = e.pageY - d3svgDimensions.top - 1.7 * util.getRem();

        let nodeX = Math.floor(x / $nodeWidth),
            nodeY = Math.floor(y / $nodeHeight),
            nodeIndex = (nodeX - d3.timeWeek.count(d3.timeYear($nodes[0].$date), $nodes[0].$date)) * 7 + nodeY - $nodes[0].$date.getDay(),
            node = x >= 0 && y >= 0 && (e.type === 'mouseover' || e.type === 'mousemove') ? $nodes[nodeIndex] : null;

        if (node) {
            let x = (nodeX + 1) * $nodeWidth,
                y = (nodeY * $nodeHeight);

            // Fit inside
            y = Math.min(y, $nodeHeight * 7 - d3tooltipDimensions.height + 1); // No idea where the +1 comes from
            if (x + d3tooltipDimensions.width > d3svgDimensions.width) {
                tooltip.classList.add('is-inverted');
                x = x - d3tooltipDimensions.width - $nodeWidth;
            } else {
                tooltip.classList.remove('is-inverted');
            }

            // Update data
            d3tooltip.select('.day thead td').text(FORMAT_DAY(node.$date));
            d3tooltip.select('.day .answers').text(node.answercount);
            d3tooltip.select('.day .comments').text(node.commentcount);
            d3tooltip.select('.day .questions').text(node.questioncount);

            nodeIndex = Math.floor((nodeIndex + $nodes[0].$date.getDay()) / 7);
            node = $nodesByWeek[nodeIndex];
            d3tooltip.select('.week thead td').text('Week ' + FORMAT_WEEK(node.$date));
            d3tooltip.select('.week .answers').text(node.answercount);
            d3tooltip.select('.week .comments').text(node.commentcount);
            d3tooltip.select('.week .questions').text(node.questioncount);

            tooltip.classList.add('is-active');
            d3tooltip.attr('transform', 'translate(' + x + ',' + (y + 1.7 * util.getRem()) + ')');
        } else {
            tooltip.classList.remove('is-active');
        }
    }

})();