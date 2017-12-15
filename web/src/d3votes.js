const d3votes = (function () {

    const paddingOuter = 4;
    const paddingInner = 1;

    // Variables
    let selectedTag = null,
        width = null,
        height = null,
        svg = null,
        upvoteScale = null,
        downvoteScale = null,
        tooltip = null
        ;

    return {
        init
    };

    function init() {

        container = document.getElementsByClassName('votes')[0];
        width = container.offsetWidth;
        height = container.offsetHeight;

        //create scales
        upvoteScale = d3.scaleLinear()
                .range([0, height/2]);

        downvoteScale = d3.scaleLinear()
                .range([0, height/2]);

        svg = d3.select(container).append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            ;

        //append a line representing the axis
        svg
            .append('line')
            .attr('x1', paddingOuter)
            .attr('x2', width-paddingOuter)
            .attr('y1', height/2)
            .attr('y2', height/2)
        ;

        tooltip = d3.select(container).select('.tooltip');

        // Event listeners
        //d3graph.$dispatcher.on('select.votes', (selected) => {
        setTimeout(function() {
            var selected = {id: 'javascript'};
            selectedTag = selected.id;
            update();
        }, 2000);

    }

    function update() {

        var votesData = data.nodesByTagByWeek(2016, selectedTag);
        console.log(votesData);

        //we use the same domain for upvotes and downvotes
        var maxVotes = d3.max(votesData, function(d) { return Math.max(d.upvotes, d.downvotes); });

        //calculate bandwidth - the size of each bar
        var bandwidth = (width - 2 * paddingOuter) / votesData.length - paddingInner;

        //simple hack to make the upvotes' bars have 0 height when all votes are 0
        var initialDomain = (maxVotes == 0) ? -1 : 0;

        upvoteScale.domain([initialDomain, maxVotes]);
        downvoteScale.domain([0, maxVotes]);

        //selection for upvotes
        var bars = svg.selectAll('.upvotes-bar')
                   .data(votesData);

        bars
            .enter().append('rect')
            .attr('class', 'upvotes-bar')
            .attr('x', function(d, i) { return paddingOuter + i * (bandwidth + paddingInner); })
            .attr('width', bandwidth)
            .attr('y', height/2)  // set y here before merge to have a smooth transition for entering bars
            .merge(bars)
            .transition()
            .attr('y', function(d) { return upvoteScale(d.upvotes); })
            .attr('height', function(d) { return height/2 - upvoteScale(d.upvotes); })
            ;

        bars.exit().remove();

        //selection for downvotes
        bars = svg.selectAll('.downvotes-bar')
                   .data(votesData);

        bars
            .enter().append('rect')
            .attr('class', 'downvotes-bar')
            .attr('x', function(d, i) { return paddingOuter + i * (bandwidth + paddingInner); })
            .attr('width', bandwidth)
            .attr('y', height/2)
            .merge(bars)
            .transition()
            .attr('y', function(d) { return height/2; })
            .attr('height', function(d) { return downvoteScale(d.downvotes); })
            ;

        bars.exit().remove();

        d3.selectAll('.votes .upvotes-bar, .votes .downvotes-bar').call(toolTip);

    }

    function toolTip(selection) {

        //variable bars contains all bars - both upvotes and downvotes
        //variable numBars is the number of upvote bars(or downvote bars)
        var bars = selection._groups[0];
        var numBars = bars.length / 2;

        selection.on('mouseenter', function (d, i) {

            if (i >= numBars)
                i -= numBars;

            //upvotes bar
            bars[i].style.fill = 'green';

            //downvotes bar
            bars[i+numBars].style.fill = '#990000';

            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);

            var bandwidth = bars[i].getAttribute('width'),
                x = bars[i].x.baseVal.value + bandwidth / 2,
                y = bars[i].y.baseVal.value - 25;

            tooltip
                .style('left', x + 'px')
                .style('top', y + 'px')
                .html(toolTipHTML(d))
                .style('transform', 'translate(-50%, -50%)')
                ;


        });

        selection.on('mouseout', function (d, i) {

            if (i >= numBars)
                i -= numBars;

            //upvotes bar
            bars[i].style.fill = '#90EE90';

            //downvotes bar
            bars[i+numBars].style.fill = '#ef3d47';

            tooltip.transition()
                .duration(400)
                .style('opacity', 0);

        });

    }

    function toolTipHTML(d) {
        return d.upvotes + ' <span style="font-size: 1.6em">&#x1F44D</span> ' + 
            d.downvotes + ' <span style="font-size: 1.6em">&#x1F44E</span>';
    }


}());
