const d3time = (function () {

    // Constants
    const PADDING_BOTTOM = 20;
    const PADDING_LEFT = 20;
    const TRANSITION_DURATION = 150;
    const TICK_FORMAT = (m) => {
        //if (m === 0 || m === xScale.domain()[1] - 1) return '';
        let year = dateMin.year + Math.floor((dateMin.month + m - 1) / 12),
            month = (dateMin.month + m - 1) % 12;
        return month === 0 ? year : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
    };

    // Variables
    let $brushed = false,
        $dispatcher = d3.dispatch('update'),
        d3brush,
        d3svg,
        d3svgDimensions,
        dateMin,
        dateMax,
        xAxis,
        xScale
    ;

    return {
        $dispatcher,
        init
    };

    function init() {
        d3svg = d3.select('#time');
        d3svgDimensions = window.getComputedStyle(d3svg.node());
        d3svgDimensions = { height: parseInt(d3svgDimensions.height), width: parseInt(d3svgDimensions.width) - PADDING_LEFT * 2 };

        d3brush = d3.brushX()
            .extent([[0, 0], [d3svgDimensions.width, d3svgDimensions.height]])
            .on('end', brushed);

        xScale = d3.scalePoint().range([0, d3svgDimensions.width]);
        xAxis = d3.axisBottom(xScale).tickFormat(TICK_FORMAT);

        d3svg.select('.axis').attr('transform', 'translate(' + PADDING_LEFT + ',' + (d3svgDimensions.height - PADDING_BOTTOM) + ')');
        d3svg.select('.brush').attr('transform', 'translate(' + PADDING_LEFT + ',0)');

        data.$dispatcher.on('load.time', load);
    }

    function load(data) {
        console.time('time.load');

        // Note: time is represented as [dateMin, dateMax[
        dateMin = { year: data.dateMin.getFullYear(), month: data.dateMin.getMonth() + 1, day: 1 };
        dateMax = { year: data.dateMax.getFullYear(), month: data.dateMax.getMonth() + 2, day: 1 };

        // Update X axis
        let monthNum = (12 - dateMin.month + 1) + Math.max(0, dateMax.year - dateMin.year - 1) * 12 + dateMax.month;
        xScale.domain(Array.from(Array(monthNum).keys()));
        d3svg.select('.axis').call(xAxis);

        // Update brush
        d3svg.select('.brush')
            .call(d3brush)
            .call(d3brush.move,  xScale.range());

        console.timeEnd('time.load');
    }

    // From https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
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