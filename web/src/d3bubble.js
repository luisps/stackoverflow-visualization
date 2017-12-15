const d3bubble = (function () {

    // Constants
    const PADDING = 0;

    const LABEL_VISIBILITY = (n) => $hovered && n.data.tag === $hovered.data.tag ? 'visible' : 'hidden';

    // Private Variables
    let //$dispatcher = d3.dispatch('select', 'select.sidebar'),
        $hovered,
        $node,
        d3bubble
    ;

    return {
        init,
        moveTo
    };

    function init() {
        d3bubble = d3.select('#bubble').append('g')
            //.attr('filter', 'url(#dropshadow)')
        ;

        // Event listeners
        d3graph.$dispatcher.on('select.bubble', load);
        d3graph.$dispatcher.on('tick.bubble', tick);
    }

    function load(selected) {
        console.warn('TODO: fix d3bubble');
        return;

        let isVisible = selected && Object.keys(selected.children).length > 0;
        d3bubble.attr('display', isVisible ? 'initial' : 'none');
        if (!isVisible) return;

        console.time('d3bubble.update');

        $node = this;
        let nodeBB = _nodeBB($node);

        let root = d3.hierarchy({ name: selected.tag, children: Object.values(selected.children) })
            .sum((n) => n.radius)
            .sort((a ,b) => b.value - a.value)
        ;

        let pack = d3.pack()
            .padding(1)
            .size([nodeBB.width - PADDING * 2, nodeBB.height - PADDING * 2]);
        let nodes = pack(root).descendants();

        // Update circles
        let circles = d3bubble.selectAll('circle').data(nodes);
        circles.exit().remove();                // Items to be removed
        circles.enter()                         // Items to be added
            .append('circle')
            .attr('fill', (n) => n.height === 1 ? COLOR_PRIMARY : 'white') // Hide the root
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
            .attr('r', (n) => n.r)
            .on('mouseover', onCircleMouseOver)
        ;
        circles                                 // Items to be updated
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
            .attr('r', (n) => n.r)
        ;

        // Update labels
        let labels = d3bubble.selectAll('text').data(nodes);
        labels.exit().remove();
        labels.enter().append('text')
            .text((n) => n.data.tag)
            .attr('font-size', 4)
            .attr('text-anchor', 'middle')
            .attr('x', (n) => n.x)
            .attr('y', (n) => n.y)
            .attr('visibility', LABEL_VISIBILITY)
        ;
        labels
            .text((n) => n.data.tag)
            .attr('x', (n) => n.x)
            .attr('y', (n) => n.y)
            .attr('visibility', LABEL_VISIBILITY);


        // Apply offset to stay on top of the selected node
        _moveTo(nodeBB);
        console.timeEnd('d3bubble.update');
    }

    function update() {
        // Update labels
        d3bubble.selectAll('text')
            .attr('visibility', LABEL_VISIBILITY)
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

    function onCircleMouseOver(n) {
        $hovered = n;
        update();
    }
    function tick(e) {
        if ($node)
            _moveTo(_nodeBB($node));
    }

})();