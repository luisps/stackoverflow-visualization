const d3scatter = (function () {

    // Variables
    let nodes = null,
        svg = null,
        width = null,
        height = null,
        margin = null,
        padding = null,
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

        //hardcoded year
        var year = 2017;

        //metrics to plot on the x and y axis
        xMetric = 'answercount';
        yMetric = 'commentcount';

        xLabel = 'Answers';
        yLabel = 'Comments';

        padding = {top: 10, right: 15, bottom: 10, left: 10};
        xScale = d3.scaleLog()
            .base(10)
            .clamp(true)
            .range([padding.left, width - padding.right]);
            //.range([0, width]);

        yScale = d3.scaleLog()
            .base(10)
            .clamp(true)
            .range([height - padding.top, padding.bottom]);
            //.range([height, 0]);

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

        filter = svg.append('defs')
            .append('filter')
            .attr('id', 'dot-style')
            //.attr('width', '200%')
            //.attr('height', '200%')
            ;

        /*
        <feOffset result="offOut" in="SourceAlpha" dx="20" dy="20" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        */

        /*
        filter.append('feOffset')
            .attr('result', 'offOut')
            .attr('in', 'SourceGraphic')
            .attr('dx', 2)
            .attr('dy', 2)
            ;

        filter.append('feBlend')
            .attr('in', 'sourceGraphic')
            .attr('in2', 'blurOut')
            .attr('mode', 'normal')
            ;
        */

        filter.append('feGaussianBlur')
            .attr('result', 'sourceGraphic')
            .attr("stdDeviation", 2)
            ;

		//X axis
        svg.append('g')
            .attr('class', 'scatter-x-axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(
                d3.scaleLinear().range([0, width])).ticks(0))
            //.call(d3.axisBottom(xScale).ticks(0))
            ;

        svg.append('text')             
            .attr('class', 'scatter-x-label')
			.attr('transform', 'translate(' + (width/2) + ' ,' + 
						   (height + margin.bottom - 15) + ')')
			.style('text-anchor', 'middle')
			.text(xLabel);

		//Y axis
        svg.append('g')
            .attr('class', 'scatter-y-axis')
            .call(d3.axisLeft(
                d3.scaleLinear().range([height, 0])).ticks(0))
            //.call(d3.axisLeft(yScale).ticks(0))
            ;

		svg.append('text')
            .attr('class', 'scatter-y-label')
			.attr('transform', 'rotate(-90)')
			.attr('y', - margin.left + 8)
			.attr('x', - (height / 2))
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text(yLabel);

        d3.selectAll('#scatter-container .metrics p').call(metrics);

    }

    function update() {

        //xScale.domain([1, d3.max(nodes, function(n) { return n[xMetric]; })]);
        //yScale.domain([1, d3.max(nodes, function(n) { return n[yMetric]; })]);

        var xDomain = d3.extent(nodes, function(n) { return n[xMetric]; });
        var yDomain = d3.extent(nodes, function(n) { return n[yMetric]; });

        //console.log(xDomain);
        //console.log(d3.quantile(nodes, 0.25, function(n) { return n[xMetric]; }));
        //console.log(d3.quantile(nodes, 0.75, function(n) { return n[xMetric]; }));
        //xDomain[0] -= d3.quantile(nodes, 0.25);
        //xDomain[1] += d3.quantile(nodes, 0.75);

        xScale.domain(xDomain);
        yScale.domain(yDomain);


		var dot = svg.selectAll('.dot')
			.data(nodes);

		dot.enter().append('circle')
			.attr('class', 'dot')
            .attr("filter", "url(#dot-style)")
            .attr('r', 5)
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
            svg.select('.scatter-x-label').text(xLabel);
            svg.select('.scatter-y-label').text(yLabel);

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
