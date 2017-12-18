const d3votes = (function () {

    // Constants
    const FORMAT_WEEK = d3.timeFormat('%V');

    // Variables
    let $dispatcher = d3.dispatch('tooltip'),
        d3svg,
        d3svgDimensions,
        d3tooltip,
        d3tooltipDimensions,
        $nodes,
        $nodeWidth,
        yScaleUpvote,
        yScaleDownvote
    ;

    return {
        $dispatcher,
        init
    };

    function init() {
        d3svg = d3.select('#votes');
        d3svgDimensions = d3svg.node().getBoundingClientRect();

        // Initialize axis
        d3svg.append('line')
            .attr('x1', 0)
            .attr('x2', d3svgDimensions.width)
            .attr('y1', d3svgDimensions.height / 2)
            .attr('y2', d3svgDimensions.height / 2)
        ;

        // Initialize scales
        yScaleUpvote = d3.scaleLinear().range([0, d3svgDimensions.height / 2]);
        yScaleDownvote = d3.scaleLinear().range([0, d3svgDimensions.height / 2]);

        // Initialize tooltip
        d3tooltip = d3svg.select('.tooltip').attr('width', util.getRem() * (10));
        d3tooltipDimensions = d3tooltip.node().getBoundingClientRect();

        // Event listeners
        d3heatmap.$dispatcher.on('tooltip.votes', onTooltip);
        d3sidebar.$dispatcher.on('load.votes', load);
        d3svg.select('.area')
            .on('mousemove', onMouseEvent)
            .on('mouseover', onMouseEvent)
            .on('mouseout', onMouseEvent);
    }

    function load(data) {
        console.time('votes.load');
        $nodes = data.nodesByWeek;
        $nodeWidth = d3svgDimensions.width / data.weeks.length;

        // Update scales
        let max = d3.max($nodes, (n) => n.upvotes > n.downvotes ? n.upvotes : n.downvotes);
        yScaleUpvote.domain([0, max]);
        yScaleDownvote.domain([0, max]);

        let dateStart = new Date(data.nodesByDay[0].$date.getFullYear(), 0, 1),
            indexOffset = d3.timeWeek.count(dateStart, $nodes[0].$date);

        // Update chart
        let upvotes = d3svg.select('.upvotes').selectAll('rect').data($nodes);
        upvotes.exit().remove();        // Items to be removed
        upvotes.enter().append('rect')  // Items to be added
            .attr('width', $nodeWidth - 1)
            .merge(upvotes)             // Items to be added + updated
            .attr('x', (d, i) => (i + indexOffset) * $nodeWidth)
            .attr('y', (n) => d3svgDimensions.height / 2 - yScaleUpvote(n.upvotes))
            .attr('height', (n) => yScaleUpvote(n.upvotes));

        let downvotes = d3svg.select('.downvotes').selectAll('rect').data($nodes);
        downvotes.exit().remove();        // Items to be removed
        downvotes.enter().append('rect')  // Items to be added
            .attr('width', $nodeWidth - 1)
            .merge(downvotes)           // Items to be added + updated
            .attr('x', (d, i) => (i + indexOffset) * $nodeWidth)
            .attr('y', d3svgDimensions.height / 2)
            .attr('height', (n) => yScaleDownvote(n.downvotes));

        console.timeEnd('votes.load');
    }

    function tooltip(e, x, inverted) {
        let tooltip = d3tooltip.node();

        // As $nodes doesn't always have the data for the entire year, we need to calculate the week where the data starts on
        // We achieve that by counting the number of weeks since the beginning of the year
        let nodeX = Math.floor(x / $nodeWidth),
            nodeIndex = (nodeX - d3.timeWeek.count(d3.timeYear($nodes[$nodes.length - 1].$date), $nodes[0].$date))/* * 7 + nodeY - $nodes[0].$date.getDay()*/,
            node = x >= 0/* && y >= 0*/ && (e.type === 'mouseover' || e.type === 'mousemove') ? $nodes[nodeIndex] : null;

        if (node) {
            x = (nodeX + 1) * $nodeWidth;

            // Fit inside
            if (inverted || x + d3tooltipDimensions.width > d3svgDimensions.width) {
                tooltip.classList.add('is-inverted');
                x = x - d3tooltipDimensions.width - $nodeWidth;
            } else {
                tooltip.classList.remove('is-inverted');
            }

            // Update data
            d3tooltip.select('thead td').text('Week ' + FORMAT_WEEK(node.$date));
            d3tooltip.select('.downvotes').text(node.downvotes);
            d3tooltip.select('.upvotes').text(node.upvotes);

            tooltip.classList.add('is-active');
            d3tooltip.attr('transform', 'translate(' + x + ',' + (d3svgDimensions.height - d3tooltipDimensions.height) / 2 + ')');
        } else {
            tooltip.classList.remove('is-active');
        }
    }

    function onMouseEvent() {
        if (!$nodes) return;

        let e = d3.event,
            x = e.pageX - d3svgDimensions.left;

        tooltip(e, x);

        $dispatcher.call('tooltip', this, { e, x, inverted: d3tooltip.node().classList.contains('is-inverted') });
    }
    function onTooltip(data) {
        let e = data.e,
            x = data.x;

        tooltip(e, x, data.inverted);
    }


}());
