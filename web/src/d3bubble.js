const d3bubble = (function () {

    // Constants
    const PADDING = 2;

    const LABEL_VISIBILITY = (n) => $hovered && n.data.tag === $hovered.data.tag ? 'visible' : 'hidden';

    // Private Variables
    let //$dispatcher = d3.dispatch('select', 'select.sidebar'),
        $hovered,
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
        d3graph.$dispatcher.on('select.bubble', load);
    }

    function load(selected) {
        let isVisible = selected && Object.keys(selected.children).length > 0;
        d3translate.attr('display', isVisible ? 'initial' : 'none');
        if (!isVisible) return;

        console.time('d3bubble.update');

        let node = this;
        let nodeBB = {
            height: +node.getAttribute('r') * 2,
            width: +node.getAttribute('r') * 2,
            x: +node.getAttribute('cx'),
            y: +node.getAttribute('cy')
        };

        let root = d3.hierarchy({ name: selected.tag, children: Object.values(selected.children) })
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
            .on('mouseover', onCircleMouseOver)
        ;
        circles                                 // Items to be updated
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
            .attr('r', (n) => n.r)
        ;

        // Update labels
        let labels = d3translate.selectAll('text').data(nodes);
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
        moveTo(nodeBB);
        console.timeEnd('d3bubble.update');
    }

    function update() {
        // Update labels
        d3translate.selectAll('text')
            .attr('visibility', LABEL_VISIBILITY)
    }

    function moveTo(targetBB) {
        d3translate.attr('transform', 'translate(' + (targetBB.x + PADDING - targetBB.width / 2) + ',' + (targetBB.y + PADDING - targetBB.height / 2) + ')');
    }

    function onCircleMouseOver(n) {
        $hovered = n;
        update();
    }

})();