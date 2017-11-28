const d3bubble = (function () {

    // Constants
    const PADDING = 2;

    // Private Variables
    let //$dispatcher = d3.dispatch('select', 'select.sidebar'),
        d3bubble = null,
        d3translate
    ;

    return {
        $d3select: () => d3bubble,
        init,
        moveTo
    };

    function init() {
        d3bubble = d3.select('#bubble')
            //.attr('filter', 'url(#dropshadow)')
        ;
        d3translate = d3bubble.append('g');

        // Event listeners
        d3graph.$dispatcher.on('select.bubble', update);
    }

    function update(selected) {
        let children = Object.values(selected.children);

        // In case there is no children, no need to show the bubble chart
        d3translate.attr('display', children.length > 0 ? 'initial' : 'none');
        if (children.length === 0) return;

        console.time('d3bubble.update');

        let node = this;
        let nodeBB = {
            height: +node.getAttribute('r') * 2,
            width: +node.getAttribute('r') * 2,
            x: +node.getAttribute('cx'),
            y: +node.getAttribute('cy')
        };

        let root = d3.hierarchy({ name: selected.tag, children: children })
            .sum((n) => n.radius)
            .sort((a ,b) => b.value - a.value)
        ;

        let pack = d3.pack()
            .padding(1)
            .size([nodeBB.width - PADDING * 2, nodeBB.height - PADDING * 2]);
        let nodes = pack(root).descendants();

        // Update circles
        let circles = d3translate.selectAll('circle').data(nodes);
        circles.exit().remove();                // Items to be removed
        circles.enter()                         // Items to be added
            .append('circle')
            .attr('fill', (n) => n.height === 1 ? 'none' : 'white') // Hide the root
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
            .attr('r', (n) => n.r)
        ;
        circles                                 // Items to be updated
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
            .attr('r', (n) => n.r)
        ;

        // Apply offset to stay on top of the selected node
        moveTo(nodeBB);
        console.timeEnd('d3bubble.update');
    }

    function moveTo(targetBB) {
        d3translate.attr('transform', 'translate(' + (targetBB.x + PADDING - targetBB.width / 2) + ',' + (targetBB.y + PADDING - targetBB.height / 2) + ')');
    }

})();