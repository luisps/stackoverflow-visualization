const d3graph = (function () {

    // Constants
    const NODE_RADIUS_MIN = 16;
    const NODE_RADIUS_MAX = 48;
    const NODE_FILL = (n) => n.$icon ? 'url(#' + n.$icon.id + ')' : selected && n.$tag === selected.$tag ? COLOR_PRIMARY : 'white';
    const NODE_STROKE = (n) => selected && n.$tag === selected.$tag ? COLOR_PRIMARY : null;
    const NODE_STROKE_WIDTH = (n) => selected && n.$tag === selected.$tag ? '2' : null;
    const NODE_TAG = (n) => {
        switch(n.$tag) {
            case 'google-apps-script': return 'google\napps';
            case 'git-commit': return 'git';
            default: return n.$tag.replace(/-/g, '\n');
        }
    };
    const LABEL_VISIBILITY = (n) => (!selected || Object.keys(selected.children).length === 0) && (!hovered || n.$hover)/* || (n.$select || hovered && hovered.$tag === n.$tag)*/ ? 'visible' : 'hidden';
    //const LABEL_SOURCE_VISIBILITY = (l) => !selected && !hovered || hovered && l.source.$tag === hovered.$tag || selected && l.source.$tag === selected.$tag ? 'visible' : 'hidden';
    //const LABEL_TARGET_VISIBILITY = (l) => hovered && l.target.$tag === hovered.$tag || selected && l.target.$tag === selected.$tag ? 'visible' : 'hidden';
    const LINK_STROKE = (l) => selected && (l.source.$tag === selected.$tag || l.target.$tag === selected.$tag) ? COLOR_PRIMARY : '#BBB';
    const LINK_STROKE_WIDTH = (l) => selected && (l.source.$tag === selected.$tag || l.target.$tag === selected.$tag) ? 1 + linksWidthScale(l.value) :
                                     hovered && (l.source.$tag === hovered.$tag || l.target.$tag === hovered.$tag) ? 1 + linksWidthScale(l.value) : 0;

    // Private Variables
    let $dispatcher = d3.dispatch('click', 'tick'),
        $nodes = null,
        $links = null,
        d3graph = null,
        d3graphLabels = null,
        d3graphLinks = null,
        d3graphNodes = null,
        d3simulation = null,
        linksRankScale = null,
        linksValueScale = null,
        linksOpacityScale = null,
        linksWidthScale = null,
        nodesRadiusScale = null,
        selected = null,
        hovered = null
    ;

    return {
        $dispatcher,
        init
    };

    function init() {
        d3graph = d3.select('#graph')
            .attr('transform', 'translate(' + d3zoom.$dimensions().width * 0.25 + ', 0)');

        // Simulation
        d3simulation = d3.forceSimulation()
            .force('center', d3.forceCenter(d3zoom.$dimensions().width / 2, d3zoom.$dimensions().height / 2))
            .force('charge', d3.forceManyBody().strength(-50))
            //.force('link', d3.forceLink().distance((l) => 1 / linksValueScale(l.value) + NODE_RADIUS_MAX * 3).strength((l) => linksValueScale(l.value)))
            .force('link', d3.forceLink()
                .distance((l) => 1 / linksValueScale(l.value) + NODE_RADIUS_MAX * 2)
                .strength((l) => linksValueScale(l.value) / l.rankMin)
                //.strength((l) => 1 / nodesRadiusScale(Math.max(l.source.radius, l.target.radius)))
            )
            .force('collision', d3.forceCollide().radius((n) => nodesRadiusScale(n.$radius) * 1.25))
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
        data.$dispatcher.on('icons.graph', loadIcons);
        data.$dispatcher.on('update.graph', load);
        d3bubble.$dispatcher.on('click.graph', () => onNodeClick(null));
        d3region.$dispatcher.on('click.graph', () => onNodeClick(null));
    }

    function load(data) {
        //console.time('d3graph.load');

        $links = data.linksByYear;
        $nodes = data.nodesByYear.filter((n) => n.$links !== undefined);

        // Update scales
        linksRankScale = d3.scaleLinear()
            .domain([1, 12])
            .range([0.05, 1]);
        linksValueScale = d3.scaleLinear()
            .domain(d3.extent($links, (l) => l.value))
            .range([0.05, 1]);
        linksOpacityScale = d3.scaleLinear()
            .domain(d3.extent($links, (l) => l.value))
            .range([0.2, 1]);
        linksWidthScale = d3.scaleLinear()
            .domain(d3.extent($links, (l) => l.value))
            .range([0, 6]);
        nodesRadiusScale = d3.scaleLog()
            .domain(d3.extent($nodes, (n) => n.$radius))
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
            .attr('fill', NODE_FILL)
            .attr('r', (n) => nodesRadiusScale(n.$radius))
            .on('click', onNodeClick)
            .on('mouseover', onNodeMouseOver)
            .on('mouseout', onNodeMouseOut);
        nodes                           // Items to be updated
            .attr('fill', NODE_FILL)
            .attr('r', (n) => nodesRadiusScale(n.$radius));

        // Update labels
        let labels = d3graphLabels.selectAll('foreignObject').data($nodes.filter((n) => !n.$icon));
        labels.exit().remove();                     // Items to be removed
        labels.enter().append('foreignObject')      // Items to be added
            .attr('height', (n) => nodesRadiusScale(n.$radius) * 2)
            .attr('width', (n) => nodesRadiusScale(n.$radius) * 2)
            .append('xhtml:p')
                .text(NODE_TAG);
        labels
            .attr('height', (n) => nodesRadiusScale(n.$radius) * 2)
            .attr('width', (n) => nodesRadiusScale(n.$radius) * 2)
            .select('p')
                .text(NODE_TAG);

        /*
        let labels = d3graphLabels.selectAll('g').data($links);
        labels.exit().remove();
        labels = labels.enter().append('g');
        labels.append('text')
            .attr('class', 'source')
            .text((l) => l.source.$tag)
            .attr('text-anchor', 'middle');
        labels.append('text')
            .attr('class', 'target')
            .text((l) => l.target.$tag)
            .attr('text-anchor', 'middle')
            .attr('visibility', 'hidden');
        */

        //console.timeEnd('d3graph.load');
    }
    function loadIcons(data) {
        //console.time('d3graph.loadIcons');
        d3.selectAll('#zoom').select('defs')
            .selectAll('pattern')
            .data(Object.values(data.icons))
            .enter().append('pattern')
                .attr('id', (d) => d.id)
                .attr('height', '100%')
                .attr('width', '100%')
                .attr('viewBox', '0 0 256 256')
                .append('image')
                    .attr('height', '256')
                    .attr('width', '256')
                    .attr('xlink:href', (d) => d.url)
        ;
        //console.timeEnd('d3graph.loadIcons');
    }

    function update() {
        if ($links === null || $nodes === null) return;

        ////console.time('d3graph.update');
        $links.forEach((l) => {
            let hover = hovered  && (l.source.$tag === hovered.$tag || l.target.$tag === hovered.$tag);
            l.source.$hover = !hovered ? false : l.source.$hover || hover;
            l.target.$hover = !hovered ? false : l.target.$hover || hover;

            let select = selected  && (l.source.$tag === selected.$tag || l.target.$tag === selected.$tag);
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

        /*
        // Update labels
        d3graphLabels.selectAll('text')
            .attr('visibility', LABEL_VISIBILITY)
        */

        /*
        d3graphLabels.selectAll('g .source')
            .attr('visibility', LABEL_SOURCE_VISIBILITY)
        ;
        d3graphLabels.selectAll('g .target')
            .attr('visibility', LABEL_TARGET_VISIBILITY)
        ;
        */


        ////console.timeEnd('d3graph.update');
    }

    function onNodeClick(n) {
        selected = (n === null || selected && selected.$tag === n.$tag) ? null : n;

        if (selected !== null) {
            // Zoom to node
            let node = this;
            let nodeBB = node.getBBox();
            nodeBB = {
                height: nodeBB.height,
                width: nodeBB.width,
                x: nodeBB.x + nodesRadiusScale(n.$radius),
                y: nodeBB.y + nodesRadiusScale(n.$radius)
            };
            d3zoom.zoomTo(nodeBB, 0.7);
        } else {
            // Reset zoom
            d3zoom.zoomReset();
        }
        // TODO: zoom apenas se tem filhos
        // TODO: click fora tem de permitir selecionar nada

        update();
        $dispatcher.call('click', this, selected);
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

        d3graphLabels.selectAll('foreignObject')
            .attr('x', (n) => n.x - nodesRadiusScale(n.$radius))
            .attr('y', (n) => n.y - nodesRadiusScale(n.$radius))
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
            .attr('cx', (n) => n.x/* = Math.max(nodesRadiusScale(n.$radius), Math.min(d3zoom.$dimensions().width - nodesRadiusScale(n.$radius), n.x))*/)
            .attr('cy', (n) => n.y/* = Math.max(nodesRadiusScale(n.$radius), Math.min(d3zoom.$dimensions().height - nodesRadiusScale(n.$radius), n.y))*/)
        ;

        // Dispatch event
        $dispatcher.call('tick', this);
    }

}());
