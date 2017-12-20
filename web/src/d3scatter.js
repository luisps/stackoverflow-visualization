const d3scatter = (function () {

    // Constants
    const CHART_MARGIN_BOTTOM = 32;
    const CHART_PADDING = 12;
    const FORMAT_NUMBER = (n) => n > 1000 ? (Math.floor(n / 100) / 10) + 'k' : n;
    const METRICS = [
        {
            x: 'answercount',
            xLabel: 'Answers',
            y: 'questioncount',
            yLabel: 'Questions',
        },
        {
            x: 'commentcount',
            xLabel: 'Comments',
            y: 'answercount',
            yLabel: 'Answers',
        },
        {
            x: 'downvotes',
            xLabel: 'Downvotes',
            y: 'upvotes',
            yLabel: 'Upvotes',
        }
    ];

    // Private Variables
    let d3svg,
        d3svgDimensions,
        d3tooltip,
        d3tooltipDimensions,
        d3xLabel,
        d3yLabel,
        d3tabs,
        $nodes = null,
        $metric = METRICS[0],
        xScale,
        yScale
    ;

    return {
        init
    };  

    function init() {
        d3svg = d3.select('#scatter');
        d3svgDimensions = d3svg.node().getBoundingClientRect();

        // Initialize axis
        d3svg.append('line')
            .attr('x1', 1)
            .attr('x2', 1)
            .attr('y1', 0)
            .attr('y2', d3svgDimensions.height - CHART_MARGIN_BOTTOM)
        ;

        // Initialize labels
        d3xLabel = d3svg.append('text')
            .attr('x', d3svgDimensions.width)
            .attr('y', d3svgDimensions.height - CHART_MARGIN_BOTTOM - 0.25 * util.getRem())
            .attr('text-anchor', 'end');
        d3yLabel = d3svg.append('text')
            .attr('x', 0.25 * util.getRem())
            .attr('y', 0.75 * util.getRem());

        // Initialize scales
        xScale = d3.scaleLog().base(10).range([CHART_PADDING, d3svgDimensions.width - CHART_PADDING]);
        yScale = d3.scaleLog().base(10).range([d3svgDimensions.height - CHART_PADDING - CHART_MARGIN_BOTTOM, CHART_PADDING]);

        // Initialize tabs
        d3tabs = d3.select('.mdl-tabs');
        d3tabs.node().parentNode.setAttribute('y', d3svgDimensions.height - CHART_MARGIN_BOTTOM);

        // Initialize tooltip
        d3tooltip = d3svg.select('.tooltip').attr('width', util.getRem() * (10));
        d3tooltipDimensions = d3tooltip.node().getBoundingClientRect();

        // Event listeners
        d3sidebar.$dispatcher.on('load.scatter', load);
        d3tabs.selectAll('.mdl-tabs__tab').on('click', onClick);
    }

    function load(data) {
        //console.time('d3scatter.load');

        $nodes = data.nodesByYear;
        if ($nodes === null) return //console.timeEnd('d3scatter.load'); // scatter is not available when a tag is selected

        update();

        //console.timeEnd('d3scatter.load');
    }

    function update() {
        // Update scales
        let xDomain = d3.extent($nodes, (n) => n[$metric.x]),
            yDomain = d3.extent($nodes, (n) => n[$metric.y]);

        xScale.domain([Math.max(0.1, xDomain[0]), xDomain[1]]);
        yScale.domain([Math.max(0.1, yDomain[0]), yDomain[1]]);

        // Update chart
        let dots = d3svg.select('.chart').selectAll('circle').data($nodes);
        dots.exit().remove();           // Items to be removed
        dots.enter().append('circle')   // Items to be added
            .attr('r', 0.35 * util.getRem())
            .attr('fill', 'url(#gradient)')
            .attr('cx', (n) => xScale(Math.max(0.1, n[$metric.x])))
            .attr('cy', (n) => yScale(Math.max(0.1, n[$metric.y])))
            .on('mouseover', onMouseEvent)
            .on('mouseout', onMouseEvent);
        dots.transition()               // Items to be updated
            .attr('cx', (n) => xScale(Math.max(0.1, n[$metric.x])))
            .attr('cy', (n) => yScale(Math.max(0.1, n[$metric.y])))
        ;

        // Update labels
        d3xLabel.text($metric.xLabel);
        d3yLabel.text($metric.yLabel);
    }

    function onClick() {
        let id = +d3.event.currentTarget.href.slice(-1);

        if (METRICS[id] === $metric) return;
        $metric = METRICS[id];

        update();
    }

    function onMouseEvent(node) {
        let e = d3.event,
            tooltip = d3tooltip.node(),
            x = xScale(Math.max(0.1, node[$metric.x])) + 0.6 * util.getRem(),
            y = yScale(Math.max(0.1, node[$metric.y])) - d3tooltipDimensions.height / 2;

        // Fit inside
        x = x + d3tooltipDimensions.width > d3svgDimensions.width ? x - d3tooltipDimensions.width - 1.2 * util.getRem() : x;
        y = Math.max(0, Math.min(d3svgDimensions.height - d3tooltipDimensions.height - CHART_MARGIN_BOTTOM, y));

        // Update data
        d3tooltip.select('thead td').text(node.$tag);
        d3tooltip.select('.x-label').text($metric.xLabel);
        d3tooltip.select('.x-value').text(FORMAT_NUMBER(node[$metric.x]));
        d3tooltip.select('.y-label').text($metric.yLabel);
        d3tooltip.select('.y-value').text(FORMAT_NUMBER(node[$metric.y]));

        e.type === 'mouseover' ? tooltip.classList.add('is-active') : tooltip.classList.remove('is-active');
        d3tooltip
            .attr('x', x)
            .attr('y', y);
    }

}());
