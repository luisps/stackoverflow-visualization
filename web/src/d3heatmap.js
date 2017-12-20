const d3heatmap = (function () {

    // Constants
    const FORMAT_DAY = d3.timeFormat('%B %d');
    const FORMAT_WEEK = d3.timeFormat('%V');
    const FORMAT_NUMBER = (n) => n > 1000 ? (Math.floor(n / 100) / 10) + 'k' : n;
    const NODE_OPACITY = (n) => {
        let a = n.answercount + n.commentcount + n.questioncount;
        return a > 0 ? opacityScale(a) : 0;
    };

    // Private Variables
    let $dispatcher = d3.dispatch('tooltip'),
        d3svg,
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
        $dispatcher,
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
        d3svg.selectAll('.chart, .area').attr('transform', 'translate(0, ' + (1.7 * util.getRem()) + ')');

        // Initialize scales
        opacityScale = d3.scaleLinear().range([0.1, 1]);

        // Initialize tooltip
        d3tooltip = d3svg.select('.tooltip').attr('width', util.getRem() * 21);
        d3tooltipDimensions = d3tooltip.node().getBoundingClientRect();

        // Event Listeners
        d3sidebar.$dispatcher.on('load.sidebar', load);
        d3votes.$dispatcher.on('tooltip.heatmap', onTooltip);
        d3svg.select('.area')
            .attr('height', d3svgDimensions.height - (1.7 + 0.9) * util.getRem())
            .on('mousemove', onMouseEvent)
            .on('mouseover', onMouseEvent)
            .on('mouseout', onMouseEvent)
        ;
    }

    function load(data) {
        //console.time('d3heatmap.load');
        $nodes = data.nodesByDay;
        $nodesByWeek = data.nodesByWeek;
        $nodeWidth = d3svgDimensions.width / data.weeks.length;
        $nodeHeight = (d3svgDimensions.height - (1.7 + 0.9) * util.getRem()) / 7;

        // Update axis
        let axis = d3svg.select('.axis-week').selectAll('text').data(data.weeks);
        axis.exit().remove();           // Items to be removed
        axis.enter().append('text')     // Items to be added
            .merge(axis)                // Items to be added + updated
            .attr('x', (d, i) => i * $nodeWidth)
            .text((d) => FORMAT_WEEK(d));

        let dateStart = new Date($nodes[0].$date.getFullYear(), 0, 1),
            dateEnd = new Date($nodes[0].$date.getFullYear(), 11, 31),
            indexOffset = dateStart.getDay() + d3.timeDay.count(dateStart, $nodes[0].$date); // Week offset + in case we don't have data since the beginning of the year

        xScaleMonth.domain([dateStart, dateEnd]);
        d3svg.select('.axis-month').call(xAxisMonth.ticks(12));

        // Update scales
        opacityScale.domain(d3.extent($nodes, (n) => n.answercount + n.commentcount + n.questioncount));

        // Update chart
        let chart = d3svg.select('.chart').selectAll('rect').data($nodes);
        chart.exit().remove();          // Items to be removed
        chart.enter().append('rect')    // Items to be added
            .attr('width', $nodeWidth - 1)
            .attr('height', $nodeHeight - 1.5)
            .attr('fill', COLOR_PRIMARY)
            .merge(chart)               // Items to be added + updated
            .attr('x', (n, i) => Math.floor((i + indexOffset) / 7) * $nodeWidth)
            .attr('y', (n, i) => (i + indexOffset) % 7 * $nodeHeight)
            .attr('opacity', NODE_OPACITY);

        //console.timeEnd('d3heatmap.load');
    }

    function update(e, x, y, isActive, isInverted, isWeekOnly) {
        let tooltip = d3tooltip.node();

        // As $nodes doesn't always have the data for the entire year, we need to calculate the week where the data starts on
        // We achieve that by counting the number of weeks since the beginning of the year
        let nodeX = Math.floor(x / $nodeWidth),
            nodeY = Math.floor(y / $nodeHeight),
            nodeIndex = (nodeX - d3.timeWeek.count(d3.timeYear($nodes[$nodes.length - 1].$date), $nodes[0].$date)) * 7 + (nodeY - $nodes[0].$date.getDay()),
            node = x >= 0 && y >= 0 && (e.type === 'mouseover' || e.type === 'mousemove') ? $nodes[nodeIndex] : null;

        if (isActive && node) {
            x = (nodeX + 1) * $nodeWidth;
            y = (nodeY * $nodeHeight);

            // Fit inside
            y = Math.min(y, $nodeHeight * 7 - d3tooltipDimensions.height + 1); // No idea where the +1 comes from
            if (isInverted || x + d3tooltipDimensions.width * (isWeekOnly ? 0.5 : 1) > d3svgDimensions.width) {
                tooltip.classList.add('is-inverted');
                x = x - d3tooltipDimensions.width - $nodeWidth;
            } else {
                tooltip.classList.remove('is-inverted');
            }

            // Update data
            d3tooltip.select('.day').style('transform', isWeekOnly ? 'scale(0)' : '');
            d3tooltip.select('.day thead td').text(FORMAT_DAY(node.$date));
            d3tooltip.select('.day .answers').text(FORMAT_NUMBER(node.answercount));
            d3tooltip.select('.day .comments').text(FORMAT_NUMBER(node.commentcount));
            d3tooltip.select('.day .questions').text(FORMAT_NUMBER(node.questioncount));

            nodeIndex = Math.floor((nodeIndex + $nodes[0].$date.getDay()) / 7);
            node = $nodesByWeek[nodeIndex];
            d3tooltip.select('.week thead td').text('Week ' + FORMAT_WEEK(node.$date));
            d3tooltip.select('.week .answers').text(FORMAT_NUMBER(node.answercount));
            d3tooltip.select('.week .comments').text(FORMAT_NUMBER(node.commentcount));
            d3tooltip.select('.week .questions').text(FORMAT_NUMBER(node.questioncount));

            tooltip.classList.add('is-active');
            d3tooltip.attr('transform', 'translate(' + x + ',' + (y + 1.7 * util.getRem()) + ')');
        } else {
            tooltip.classList.remove('is-active');
        }
    }

    function onMouseEvent() {
        if (!$nodes) return;

        let e = d3.event,
            tooltip = d3tooltip.node(),
            x = e.pageX - d3svgDimensions.left,
            y = e.pageY - d3svgDimensions.top - 1.7 * util.getRem();

        update(e, x, y, true, false, false);

        $dispatcher.call('tooltip', this, { e, x, isActive: tooltip.classList.contains('is-active'), isInverted: tooltip.classList.contains('is-inverted') });
    }

    function onTooltip(data) {
        let e = data.e,
            x = data.x;

        update(e, x, 100, data.isActive, data.isInverted, true);
    }

})();