const d3graph = (function () {

    // Variables
    let $dispatcher = d3.dispatch('select'),
        d3graph,
        d3graphLabels,
        d3graphLinks,
        d3graphNodes,
        d3simulation,
        linksValueScale,
        nodesRadiusScale,
        selected = null
    ;

    return {
        $dispatcher,
        init
    };

    function init() {
        d3graph = d3.select('#graph');

        let dimensions = window.getComputedStyle(d3graph.node());
        dimensions = { height: parseInt(dimensions.height), width: parseInt(dimensions.width) };

        // Simulation
        d3simulation = d3.forceSimulation()
            .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('link', d3.forceLink().id((n) => n.id).distance((l) => 1 / linksValueScale(l.value) + 64).strength((l) => linksValueScale(l.value)))
            .force('collision', d3.forceCollide().radius((n) => nodesRadiusScale(n.radius) + 4))
            .on('tick', onTick)
        ;

        // Links
        d3graphLinks = d3graph.append('g')
            .attr('class', 'edges')
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
        data.$dispatcher.on('update-graph', update);
    }

    function update(dataLinks, dataNodes) {
        // TODO: use the year and month selected from the timeline. Centralize this on the data module
        //let dataLinks = data.links;
        //let dataNodes = data.nodes;
        //console.log(data.links);
        //console.log(data.nodes);

        /*
        if (selected !== null) {
            Object.values(selected.children).forEach((n) => {
                n.dataNodesIndex = dataNodes.length;
                dataNodes.push(n);
            });
        }
        */

        // Update scales
        linksValueScale = d3.scaleLinear()
            .domain(d3.extent(dataLinks, (l) => l.value))
            .range([0.1, 1]);
        nodesRadiusScale = d3.scaleLog()
            .domain(d3.extent(dataNodes, (n) => n.radius))
            .range([4, 24]);

        // Update links
        let links = d3graphLinks.selectAll('line').data(dataLinks);
        links.exit() // Items to be removed
            .remove();
        links.enter() // Items to be added
            .append('line');

        // Update nodes
        let nodes = d3graphNodes.selectAll('g').data(dataNodes);
        nodes.exit().remove();              // Items to be removed
        nodes = nodes.enter()               // Items to be added
            .append('g')
            .on('click', onNodeClick);
        nodes.append('circle')
            .attr('r', (n) => nodesRadiusScale(n.radius))
            .attr('fill', 'white')
        ;

        let labels = d3graphLabels.selectAll('text').data(dataNodes);
        labels.exit().remove();     // Items to be removed
        labels = labels.enter();    // Items to be added
        labels.append('text')
            .text((d) => d.tag)
            .attr('text-anchor', 'middle')
        ;

        // Update simulation
        d3simulation.force("link").links(dataLinks);
        d3simulation.nodes(dataNodes);
    }

    function onNodeClick(n) {
        if (Object.keys(n.children).length === 0) return;

        // TODO: deselect previously selected
        if (selected !== null) {

        }

        // Select newly selected
        selected = n;
        d3.select(this).node().classList.add('selected');

        update();
        $dispatcher.call('select', this, selected);
    }

    function onTick() {
        if (d3graphNodes === null || d3graphLinks === null) return;
        /*
        d3graphLinks
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        */

        d3graphLabels.selectAll('text')
            .attr('transform', (n) => 'translate(' + n.x + ',' + (n.y - nodesRadiusScale(n.radius) - 4) + ')');
        d3graphNodes.selectAll('g')
            .attr('transform', (n) => 'translate(' + n.x + ',' + n.y + ')');
        /*
        d3graphNodes.selectAll('text')
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
            */
    }

}());
