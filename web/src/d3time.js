const d3time = (function () {

    // Variables
    let $dispatcher = d3.dispatch('update'),
        $year = null,
        d3area,
        d3svg,
        d3svgDimensions,
        xAxis,
        xScale,
        yScaleArea
    ;

    return {
        $dispatcher,
        init
    };

    // From https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
    function init() {
        d3svg = d3.select('#time');
        d3svgDimensions = window.getComputedStyle(d3svg.node());
        d3svgDimensions = { height: parseInt(d3svgDimensions.height), width: parseInt(d3svgDimensions.width) };

        // Initialize axis
        xScale = d3.scaleTime().range([0, d3svgDimensions.width]);
        yScaleArea = d3.scaleLinear().range([16, d3svgDimensions.height]);

        xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat('%Y'));
        d3svg.select('.axis').append('line')
            .attr('y1', 0.5)
            .attr('y2', 0.5)
            .attr('x2', d3svgDimensions.width);

        // Initialize area
        d3area = d3.area()
            .curve(d3.curveMonotoneX)
            .x((n) => xScale(n.$date))
            .y0(d3svgDimensions.height)
            .y1((n) => yScaleArea(n.$radius))
        ;

        d3svg.select('.area')
            .attr('stroke', COLOR_PRIMARY)
            .attr('fill', COLOR_PRIMARY_OPACITY_50);

        // Event listeners
        data.$dispatcher.on('load.time', load);
    }

    function load(data) {
        //console.time('d3time.load');

        let yearsNum = data.dateMax.getFullYear() - data.dateMin.getFullYear() + 1,
            years = Array.from(Array(yearsNum).keys()).map((y) => y + data.dateMin.getFullYear());

        // Update axis
        xScale.domain([new Date(data.dateMin.getFullYear(), 0, 1), new Date(data.dateMax.getFullYear() + 1, 0, 1)]);
        yScaleArea.domain([d3.max(data.nodesByWeek, (n) => n.$radius), 0]);

        let numYears = data.dateMax.getFullYear() - data.dateMin.getFullYear() + 1;
        d3svg.select('.axis').call(xAxis.ticks(yearsNum));

        // Update area
        d3svg.select('.area').datum(data.nodesByWeek).attr('d', d3area);

        // Update focus
        let focus = d3svg.select('.focus').selectAll('rect').data(years);
        focus.exit().remove();          // Items to be removed
        focus.enter().append('rect')    // Items to be added
            .attr('height', d3svgDimensions.height)
            .attr('width', d3svgDimensions.width / yearsNum)
            .attr('x', (y) => years.indexOf(y) * d3svgDimensions.width / yearsNum)
            .attr('opacity', (y) => y !== $year ? '.5' : '0')
            .on('click', onClick)
        ;
        focus                           // Items to be updated
            .attr('width', d3svgDimensions.width / yearsNum)
            .attr('x', (y) => years.indexOf(y) * d3svgDimensions.width / yearsNum)
            .attr('opacity', (y) => y !== $year ? '.5' : '0');

        // Update labels
        d3svg.selectAll('.tick text')
            .attr('font-weight', (d) => d.getFullYear() === $year ? 'bold' : 'normal')
            .attr('transform', 'translate(' + (d3svgDimensions.width / numYears / 2) + ', -4)');

        // Select last year by default
        onClick(years[yearsNum - 1]);

        //console.timeEnd('d3time.load');
    }

    function onClick(y) {
        $year = y;

        // Update focus
        d3svg.select('.focus').selectAll('rect')
            .attr('opacity', (y) => y !== $year ? '.5' : '0');

        // Update labels
        d3svg.selectAll('.tick text')
            .attr('font-weight', (d) => d.getFullYear() === $year ? 'bold' : 'normal');

        // Dispatch event
        $dispatcher.call('update', this, y);
    }

}());