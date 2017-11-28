const d3graph = (function () {

    // Constants
    const NODE_RADIUS_MIN = 8;
    const NODE_RADIUS_MAX = 32;
    const NODE_FILL = (n) => selected && n.tag === selected.tag ? '#F48024' : 'white';
    const NODE_STROKE = (n) => selected && n.tag === selected.tag ? '#F48024' : null;
    const NODE_STROKE_WIDTH = (n) => selected && n.tag === selected.tag ? '2' : null;

    const LINK_STROKE = (l) => selected && (l.source.tag === selected.tag || l.target.tag === selected.tag) ? '#F48024' : '#BBB';
    const LINK_STROKE_WIDTH = (l) => selected && (l.source.tag === selected.tag || l.target.tag === selected.tag) ? 2 :
                                     hovered && (l.source.tag === hovered.tag || l.target.tag === hovered.tag) ? 1 : 0;

    // Private Variables
    let $dispatcher = d3.dispatch('select'),
        d3graph = null,
        d3graphLabels = null,
        d3graphLinks = null,
        d3graphNodes = null,
        d3simulation = null,
        linksValueScale = null,
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
            .force('link', d3.forceLink().distance((l) => 1 / linksValueScale(l.value) + NODE_RADIUS_MAX * 3).strength((l) => linksValueScale(l.value)))
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

        let dataLinks = data.delta.links;
        let dataNodes = Object.values(data.delta.nodes).filter((n) => n.linkCount > 0);

        // Update scales
        linksValueScale = d3.scaleLinear()
            .domain(d3.extent(dataLinks, (l) => l.value))
            .range([0.1, 1]);
        nodesRadiusScale = d3.scaleLog()
            .domain(d3.extent(dataNodes, (n) => n.radius))
            .range([NODE_RADIUS_MIN, NODE_RADIUS_MAX]);

        d3simulation.force("link").links(dataLinks);
        d3simulation.nodes(dataNodes);
        d3simulation.alpha(1).restart();

        /*
        // Manually run the simulation (https://bl.ocks.org/mbostock/1667139)
        for (let i = 0, n = Math.ceil(Math.log(d3simulation.alphaMin()) / Math.log(1 - d3simulation.alphaDecay())); i < n; ++i)
            d3simulation.tick();
        */

        // Update links
        let links = d3graphLinks.selectAll('line').data(dataLinks);
        links.exit().remove();      // Items to be removed
        links.enter()               // Items to be added
            .append('line');

        // Update nodes
        let nodes = d3graphNodes.selectAll('circle').data(dataNodes);
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
        let labels = d3graphLabels.selectAll('text').data(dataNodes.filter((n) => Object.keys(n.children).length === 0));
        labels.exit().remove();         // Items to be removed
        labels.enter().append('text')   // Items to be added
            .text((d) => d.tag)
            .attr('text-anchor', 'middle');

        console.timeEnd('d3graph.load');
    }

    function update() {
        //console.time('d3graph.update');

        // Update links
        d3graphLinks.selectAll('line')
            .attr('stroke', LINK_STROKE)
            .attr('stroke-width', LINK_STROKE_WIDTH)
        ;

        // Update nodes
        d3graphNodes.selectAll('circle')
            .attr('fill', NODE_FILL)
            .attr('stroke', NODE_STROKE)
            .attr('stroke-width', NODE_STROKE_WIDTH)
        ;


        //console.timeEnd('d3graph.update');
    }

    function onNodeClick(n) {
        selected = n;

        // Select newly selected
        let node = this;
        node.classList.add('selected');

        // Zoom to node
        let nodeBB = node.getBBox();
            nodeBB = {
                height: nodeBB.height,
                width: nodeBB.width,
                x: nodeBB.x + nodesRadiusScale(n.radius),
                y: nodeBB.y + nodesRadiusScale(n.radius)
            };
        d3zoom.zoomTo(nodeBB, 0.7);

        // TODO: zoom apenas se tem filhos
        // TODO: click fora tem de permitir selecionar nada
        // TODO: click no proprio seleciona anda

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
        d3graphNodes.selectAll('circle')
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
        ;
    }

}());
