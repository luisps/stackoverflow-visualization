const d3bubble = (function () {

    // Constants
    const PADDING = 0;
    const FADE_DURATION= 400;
    const SHOW_DURATION = 400;

    // Private Variables
    let $dispatcher = d3.dispatch('setRecursion', 'click'),
        $node,
        labels,
        tooltips,
        recursion,
        d3bubble
    ;

    return {
        init,
        moveTo,
        $dispatcher
    };

    function init() {
        d3bubble = d3.select('#bubble')
            .attr('transform', 'translate(' + d3zoom.$dimensions().width * 0.25 + ', 0)')
            .append('g');

        // Event listeners
        d3graph.$dispatcher.on('click.bubble', load);
        d3graph.$dispatcher.on('tick.bubble', tick);

        $dispatcher.on('setRecursion', (eventName, flag) => {
            recursion[eventName] = flag;
        });

    }

    function load(selected) {

        let isVisible = selected && Object.keys(selected.$children).length > 1;
        d3bubble.attr('display', isVisible ? 'initial' : 'none');
        if (!isVisible) return;

        //console.time('d3bubble.update');

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
            .attr('class', function(n, i) { return (n.height === 1) ? 'bubble-root' : 'bubble-circle'; })
            .attr('fill', function(n, i) { return (n.height === 1) ? 'white' : d3donut.googleColors(i-1); })
            .merge(circles)
            .attr('cx', (n) => n.x)
            .attr('cy', (n) => n.y)
            .attr('r', (n) => n.r)
        ;

        // Update labels
        let labelsNodes = nodes.slice(1);
        tooltips = d3bubble.selectAll('rect').data(labelsNodes);
        tooltips.exit().remove();
        tooltips.enter()
            .append('rect')
                .attr('fill', 'black')
                .attr('opacity', '0.75')
                .attr('class', 'bubble-tooltip')
            .merge(tooltips)
                .attr('width', (n) => n.$width = n.data.$tag.length * util.getRem() * 0.125 + 2)
                .attr('height', util.getRem() * 0.45)
                .attr('x', (n) => n.x - n.$width / 2)
                .attr('y', (n) => n.y - util.getRem() * 0.35 / 2)
                .attr('opacity', (n) => n.r > 5 ? 1 : 0);

        labels = d3bubble.selectAll('text').data(labelsNodes);
        labels.exit().remove();
        labels.enter()
            .append('text')
                .attr('font-size', 0.25 * util.getRem())
                .attr('text-anchor', 'middle')
                .attr('fill', 'white')
                .attr('class', 'bubble-label')
            .merge(labels)
                .attr('x', (n) => n.x)
                .attr('y', (n) => n.y + util.getRem() * 0.1)
                .attr('opacity', (n) => n.r > 5 ? 1 : 0)
                .text((n) => n.data.$tag);

        /*
        labelsNew.append('rect')
            .attr('width', (n) => n.data.$tag.length * util.getRem() * 0.25)
            .attr('height', util.getRem() * 0.35)
            .attr('x', (n) => n.x)
            .attr('y', (n) => n.y)
            .attr('fill', 'black')
            .attr('opacity', '0.5');
        labelsNew.append('text')
            .attr('class', function(n, i) { return (n.height === 1) ? '' : 'bubble-label'; })
            .attr('font-size', 0.25 * util.getRem())
            .attr('text-anchor', 'middle')
            .merge(labels)
            .text((n) => n.data.$tag)
            .attr('x', (n) => n.x)
            .attr('y', (n) => n.y)
        ;
        */

        /*
        labels = d3bubble.selectAll('text').data(nodes.slice(1));
        labels.exit().remove();
        let labelsNew = labels.enter().append('g')
            labelsNew.append('rect')
                .attr('width', (n) => n.data.$tag.length * util.getRem() * 0.25)
                .attr('height', util.getRem() * 0.35)
                .attr('x', (n) => n.x)
                .attr('y', (n) => n.y)
                .attr('fill', 'black')
                .attr('opacity', '0.5');
            labelsNew.append('text')
                .attr('class', function(n, i) { return (n.height === 1) ? '' : 'bubble-label'; })
                .attr('font-size', 0.25 * util.getRem())
                .attr('text-anchor', 'middle')
            .merge(labels)
            .text((n) => n.data.$tag)
            .attr('x', (n) => n.x)
            .attr('y', (n) => n.y)
        ;
        */

        //handle mouse events
        circles = d3bubble.selectAll('.bubble-circle');
        labels = d3bubble.selectAll('.bubble-label');
        tooltips = d3bubble.selectAll('.bubble-tooltip');
        d3bubble.select('.bubble-root').on('click', () => $dispatcher.call('click', this)); // So we can zoom out again

        recursion = {'mouseenter': false, 'mouseout': false};
        circles.call(mouseEvents);

        // Apply offset to stay on top of the selected node
        _moveTo(nodeBB);

        //console.timeEnd('d3bubble.update');
    }

    function mouseEvents(circles) {

        circles.on('mouseenter', function(n, i) {

            if (recursion.mouseenter) {
                recursion.mouseenter = false;
                d3donut.$dispatcher.call('setRecursion', this,
                    'mouseenter', false);

                return;
            }

            //all circles
            circles
                .interrupt('circle-show')
                .transition('circle-fade')
                .duration(FADE_DURATION)
                .attr('opacity', 0.6)
                ;

            labels
                .interrupt('label-show')
                .transition('label-fade')
                .duration(FADE_DURATION)
                .attr('opacity', 0)
                ;

            tooltips
                .interrupt('label-show')
                .transition('label-fade')
                .duration(FADE_DURATION)
                .attr('opacity', 0)
            ;

            d3.select(this).attr('opacity', 1).interrupt('circle-fade');                    // hovered circle
            d3.select(labels._groups[0][i]).attr('opacity', 1).interrupt('label-fade');     // hovered label
            d3.select(tooltips._groups[0][i]).attr('opacity', 1).interrupt('label-fade');   // hovered tooltip

            // donut chart interaction
            recursion.mouseenter = true;
            d3.select('#donut-sub .slice:nth-of-type('+(i+1)+')').dispatch('mouseenter');


        });

        circles.on('mouseout', function (n, i) {

            if (recursion.mouseout) {
                recursion.mouseout = false;
                d3donut.$dispatcher.call('setRecursion', this,
                    'mouseout', false);

                return;
            }

            //all circles
            circles
                .interrupt('circle-fade')
                .transition('circle-show')
                .duration(SHOW_DURATION)
                .attr('opacity', 1)
                ;

            labels
                .interrupt('label-fade')
                .transition('label-show')
                .duration(SHOW_DURATION)
                .attr('opacity', (n) => n.r > 5 ? 1 : 0)
                ;

            tooltips
                .interrupt('label-fade')
                .transition('label-show')
                .duration(SHOW_DURATION)
                .attr('opacity', (n) => n.r > 5 ? 1 : 0)
            ;

            //donut chart interaction
            recursion.mouseout = true;
            d3.select('#donut-sub .slice:nth-of-type('+(i+1)+')').dispatch('mouseout');

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
