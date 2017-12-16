const d3time = (function () {

    // Constants
    const PADDING_BOTTOM = 16;
    const PADDING_LEFT = 20;
    const TRANSITION_DURATION = 150;
    const FONT_SIZE = (m) => {
        let month = (dateMin.month + m - 1) % 12;
        return month === 0 ? '12px' : '11px';
    };
    const FONT_WEIGHT = (m) => {
        let month = (dateMin.month + m - 1) % 12;
        return month === 0 ? 'bold' : 'normal';
    };
    const TICK_FORMAT = (m) => {
        let year = dateMin.year + Math.floor((dateMin.month + m - 1) / 12),
            month = (dateMin.month + m - 1) % 12;
        return month === 0 ? year : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
    };

    // Variables
    let $brushed = false,
        $dispatcher = d3.dispatch('update'),
        d3area,
        d3brush,
        d3svg,
        d3svgDimensions,
        dateMin,
        dateMax,
        xAxis,
        xScale,
        xScale2,
        yScale
    ;

    return {
        $dispatcher,
        init
    };

    // From https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
    function init() {
        d3svg = d3.select('#time');
        d3svgDimensions = window.getComputedStyle(d3svg.node());
        d3svgDimensions = { height: parseInt(d3svgDimensions.height) - PADDING_BOTTOM, width: parseInt(d3svgDimensions.width) - PADDING_LEFT * 2 };

        // Initialize axis
        xScale = d3.scalePoint().range([0, d3svgDimensions.width]);
        xScale2 = d3.scaleTime().range([0, d3svgDimensions.width]);
        yScale = d3.scaleLinear().range([0, d3svgDimensions.height]);
        xAxis = d3.axisTop(xScale).tickFormat(TICK_FORMAT);

        // Initialize area
        d3area = d3.area()
            .curve(d3.curveMonotoneX)
            .x((d) => xScale2(d.date))
            .y0(d3svgDimensions.height)
            .y1((d) => yScale(d.value))
        ;

        // Initialize brush
        d3brush = d3.brushX()
            .extent([[0, 0], [d3svgDimensions.width, d3svgDimensions.height]])
            .on('end', brushed);

        d3svg.select('.area').attr('transform', 'translate(' + PADDING_LEFT + ', 0)').attr('fill', COLOR_PRIMARY);
        d3svg.select('.axis').attr('transform', 'translate(' + PADDING_LEFT + ',' + d3svgDimensions.height + ')');
        d3svg.select('.brush').attr('transform', 'translate(' + PADDING_LEFT + ', 0)').attr('stroke-width', '0');

        data.$dispatcher.on('load.time', load);
    }

    function load(data) {
        $dispatcher.call('update', this, { year: 2016 });
        return;

        console.time('d3time.load');

        // Note: time is represented as [dateMin, dateMax[
        dateMin = { year: data.dateMin.getFullYear(), month: data.dateMin.getMonth() + 1, day: 1 };
        dateMax = { year: data.dateMax.getFullYear(), month: data.dateMax.getMonth() + 2, day: 1 };

        // Update X axis
        let monthNum = (12 - dateMin.month + 1) + Math.max(0, dateMax.year - dateMin.year - 1) * 12 + dateMax.month;
        xScale.domain(Array.from(Array(monthNum).keys()));
        d3svg.select('.axis').call(xAxis);
        d3svg.selectAll('.axis text')
            .attr('font-size', FONT_SIZE)
            .attr('font-weight', FONT_WEIGHT)
            .attr('transform', 'translate(0, 22)');

        // Update area
        xScale2.domain(d3.extent(data.community, (d) => d.date));
        yScale.domain([d3.max(data.community, (d) => d.value), 0]);
        d3svg.select('.area').datum(data.community).attr('d', d3area);

        // Update brush (select the last 6 months by default)
        d3svg.select('.brush')
            .call(d3brush)
            .call(d3brush.move, [xScale(monthNum - 6), xScale(monthNum - 1)]);

        console.timeEnd('d3time.load');
    }

    function brushed() {
        if ($brushed)
            return $brushed = false;
        $brushed = true;

        let step = xScale.step(),
            selection = d3.event.selection || xScale.range(),
            selectionMax = xScale.range()[1] / step,
            selectionStart = Math.round(selection[0] / step),
            selectionEnd = Math.round(selection[1] / step);

        // Make sure at least 1 month is selected
        if (selectionStart === selectionEnd)
            if (selectionEnd === selectionMax)
                selectionStart = selectionEnd - 1;
            else
                selectionEnd = selectionStart + 1;

        // Snap brush to selection
        d3svg.select('.brush')
            .transition().duration(TRANSITION_DURATION)
            .call(d3brush.move,  [selectionStart * step, selectionEnd * step]);

        let dateStart = { year: dateMin.year + Math.floor((dateMin.month + selectionStart - 1) / 12), month: (dateMin.month + selectionStart - 1) % 12 + 1, day: dateMin.day },
            dateEnd = { year: dateMin.year + Math.floor((dateMin.month + selectionEnd  - 1) / 12), month: (dateMin.month + selectionEnd - 1) % 12 + 1, day: dateMin.day };

        if (dateEnd.year === dateMax.year && dateEnd.month === dateMax.month && dateEnd.day === dateMax.day) {
            let datePrevious = new Date(dateEnd.year, dateEnd.month - 1, dateEnd.day);
            datePrevious.setDate(datePrevious.getDate() - 1);
            dateEnd = { year: datePrevious.getFullYear(), month: datePrevious.getMonth() + 1, day: datePrevious.getDate() };

            if (dateStart.year === dateEnd.year && dateStart.month === dateEnd.month) {
                let datePrevious = new Date(dateStart.year, dateStart.month - 1, dateStart.day);
                datePrevious.setDate(datePrevious.getDate() - 1);
                dateStart = { year: datePrevious.getFullYear(), month: datePrevious.getMonth() + 1, day: datePrevious.getDate() };
            }
        }

        // Dispatch event
        $dispatcher.call('update', this, { dateStart, dateEnd });
    }

}());