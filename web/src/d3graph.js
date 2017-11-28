const d3graph = (function () {

    // Constants
    const NODE_RADIUS_MIN = 8;
    const NODE_RADIUS_MAX = 32;
    const NODE_FILL = (n) => selected && n.tag === selected.tag ? '#F48024' : 'white';
    const NODE_STROKE = (n) => selected && n.tag === selected.tag ? '#F48024' : null;
    const NODE_STROKE_WIDTH = (n) => selected && n.tag === selected.tag ? '2' : null;
    const LABEL_VISIBILITY = (n) => (!selected || Object.keys(selected.children).length === 0) && (!hovered || n.$hover)/* || (n.$select || hovered && hovered.tag === n.tag)*/ ? 'visible' : 'hidden';
    //const LABEL_SOURCE_VISIBILITY = (l) => !selected && !hovered || hovered && l.source.tag === hovered.tag || selected && l.source.tag === selected.tag ? 'visible' : 'hidden';
    //const LABEL_TARGET_VISIBILITY = (l) => hovered && l.target.tag === hovered.tag || selected && l.target.tag === selected.tag ? 'visible' : 'hidden';
    const LINK_STROKE = (l) => selected && (l.source.tag === selected.tag || l.target.tag === selected.tag) ? '#F48024' : '#BBB';
    const LINK_STROKE_WIDTH = (l) => selected && (l.source.tag === selected.tag || l.target.tag === selected.tag) ? 1 + linksWidthScale(l.value) :
                                     hovered && (l.source.tag === hovered.tag || l.target.tag === hovered.tag) ? 1 + linksWidthScale(l.value) : 0;

    // Private Variables
    let $dispatcher = d3.dispatch('select'),
        $nodes = null,
        $links = null,
        d3graph = null,
        d3graphLabels = null,
        d3graphLinks = null,
        d3graphNodes = null,
        d3simulation = null,
        linksValueScale = null,
        linksOpacityScale = null,
        linksWidthScale = null,
        nodesRadiusScale = null,
        selected = null,
        hovered = null
    ;

    return {
        $d3select: () => d3graph,
        $dispatcher,
        init
    };

    function init() {
        d3graph = d3.select('#graph');

        // Simulation
        d3simulation = d3.forceSimulation()
            .force('center', d3.forceCenter(d3zoom.$dimensions().width / 2, d3zoom.$dimensions().height / 2))
            .force('charge', d3.forceManyBody().strength(-300))
            //.force('link', d3.forceLink().distance((l) => 1 / linksValueScale(l.value) + NODE_RADIUS_MAX * 3).strength((l) => linksValueScale(l.value)))
            .force('link', d3.forceLink()
                .distance((l) => Math.min(l.source.linkCount, l.target.linkCount) + Math.max(nodesRadiusScale(l.source.radius), nodesRadiusScale(l.target.radius)) * 2)
                .strength((l) => linksValueScale(l.value))
                //.strength((l) => 1 / nodesRadiusScale(Math.max(l.source.radius, l.target.radius)))
            )
            .force('collision', d3.forceCollide().radius((n) => nodesRadiusScale(n.radius) * 1.25))
            .on('tick', onTick)
            //.stop()
        ;

        // Links
        d3graphLinks = d3graph.append('g')
            .attr('class', 'links')
        ;

        // Nodes
        d3graphNodes = d3graph.append('g')
            .attr('class', 'nodes')
            .attr('filter', 'url(#dropshadow)')
        ;

        // Labels
        d3graphLabels = d3graph.append('g')
            .attr('class', 'labels')
        ;

        // Event listeners
        d3time.$dispatcher.on('update.graph', load);
    }

    function load(data) {
        console.time('d3graph.load');

        $links = data.delta.links;
        $nodes = Object.values(data.delta.nodes).filter((n) => n.linkCount > 0);

        // Update scales
        linksValueScale = d3.scaleLinear()
            .domain(d3.extent($links, (l) => l.value))
            .range([0.1, 1]);
        linksOpacityScale = d3.scaleLinear()
            .domain(d3.extent($links, (l) => l.value))
            .range([0.15, 1]);
        linksWidthScale = d3.scaleLinear()
            .domain(d3.extent($links, (l) => l.value))
            .range([0, 2]);
        nodesRadiusScale = d3.scaleLog()
            .domain(d3.extent($nodes, (n) => n.radius))
            .range([NODE_RADIUS_MIN, NODE_RADIUS_MAX]);

        d3simulation.force("link").links($links);
        d3simulation.nodes($nodes);
        d3simulation.alpha(1).restart();

        /*
        // Manually run the simulation (https://bl.ocks.org/mbostock/1667139)
        for (let i = 0, n = Math.ceil(Math.log(d3simulation.alphaMin()) / Math.log(1 - d3simulation.alphaDecay())); i < n; ++i)
            d3simulation.tick();
        */

        // Update links
        let links = d3graphLinks.selectAll('line').data($links);
        links.exit().remove();      // Items to be removed
        links.enter()               // Items to be added
            .append('line');

        // Update nodes
        let nodes = d3graphNodes.selectAll('circle').data($nodes);
        nodes.exit().remove();          // Items to be removed
        nodes.enter().append('circle')  // Items to be added
            .attr('fill', 'white')
            .attr('r', (n) => nodesRadiusScale(n.radius))
            .on('click', onNodeClick)
            .on('mouseover', onNodeMouseOver)
            .on('mouseout', onNodeMouseOut);
        nodes                           // Items to be updated
            .attr('r', (n) => nodesRadiusScale(n.radius));

        // Update labels
        let labels = d3graphLabels.selectAll('text').data($nodes);
        labels.exit().remove();         // Items to be removed
        labels.enter().append('text')   // Items to be added
            .text((n) => n.tag)
            .attr('text-anchor', 'middle');

        /*
        let labels = d3graphLabels.selectAll('g').data($links);
        labels.exit().remove();
        labels = labels.enter().append('g');
        labels.append('text')
            .attr('class', 'source')
            .text((l) => l.source.tag)
            .attr('text-anchor', 'middle');
        labels.append('text')
            .attr('class', 'target')
            .text((l) => l.target.tag)
            .attr('text-anchor', 'middle')
            .attr('visibility', 'hidden');
        */

        console.timeEnd('d3graph.load');
    }

    function update() {
        //console.time('d3graph.update');
        $links.forEach((l) => {
            let hover = hovered  && (l.source.tag === hovered.tag || l.target.tag === hovered.tag);
            l.source.$hover = !hovered ? false : l.source.$hover || hover;
            l.target.$hover = !hovered ? false : l.target.$hover || hover;

            let select = selected  && (l.source.tag === selected.tag || l.target.tag === selected.tag);
            l.source.$select = !selected ? false : l.source.$select || select;
            l.target.$select = !selected ? false : l.target.$select || select;
        });

        // Update links
        d3graphLinks.selectAll('line')
            .attr('stroke', LINK_STROKE)
            .attr('stroke-width', LINK_STROKE_WIDTH)
            .attr('stroke-opacity', (l) => linksOpacityScale(l.value) * 2)
        ;

        // Update nodes
        d3graphNodes.selectAll('circle')
            .attr('fill', NODE_FILL)
            .attr('stroke', NODE_STROKE)
            .attr('stroke-width', NODE_STROKE_WIDTH)
        ;

        // Update labels
        d3graphLabels.selectAll('text')
            .attr('visibility', LABEL_VISIBILITY)

        /*
        d3graphLabels.selectAll('g .source')
            .attr('visibility', LABEL_SOURCE_VISIBILITY)
        ;
        d3graphLabels.selectAll('g .target')
            .attr('visibility', LABEL_TARGET_VISIBILITY)
        ;
        */


        //console.timeEnd('d3graph.update');
    }

    function onNodeClick(n) {
        selected = selected && selected.tag === n.tag ? null : n;

        if (selected !== null) {
            // Zoom to node
            let node = this;
            let nodeBB = node.getBBox();
            nodeBB = {
                height: nodeBB.height,
                width: nodeBB.width,
                x: nodeBB.x + nodesRadiusScale(n.radius),
                y: nodeBB.y + nodesRadiusScale(n.radius)
            };
            d3zoom.zoomTo(nodeBB, 0.7);
        } else {
            // Reset zoom
            d3zoom.zoomReset();
        }
        // TODO: zoom apenas se tem filhos
        // TODO: click fora tem de permitir selecionar nada

        update();
        $dispatcher.call('select', this, selected);
    }

    function onNodeMouseOver(n) {
        hovered = n;
        update();
    }
    function onNodeMouseOut(n) {
        hovered = null;
        update();
    }

    function onTick() {
        if (d3graphNodes === null || d3graphLinks === null) return;

        d3graphLinks.selectAll('line')
            .attr("x1", (l) => l.source.x)
            .attr("y1", (l) => l.source.y)
            .attr("x2", (l) => l.target.x)
            .attr("y2", (l) => l.target.y);

        d3graphLabels.selectAll('text')
            .attr('x', (n) => n.x)
            .attr('y', (n) => n.y - nodesRadiusScale(n.radius) - 4)
        ;
        /*
        d3graphLabels.selectAll('g .source')
            .attr('x', (l) => l.source.x)
            .attr('y', (l) => l.source.y - nodesRadiusScale(l.source.radius) - 4);
        d3graphLabels.selectAll('g .target')
            .attr('x', (l) => l.target.x)
            .attr('y', (l) => l.target.y - nodesRadiusScale(l.target.radius) - 4)
        */

        d3graphNodes.selectAll('circle')
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
        ;
    }

}());
