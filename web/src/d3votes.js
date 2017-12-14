const d3votes = (function () {

    const NUM_WEEKS_YEAR = 52;
    const paddingOuter = 4;
    const paddingInner = 1;

    // Variables
    let selectedTag = null,
    width = null,
    height = null,
    svg = null,
    tooltip = null
    ;

    return {
        init
    };

    function init() {

        container = document.getElementsByClassName('votes')[0];
        width = container.offsetWidth;
        height = container.offsetHeight;

        svg = d3.select('.votes').append('svg')
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

        tooltip = d3.select('.votes').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            ;

        // Event listeners
        d3graph.$dispatcher.on('select.votes', (selected) => {
            selectedTag = selected.id;
            update();
        });

    }

    function update() {

        votesData = []

        //temporary stuff
        var dataNodes = data.nodes;
        year = 2016;
        for (var month in dataNodes[year]) {
            for (var day in dataNodes[year][month]) {
                var activity = dataNodes[year][month][day][selectedTag];

                votesData.push({
                    date: new Date(year, month, day),
                    upvotes: activity.upvotes,
                    downvotes: activity.downvotes
                });

            }
        }

        //var NUM_BARS = 365;

        //temporary - still need to aggregate time in weeks
        //for now take just 52 days
        votesData = votesData.slice(0, 52);

        var maxVotes = Math.max.apply(Math, votesData.map(function(d){return (d.upvotes > d.downvotes) ? d.upvotes: d.downvotes; }));

        var bandwidth = (width - 2 * paddingOuter) / votesData.length - paddingInner;

        //simple hack to make the upvotes' bars have 0 height when all votes are 0
        var initialDomain = (maxVotes == 0) ? -1 : 0;

        var upvoteScale = d3.scaleLinear()
                .domain([initialDomain, maxVotes])
                .range([0, height/2]);

        var downvoteScale = d3.scaleLinear()
                .domain([0, maxVotes])
                .range([0, height/2]);

        console.log(height/2);
        console.log(maxVotes);
        console.log(upvoteScale);

        //selection for upvotes
        var bars = svg.selectAll('.upvotes-bar')
                   .data(votesData);

        bars
            .enter().append('rect')
            .attr('class', 'upvotes-bar')
            .attr('x', function(d, i) { return paddingOuter + i * (bandwidth + paddingInner); })
            .attr('width', bandwidth)
            .attr('y', height/2)  // set y here to have a smooth transition for entering bars
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

        //bars contains all bars - both upvotes and downvotes
        //numBars is the number of upvote bars(or downvote bars)
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

            var x = bars[i].x.baseVal.value,
                y = bars[i].y.baseVal.value;

            tooltip.html(toolTipHTML(d))
                .style('left', x + 'px')
                .style('top', y - 15 + 'px')
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
                .duration(500)
                .style('opacity', 0);

        });

    }

    function toolTipHTML(d) {
        return d.upvotes + ' <font size="4em">&#x1F44D</font> ' + 
            d.downvotes + ' <font size="4em">&#x1F44E</font>';
    }


}());
