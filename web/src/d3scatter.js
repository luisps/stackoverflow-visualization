const d3scatter = (function () {

    // Variables
    let nodes = null,
        svg = null,
        width = null,
        height = null,
        margin = null,
        xMetric = null,
        yMetric = null,
        xLabel = null,
        yLabel = null,
        xScale = null,
        yScale = null,
        tooltip = null,
        filter = null
    ;   

    return {
        init
    };  

    function init() {

        var container = document.getElementById('scatter');
        margin = {top: 10, right: 20, bottom: 35, left: 35};

        width = container.offsetWidth - margin.left - margin.right;
        height = container.offsetHeight - margin.top - margin.bottom;

        //metrics to plot on the x and y axis
        xMetric = 'questioncount';
        yMetric = 'answercount';

        xLabel = 'Questions';
        yLabel = 'Answers';

        //add some padding so that there aren't dots on the origin
        //or on the top right corner of graph
        var padding = {top: 10, right: 15, bottom: 10, left: 10};
        xScale = d3.scaleLog()
            .base(10)
            .clamp(true)
            .range([padding.left, width - padding.right]);

        yScale = d3.scaleLog()
            .base(10)
            .clamp(true)
            .range([height - padding.top, padding.bottom]);

        createChart(container);

        // Event listeners
        d3sidebar.$dispatcher.on('load.scatter', (data) => {
            //scatter plot is hidden on local view
            if (data.node != null)
                return;

            nodes = data.nodesByYear;
            update();
        });

    }

    function createChart(container) {

        svg = d3.select(container).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            ;

        tooltip = d3.select(container).select('.tooltip');

        //define gradient to be used for coloring dots
        gradient = svg.append('defs')
            .append('radialGradient')
            .attr('id', 'dot-fill')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '50%')
            .attr('fx', '50%')
            .attr('fy', '50%')
            ;

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'white')
            ;

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', COLOR_PRIMARY)
            ;

		//X axis
        var xAxis = svg.append('g')
            .attr('class', 'scatter-x-axis')
            .attr('transform', 'translate(0,' + height + ')')
            ;

        xAxis.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', width)
            .attr('y2', 0)
            ;

        xAxis.append('text')             
			.attr('transform', 'translate(' + (width/2) + ' ,' + 
						   (margin.bottom - 15) + ')')
			.text(xLabel);

		//Y axis
        var yAxis = svg.append('g')
            .attr('class', 'scatter-y-axis')
            ;

        yAxis.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', height)
            ;

		yAxis.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', - margin.left + 10)
			.attr('x', - (height / 2))
			.attr('dy', '1em')
			.text(yLabel);

        d3.selectAll('#metrics .mdl-tabs__tab').call(metrics);

    }

    function update() {

        xScale.domain(d3.extent(nodes, function(n) { return n[xMetric]; }));
        yScale.domain(d3.extent(nodes, function(n) { return n[yMetric]; }));

		var dot = svg.selectAll('.dot')
			.data(nodes);

		dot.enter().append('circle')
			.attr('class', 'dot')
            .attr('r', 5)
            .attr('fill', 'url(#dot-fill)')
            .attr('cy', height)  // set y here for smooth transition
            .merge(dot)
            .call(toolTip)
            .transition()
            .attr('cx', function(d) { return xScale(d[xMetric]); })
            .attr('cy', function(d) { return yScale(d[yMetric]); })
            ;

        dot.exit().remove();

    }   

    function metrics(selection) {

        selection.on('click', function () {

            selection.attr('class', 'mdl-tabs__tab');
            this.setAttribute('class', 'mdl-tabs__tab is-active');

            var text = this.innerText;

            if (text == 'QUESTIONS-ANSWERS') {
                xMetric = 'questioncount';
                yMetric = 'answercount';

                xLabel = 'Questions';
                yLabel = 'Answers';
            } else if (text == 'ANSWERS-COMMENTS') {
                xMetric = 'answercount';
                yMetric = 'commentcount';

                xLabel = 'Answers';
                yLabel = 'Comments';
            } else if (text == 'UPVOTES-DOWNVOTES') {
                xMetric = 'upvotes';
                yMetric = 'downvotes';

                xLabel = 'Upvotes';
                yLabel = 'Downvotes';
            }

            //update axis labels
            svg.select('.scatter-x-axis text').text(xLabel);
            svg.select('.scatter-y-axis text').text(yLabel);

            update();

        });

    }

    function toolTip(selection) {

        selection.on('mouseenter', function (d, i) {

            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);

            tooltip
                .style('left', margin.left + xScale(d[xMetric]) + 'px')
                .style('top', margin.top + yScale(d[yMetric]) - 40  + 'px')
                .html(toolTipHTML(d))
                .style('transform', 'translate(-50%, -50%)')
                ;

        });

        selection.on('mouseout', function (d, i) {

            tooltip.transition()
                .duration(400)
                .style('opacity', 0.0);

        });

    }

    function toolTipHTML(d) {
        html = ''
        html += '<span><b>' + d['$tag'] + '</b></span><br>';
        html += '<span>X: ' + d[xMetric] + '  Y: ' + d[yMetric] + '</span>';

        return html;
    }

}());
