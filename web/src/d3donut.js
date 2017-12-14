const d3donut = (function () {

    // Variables
    let selectedTag = null,
    deltaLinks = null,
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
    colors_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"],
    colorOthers = 'gray',
    colorIdle = '#fad44f',
    maxTags = 8;
    ;

    return {
        init
    };

    function google_colors(n) {
        return colors_g[n % colors_g.length];
    }

    function init() {

        //width and height will be the same for both donut charts
        //we set the donut's height on the CSS and use it to calculate the width
        container = document.getElementsByClassName('donut-children')[0];
        height = container.offsetHeight;

        widthDonut = height;
        widthLegend = height * 0.5;
        paddingLegend = height * 0.1;
        container.style.width = (widthDonut + paddingLegend + widthLegend) + 'px';

        //make outer radius occupy all of available height
        outerRadius = height / 2;
        innerRadius = outerRadius * 0.8;

        //create SVGs for both charts
        var res = createChart('.donut-children', messageIdleChildren);
        svgChildren = res.donut;
        legendChildren = res.legend;

        res = createChart('.donut-related', messageIdleRelated);
        svgRelated = res.donut;
        legendRelated = res.legend;

        //define color scales here
        colorScaleChildren = google_colors;
        colorScaleRelated = google_colors;

		pie = d3.pie()
			.value(function(d) { return d.value; })
			.sort(null);

		arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // Event listeners
        d3time.$dispatcher.on('update.donut', (data) => {
            deltaLinks = data.delta.links;
            updateChildren();
            updateRelated();
        });

        d3graph.$dispatcher.on('select.donut', (selected) => {
            selectedTag = selected.id;
            updateChildren();
            updateRelated();
        });

    }

    function createChart(selector, messageIdle) {

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

        //create tooltip
        svgDonut
            .append('text')
            .attr('class', 'toolCircle')
            .attr('dy', -0)
            .html(messageIdle())
            .style('font-size', '.7em')
            .style('text-anchor', 'middle')
            .attr('visibility', 'hidden')
            ;

        svgDonut
            .append('circle')
            .attr('class', 'toolCircle')
            .attr('r', innerRadius * 0.95)
            .style('fill', colorIdle)
            .style('fill-opacity', 0.35)
            .attr('visibility', 'hidden')
            ;


        return {donut: svgDonut, legend: svgLegend};

    }

    function updateChildren() {
        if (selectedTag == null)
            return;

        donutData = []
        var total = 0;
        for (let d of deltaLinks) {
            if (d.source.id == selectedTag) {
                donutData.push({tag: d.target.tag, value: d.value});
                total += d.value;
            }
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

        //console.log(donutData);

        drawChart(svgChildren, legendChildren, donutData, colorScaleChildren);
        d3.selectAll('.donut-children .slice path').call(toolTip, svgChildren, colorScaleChildren, messageIdleChildren);

    }

    function updateRelated() {
        if (selectedTag == null)
            return;

        donutData = []
        var total = 0;
        for (let d of deltaLinks) {
            if (d.source.id == selectedTag) {
                var value = d.value * Math.random();
                donutData.push({tag: d.target.tag, value: value});
                total += value;
            }
        }

        //convert values to probabilities
        for (let d of donutData)
            d.value = d.value / total * 100;

        donutData.sort(function(a, b) { return a.value - b.value; });
        
        drawChart(svgRelated, legendRelated, donutData, colorScaleRelated);
        d3.selectAll('.donut-related .slice path').call(toolTip, svgRelated, colorScaleRelated, messageIdleRelated);

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
            .attr('font-size', '14px')
            .attr('dominant-baseline', 'central')
            .attr('x', '14px')
            .attr('y', function(d, i) { return 14 * i + 4 + 'px'; })
            .merge(svgData)
            .text(function(d) { return d.tag; })
            ;

        g.append('rect')
            .attr('x', 0)
            .attr('y', function(d, i) { return 14 * i + 'px'; })
            .attr('width', '8px')
            .attr('height', '8px')
			.style('fill', function(d, i) { return colorScale(i); })
            ;

        svgData.exit().remove();

        svg.selectAll('.toolCircle').attr('visibility', 'visible');

    }


    function toolTip(selection, svg, colorScale, messageIdle) {

        selection.on('mouseenter', function (d, i) {

            svg.select('text.toolCircle')
                .html(toolTipHTML(d))
                ;

            svg.select('circle.toolCircle')
                .style('fill', colorScale(i))
                ;
                
            /*
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
            */

        });

        selection.on('mouseout', function () {
            //d3.selectAll('.toolCircle').remove();

            svg.select('text.toolCircle')
                .html(messageIdle())
                ;

            svg.select('circle.toolCircle')
                .style('fill', colorIdle)
                ;

        });

    }

    function messageIdleChildren() {
        return '<tspan x="0" font-weight="bold">Sub Communities</tspan>';
    }

    function messageIdleRelated() {
        return '<tspan x="0" font-weight="bold">Related Communities</tspan>';
    }

    function toolTipHTML(d) {
        html = '';
        html += '<tspan x="0" font-weight="bold">' + d.data.tag  + '</tspan>';
        html += '<tspan x="0" dy="1.2em">' + d.data.value.toFixed(2)  + ' %</tspan>';

        return html
    }


}());
