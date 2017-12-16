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
        tooltip = null
    ;   

    return {
        init
    };  

    function init() {

        var container = document.getElementById('scatter');
        margin = {top: 20, right: 20, bottom: 50, left: 70};

        width = container.offsetWidth - margin.left - margin.right;
        height = container.offsetHeight - margin.top - margin.bottom;

        //hardcoded year
        var year = 2017;

        //metrics to plot on the x and y axis
        xMetric = 'answercount';
        yMetric = 'commentcount';

        xLabel = 'Answers';
        yLabel = 'Comments';

        /*
        xScale = d3.scaleLinear()
            .range([0, width]);

        yScale = d3.scaleLinear()
            .range([height, 0]);
        */
        xScale = d3.scaleLog()
            .base(2)
            .clamp(true)
            .range([0, width]);

        yScale = d3.scaleLog()
            .base(2)
            .clamp(true)
            .range([height, 0]);

        createChart(container);

        // Event listeners
        d3sidebar.$dispatcher.on('load.scatter', update);
    }

    function createChart(container) {

        svg = d3.select(container).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            ;

        tooltip = d3.select(container).select('.tooltip');

		//X axis
        svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(xScale))
            ;

        svg.append('text')             
            .attr('class', 'scatter-x-axis')
			.attr('transform', 'translate(' + (width/2) + ' ,' + 
						   (height + margin.top + 20) + ')')
			.style('text-anchor', 'middle')
			.text(xLabel);

		//Y axis
        svg.append('g')
            .call(d3.axisLeft(yScale))
            ;

		svg.append('text')
            .attr('class', 'scatter-y-axis')
			.attr('transform', 'rotate(-90)')
			.attr('y', - margin.left)
			.attr('x', - (height / 2))
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text(yLabel);

        d3.selectAll('#scatter-container .metrics p').call(metrics);

    }

    function metrics(selection) {

        selection.on('click', function () {

            selection.attr('class', '');
            this.setAttribute('class', 'active');

            var text = this.innerHTML;

            if (text == 'Ques-Ans') {
                xMetric = 'questioncount';
                yMetric = 'answercount';

                xLabel = 'Questions';
                yLabel = 'Answers';
            } else if (text == 'Ans-Comm') {
                xMetric = 'answercount';
                yMetric = 'commentcount';

                xLabel = 'Answers';
                yLabel = 'Comments';
            } else if (text == 'UpVotes-DownVotes') {
                xMetric = 'upvotes';
                yMetric = 'downvotes';

                xLabel = 'Upvotes';
                yLabel = 'Downvotes';
            }

            //update axis labels
            svg.select('.scatter-x-axis').text(xLabel);
            svg.select('.scatter-y-axis').text(yLabel);

            update();
        });

    }

    function update(data) {

        nodes = data.nodesByYear;

        //xScale.domain([1, d3.max(nodes, function(n) { return n[xMetric]; })]);
        //yScale.domain([1, d3.max(nodes, function(n) { return n[yMetric]; })]);

        xScale.domain(d3.extent(nodes, function(n) { return n[xMetric]; }));
        yScale.domain(d3.extent(nodes, function(n) { return n[yMetric]; }));


		var dot = svg.selectAll('.dot')
			.data(nodes);

		dot.enter().append('circle')
			.attr('class', 'dot')
            .attr('r', 4)
            .attr('fill', function(d, i) { return d3donut.googleColors(i); })
            .attr('cy', height)  // set y here for smooth transition
            .merge(dot)
            .call(toolTip)
            .transition()
            .attr('cx', function(d) { return xScale(d[xMetric]); })
            .attr('cy', function(d) { return yScale(d[yMetric]); })
            ;

        dot.exit().remove();

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
