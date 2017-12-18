const d3bubble = (function () {

    // Constants
    const PADDING = 0;

    // Private Variables
    let $node,
        d3bubble
    ;

    return {
        init,
        moveTo
    };

    function init() {
        d3bubble = d3.select('#bubble')
            .append('g');

        // Event listeners
        d3graph.$dispatcher.on('click.bubble', load);
        d3graph.$dispatcher.on('tick.bubble', tick);
    }

    function load(selected) {

        let isVisible = selected && Object.keys(selected.$children).length > 0;
        d3bubble.attr('display', isVisible ? 'initial' : 'none');
        if (!isVisible) return;

        console.time('d3bubble.update');

        $node = this;
        let nodeBB = _nodeBB($node);

        let root = d3.hierarchy({ name: selected.$tag, children: Object.values(selected.$children) })
            .sum((n) => n.$radius)
            .sort((a ,b) => b.value - a.value)
        ;

        let pack = d3.pack()
            .padding(1)
            .size([nodeBB.width - PADDING * 2, nodeBB.height - PADDING * 2]);
        let nodes = pack(root).descendants();

        // Update circles
        let circles = d3bubble.selectAll('circle').data(nodes);
        circles.exit().remove();
        circles.enter()
            .append('circle')
            .attr('class', function(n, i) { return (n.height === 1) ? '' : 'bubble-circle'; })
            .attr('fill', function(n, i) { return (n.height === 1) ? 'white' : d3donut.googleColors(i-1); })
            .merge(circles)
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
            .attr('r', (n) => n.r)
        ;

        // Update labels
        let labels = d3bubble.selectAll('text').data(nodes);
        labels.exit().remove();
        labels.enter().append('text')
            .attr('class', function(n, i) { return (n.height === 1) ? '' : 'bubble-label'; })
            .attr('font-size', 4)
            .attr('text-anchor', 'middle')
            .merge(labels)
            .text((n) => n.data.$tag)
            .attr('x', (n) => n.x)
            .attr('y', (n) => n.y)
        ;

        d3bubble.selectAll('.bubble-circle').call(mouseEvents);

        // Apply offset to stay on top of the selected node
        _moveTo(nodeBB);
        console.timeEnd('d3bubble.update');
    }

    function mouseEvents(circles) {

        var labels = d3bubble.selectAll('.bubble-label');
        var fadeDuration = 400;
        var showDuration = 400;

        circles.on('mouseover', function(n, i) {

            //all circles
            circles
                .interrupt('circle-show')
                .transition('circle-fade')
                .duration(fadeDuration)
                .attr('opacity', 0.6)
                ;

            labels
                .interrupt('label-show')
                .transition('label-fade')
                .duration(fadeDuration)
                .attr('opacity', 0)
                ;

            //hovered circle
            d3.select(this)
                .attr('opacity', 1)
                .interrupt('circle-fade')
                ;

            var hoveredLabel = labels._groups[0][i];
            d3.select(hoveredLabel)
                .attr('opacity', 1)
                .interrupt('label-fade')
                ;

        });

        circles.on('mouseout', function () {

            //all circles
            circles
                .interrupt('circle-fade')
                .transition('circle-show')
                .duration(showDuration)
                .attr('opacity', 1)
                ;

            labels
                .interrupt('label-fade')
                .transition('label-show')
                .duration(showDuration)
                .attr('opacity', 1)
                ;

        });
        
    }

    function _moveTo(targetBB) {
        d3bubble.attr('transform', 'translate(' + (targetBB.x + PADDING - targetBB.width / 2) + ',' + (targetBB.y + PADDING - targetBB.height / 2) + ')');
    }
    function _nodeBB(node) {
        return {
            height: +node.getAttribute('r') * 2,
            width: +node.getAttribute('r') * 2,
            x: +node.getAttribute('cx'),
            y: +node.getAttribute('cy')
        };
    }

    function tick(e) {
        if ($node)
            _moveTo(_nodeBB($node));
    }

})();
