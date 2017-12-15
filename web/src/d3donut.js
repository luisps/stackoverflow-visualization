const d3donut = (function () {

    // Variables
    let selectedTag = null,
        links = null,
        widthDonut = null,
        widthLegend = null,
        paddingLegend = null,
        height = null,
        svgChildren = null,
        svgRelated = null,
        legendChildren = null,
        legendRelated = null,
        colorScaleChildren = null,
        colorScaleRelated = null,
        innerRadius = null,
        outerRadius = null,
        pie = null,
        arc = null,
        donutData = null,
        colors_g = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395', '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'],
        colorOthers = 'gray',
        maxTags = 8;
        ;

    return {
        init,
        googleColors
    };

    function googleColors(n) {
        return colors_g[n % colors_g.length];
    }

    function init() {

        //width and height will be the same for both donut charts
        //we set the donut's height on the CSS and use it to calculate the width
        container = document.getElementById('sub-communities');
        height = container.offsetHeight;

        widthDonut = height;
        widthLegend = height * 0.4;
        paddingLegend = height * 0.05;
        container.style.width = (widthDonut + paddingLegend + widthLegend) + 'px';

        //make outer radius occupy all of available height
        outerRadius = height / 2;
        innerRadius = outerRadius * 0.8;

        //create SVGs for both charts
        var res = createChart('#sub-communities');
        svgChildren = res.donut;
        legendChildren = res.legend;

        res = createChart('#related-communities');
        svgRelated = res.donut;
        legendRelated = res.legend;

        //define color scales here
        colorScaleChildren = googleColors;
        colorScaleRelated = googleColors;

		pie = d3.pie()
			.value(function(d) { return d.value; })
			.sort(null);

		arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // Event listeners
        d3sidebar.$dispatcher.on('load.donut', (data) => {
            selectedTag = data.node.$id;
            links = data.node.$links;
            console.log(links);
            //updateChildren();
            updateRelated();
        });

    }

    function createChart(selector) {

        var chart = d3.select(selector);

        var svgDonut = chart.append('svg')
            .attr('width', widthDonut)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate('+widthDonut/2+','+height/2+')')
            ;

        var svgLegend = chart.append('svg')
            .attr('width', widthLegend)
            .attr('height', height)
            .style('padding-left', paddingLegend + 'px')
            .attr('class', 'donut-legend');
            ;

        return {donut: svgDonut, legend: svgLegend};

    }

    function updateChildren() {
        if (selectedTag == null)
            return;

        //drawChart(svgChildren, legendChildren, donutData, colorScaleChildren);
        //d3.selectAll('#sub-communities .slice path').call(toolTip, svgChildren, colorScaleChildren);

    }

    function updateRelated() {
        if (selectedTag == null)
            return;

        donutData = []
        var total = 0;
        for (let d of links) {
            var tag = (d.tag1 == selectedTag) ? d.tag1 : d.tag2;
            donutData.push({tag: tag, value: d.value});
            total += d.value;
        }

        //must sort array first
        donutData.sort(function(a, b) { return b.value - a.value; });

        //aggregate extra tags into others
        donutData = donutData.slice(0, maxTags);

        var includingTagsTotal = donutData.reduce(function(total, elem) {
            return total + elem.value;
        }, 0);

        var extraTagsTotal = total - includingTagsTotal;
        donutData.push({tag: 'Others', value: extraTagsTotal});

        //convert values to probabilities
        for (let d of donutData)
            d.value = d.value / total * 100;

        drawChart(svgRelated, legendRelated, donutData, colorScaleRelated);
        d3.selectAll('#related-communities .slice path').call(toolTip, svgRelated, colorScaleRelated);

    }

    function drawChart(svg, legend, donutData, colorScale) {

        //draw donut chart
		var svgData = svg.selectAll('.slice')
		    .data(pie(donutData));

        var slice = svgData
		    .enter().append('g')
            .merge(svgData)
		    .attr('class', 'slice')
            ;

        svgData.exit().remove();

        slice.append('path')
			.attr('d', arc)
			.style('fill', function(d, i) { return colorScale(i); })
			;

        //draw legend
        svgData = legend.selectAll('g')
            .data(donutData);

        var g = svgData
		    .enter()
            .append('g')
            ;

        g.append('text')
            .attr('font-size', '10px')
            .attr('dominant-baseline', 'central')
            .attr('x', '14px')
            .attr('y', function(d, i) { return 10 * i + 4 + 'px'; })
            .merge(svgData)
            .text(function(d) { return d.tag; })
            ;

        g.append('rect')
            .attr('x', 0)
            .attr('y', function(d, i) { return 10 * i + 'px'; })
            .attr('width', '8px')
            .attr('height', '8px')
			.style('fill', function(d, i) { return colorScale(i); })
            ;

        svgData.exit().remove();

        svg.selectAll('.toolCircle').attr('visibility', 'visible');

    }


    function toolTip(selection, svg, colorScale) {

        selection.on('mouseenter', function (d, i) {
                
            svg.append('text')
                .attr('class', 'toolCircle')
                .attr('dy', -0)
                .html(toolTipHTML(d))
                .style('font-size', '.7em')
                .style('text-anchor', 'middle');

            svg.append('circle')
                .attr('class', 'toolCircle')
                .attr('r', innerRadius * 0.95)
                .style('fill', colorScale(i))
                .style('fill-opacity', 0.35);

        });

        selection.on('mouseout', function () {
            d3.selectAll('.toolCircle').remove();
        });

    }

    function toolTipHTML(d) {
        html = '';
        html += '<tspan x="0" font-weight="bold">' + d.data.tag  + '</tspan>';
        html += '<tspan x="0" dy="1.2em">' + d.data.value.toFixed(2)  + ' %</tspan>';

        return html
    }


}());
