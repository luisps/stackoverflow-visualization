const d3donut = (function () {

    // Variables
    let $dispatcher = d3.dispatch('setRecursion'),
        selectedTag = null,
        links = null,
        children = null,
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
        recursion = null,
        pie = null,
        arc = null,
        donutData = null,
        colors_g = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395', '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'],
        colorOthers = 'gray',
        maxTagsLegend = 8,
        maxTagsDonut = 15,
        legendFontSize = 12
        ;

    return {
        init,
        googleColors,
        $dispatcher
    };

    function googleColors(i) {
        return colors_g[i % colors_g.length];
    }

    function colorScale(d, i) {
        if (d.tag == 'None' || i >= maxTagsDonut)
            return colorOthers;
        else
            return googleColors(i);
    }

    function init() {

        //width and height will be the same for both donut charts
        //we set the donut's height on the CSS and use it to calculate the width
        let container = document.getElementById('scatter');
        let containerDimensions = container.getBoundingClientRect();

        height = containerDimensions.height;

        widthDonut = height;
        widthLegend = containerDimensions.width - widthDonut;

        //control how far away the legend is from the donut
        widthLegend *= 0.85;

        //make outer radius occupy all of available height
        outerRadius = height / 2;
        innerRadius = outerRadius * 0.8;

        //create SVGs for both charts
        var res = createChart('#donut-sub');
        svgChildren = res.donut;
        legendChildren = res.legend;

        res = createChart('#donut-related');
        svgRelated = res.donut;
        legendRelated = res.legend;

        //define color scales here
        colorScaleChildren = colorScale;
        colorScaleRelated = colorScale;

		pie = d3.pie()
			.value(function(d) { return d.value; })
			.sort(null);

		arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // Event listeners
        d3sidebar.$dispatcher.on('load.donut', (data) => {
            //donut charts are hidden on global view
            if (data.node == null)
                return;

            selectedTag = data.node.$tag;
            links = data.node.$links;
            children = Object.values(data.node.$children);
            updateChildren();
            updateRelated();
        });

        $dispatcher.on('setRecursion', (eventName, flag) => {
            recursion[eventName] = flag;
        });

    }

    function updateChildren() {
        if (selectedTag == null)
            return;

        donutData = []
        var total = 0;
        for (let d of children) {
            donutData.push({tag: d.$tag, value: d.$radius});
            total += d.$radius;
        }

        donutData = processData(donutData, total);

        drawChart(svgChildren, legendChildren, donutData, colorScaleChildren);

        var slices = d3.selectAll('#donut-sub .slice');
        slices.call(toolTip, svgChildren, colorScaleChildren);
        slices.call(interactBubble);

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

        donutData = processData(donutData, total);

        drawChart(svgRelated, legendRelated, donutData, colorScaleRelated);

        var slices = d3.selectAll('#donut-related .slice');
        slices.call(toolTip, svgRelated, colorScaleRelated);

    }

    function processData(donutData, total) {

        //handle case when there is no data
        if (donutData.length == 0) {
            donutData.push({tag: 'None', value: 100});
            return donutData;
        }

        //must sort array first
        donutData.sort(function(a, b) { return b.value - a.value; });

        //aggregate extra tags into others
        donutData = donutData.slice(0, maxTagsDonut);

        //calculate total count for tags that will be included
        var includingTagsTotal = donutData.reduce(function(total, elem) {
            return total + elem.value;
        }, 0);

        var extraTagsTotal = total - includingTagsTotal;
        if (extraTagsTotal != 0)
            donutData.push({tag: 'Others', value: extraTagsTotal});

        //convert values to probabilities
        for (let d of donutData)
            d.value = d.value / total * 100;

        return donutData;

    }

    function createChart(selector) {

        var chart = d3.select(selector);

        var donut = chart/*.append('svg')
            .attr('width', widthDonut)
            .attr('height', height)
            .attr('class', 'donut-chart')*/
            .append('g')
            .attr('transform', 'translate('+widthDonut/2+','+height/2+')')
            ;

        var legend = chart.append('g')
            .attr('transform', 'translate(' + (widthDonut + 1 * util.getRem()) + ', 0)')
            /*.append('svg')
            .style('width', widthLegend + 'px')
            .style('height', height + 'px')
            .attr('class', 'donut-legend')*/
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
			.style('fill', function(d, i) { return colorScale(d.data, i); })
            ;

        svgData.exit().remove();

        //draw legend
        //must first clip data to be able to fit in legend
        var donutDataClipped = (donutData.length > maxTagsLegend) ? donutData.slice(0, maxTagsLegend) : donutData;

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
			.style('fill', function(d, i) { return colorScale(d, i); })
            ;

        //update on data change
        svgData.select('text')
            .text(function(d) { return d.tag; });

        svgData.select('rect')
			.style('fill', function(d, i) { return colorScale(d, i); })

        svgData.exit().remove();

    }

    function interactBubble(selection) {

        //the logic is that when an event on the bubble chart
        //occurs we call the corresponding event on the donut
        //chart and vice-versa, due to this our application
        //must properly deal with event recursion
        recursion = {'mouseenter': false, 'mouseout': false};

        //use a decorator to add extra behaviour to sub communities
        var enterCallback = selection.on('mouseenter');
        selection.on('mouseenter', function(d, i) {

            if (recursion.mouseenter) {
                recursion.mouseenter = false;
                d3bubble.$dispatcher.call('setRecursion', this,
                    'mouseenter', false);

                return;
            }

            //call decorated callback
            enterCallback(d, i);

            //call "mouseenter" event on bubble chart
            recursion.mouseenter = true;
            d3.select('#bubble .bubble-circle:nth-of-type('+(i+2)+')').dispatch('mouseenter');

        });

        var outCallback = selection.on('mouseout');
        selection.on('mouseout', function(d, i) {

            if (recursion.mouseout) {
                recursion.mouseout = false;
                d3bubble.$dispatcher.call('setRecursion', this,
                    'mouseout', false);

                return;
            }

            //call decorated callback
            outCallback(d, i);

            //call "mouseout" event on bubble chart
            recursion.mouseout = true;
            d3.select('#bubble .bubble-circle:nth-of-type('+(i+2)+')').dispatch('mouseout');

        });

    }

    function toolTip(selection, svg, colorScale) {

        selection.on('mouseenter', function (d, i) {

            svg.append('circle')
                .attr('class', 'toolCircle')
                .attr('r', innerRadius * 0.95)
                .attr('fill', colorScale(d.data, i))
                .attr('opacity', 1);

            svg.append('text')
                .attr('class', 'toolCircle')
                .attr('dy', -0)
                .html(toolTipHTML(d))
                .attr('fill', 'white')
                .attr('text-anchor', 'middle');

        });

        selection.on('mouseout', function (d, i) {
            d3.selectAll('.toolCircle').remove();

        });

    }

    function toolTipHTML(d) {
        html = '';
        html += '<tspan x="0" dy="-0.5em" style="font-weight: bold; font-size: 1rem;">' + d.data.tag + '</tspan>';
        html += '<tspan x="0" dy="1.2em" style="font-size: 1.5rem;">' + d.data.value.toFixed(2) + ' %</tspan>';
        //html += '<tspan x="0" font-weight="bold">' + d.data.tag  + '</tspan>';
        //html += '<tspan x="0" dy="1.2em">' + d.data.value.toFixed(2)  + ' %</tspan>';

        return html
    }


}());
