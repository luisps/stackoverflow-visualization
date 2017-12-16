const d3donut = (function () {

    // Variables
    let selectedTag = null,
        links = null,
        widthDonut = null,
        widthLegend = null,
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
        maxTags = 8,
        legendFontSize = 12
        ;

    return {
        init,
        googleColors
    };

    function googleColors(n) {
        return colors_g[n % colors_g.length];
    }

    function colorScale(n) {
        return (n >= maxTags-1) ? colorOthers : googleColors(n);
    }

    function init() {

        //width and height will be the same for both donut charts
        //we set the donut's height on the CSS and use it to calculate the width
        container = document.getElementById('sub-communities');
        height = container.offsetHeight;

        widthDonut = height;
        widthLegend = container.offsetWidth - widthDonut;

        //control how far away the legend if from the donut
        widthLegend *= 0.85;

        console.log(widthDonut);
        console.log(widthLegend);

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
        colorScaleRelated = colorScale;

		pie = d3.pie()
			.value(function(d) { return d.value; })
			.sort(null);

		arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // Event listeners
        d3sidebar.$dispatcher.on('load.donut', (data) => {
            selectedTag = data.node.$tag;
            links = data.node.$links;
            updateChildren();
            updateRelated();
        });

    }

    function updateChildren() {
        if (selectedTag == null)
            return;

        //very similar code to related
        //here instead we don't do aggregating into others
        donutData = []
        var total = 0;
        for (let d of links) {
            var tag = (d.tag1 == selectedTag) ? d.tag2 : d.tag1;
            donutData.push({tag: tag, value: d.value});
            total += d.value;
        }

        //must sort array first
        donutData.sort(function(a, b) { return b.value - a.value; });

        //convert values to probabilities
        for (let d of donutData)
            d.value = d.value / total * 100;

        drawChart(svgChildren, legendChildren, donutData, colorScaleChildren);
        d3.selectAll('#sub-communities .slice').call(toolTip, svgChildren, colorScaleChildren);

    }

    function updateRelated() {
        if (selectedTag == null)
            return;

        donutData = []
        var total = 0;
        for (let d of links) {
            var tag = (d.tag1 == selectedTag) ? d.tag2 : d.tag1;
            donutData.push({tag: tag, value: d.value});
            total += d.value;
        }

        //must sort array first
        donutData.sort(function(a, b) { return b.value - a.value; });

        //aggregate extra tags into others
        donutData = donutData.slice(0, maxTags-1);

        var includingTagsTotal = donutData.reduce(function(total, elem) {
            return total + elem.value;
        }, 0);

        var extraTagsTotal = total - includingTagsTotal;
        if (extraTagsTotal != 0)
            donutData.push({tag: 'Others', value: extraTagsTotal});

        //convert values to probabilities
        for (let d of donutData)
            d.value = d.value / total * 100;

        drawChart(svgRelated, legendRelated, donutData, colorScaleRelated);
        d3.selectAll('#related-communities .slice').call(toolTip, svgRelated, colorScaleRelated);

    }

    function createChart(selector) {

        var chart = d3.select(selector);

        var donut = chart.append('svg')
            .attr('width', widthDonut)
            .attr('height', height)
            .attr('class', 'donut-chart')
            .append('g')
            .attr('transform', 'translate('+widthDonut/2+','+height/2+')')
            ;

        var legend = chart.append('svg')
            .style('width', widthLegend + 'px')
            .style('height', height + 'px')
            .attr('class', 'donut-legend')
            ;

        return {donut: donut, legend: legend};

    }

    function drawChart(svg, legend, donutData, colorScale) {

        //draw donut chart
		var svgData = svg.selectAll('.slice')
		    .data(pie(donutData));

        var slice = svgData
		    .enter().append('path')
		    .attr('class', 'slice')
            .merge(svgData)
			.attr('d', arc)
			.style('fill', function(d, i) { return colorScale(i); })
            ;

        svgData.exit().remove();

        //draw legend
        //must first clip data to be able to fit in legend
        var donutDataClipped = (donutData.length > maxTags) ? donutData.slice(0, maxTags) : donutData;

        svgData = legend.selectAll('.legend-item')
            .data(donutDataClipped);

        var item = svgData
		    .enter().append('g')
		    .attr('class', 'legend-item')
            .style('font-size', legendFontSize + 'px')
            .attr('transform', function(d, i) {
                //calculate y pos for rectangle and tag
                return 'translate(0, ' + (i+1)*legendFontSize + ')';
            });
        
        //create text for tag name
        item
            .append('text')
            .attr('x', '1.2em')
            .text(function(d) { return d.tag; })
            ;

        //create a rect with tag's color
        item
            .append('rect')
            .attr('width', '0.8em')
            .attr('height', '0.8em')
            .attr('y', '-0.7em')  // 0.5em to get text's half height and 0.2 em for initial vertical padding
			.style('fill', function(d, i) { return colorScale(i); })
            ;

        //update on data change
        svgData.select('text')
            .text(function(d) { return d.tag; });

        svgData.select('rect')
			.style('fill', function(d, i) { return colorScale(i); })

        svgData.exit().remove();

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
