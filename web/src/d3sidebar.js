const d3sidebar = (function () {

    // Variables
    let $dispatcher = d3.dispatch('load'),
        d3sidebar,
        nodesByDay = null,
        nodesByWeek = null,
        nodesByYear = null
    ;

    return {
        init,
        $dispatcher
    };

    function init() {
        d3sidebar = d3.select('#sidebar');

        d3sidebar.select('#communities')
            .style('display', 'none')
            .style('visibility', 'visible');

        // Event listeners
        data.$dispatcher.on('update.sidebar', load);
        d3graph.$dispatcher.on('click.sidebar', update);

    }

    function load(data) {
        nodesByDay = data.nodesByDay;
        nodesByWeek = data.nodesByWeek;
        nodesByYear = data.nodesByYear;

        update(null);
    }

    function update(node) {
        console.time('d3sidebar.update');

        if (node === null) { // Global
            d3sidebar.select('#communities').style('display', 'none');
            d3sidebar.select('#scatter-container').style('display', 'flex');

            d3sidebar.select('.icon').style('background-image', "");
            d3sidebar.select('.tag').text('es.stackoverflow.com');

            $dispatcher.call('load', this, {
                nodesByDay,
                nodesByWeek,
                nodesByYear,
                node: null,
                weeks: util.getWeeksByYear(nodesByDay[0].$date.getFullYear())
            });
        } else { // Tag
            d3sidebar.select('#communities').style('display', 'flex');
            d3sidebar.select('#scatter-container').style('display', 'none');

            d3sidebar.select('.icon').style('background-image', node.$icon ? "url('" + node.$icon.url + "')" : "");
            d3sidebar.select('.tag').text(node.$tag);

            $dispatcher.call('load', this, {
                nodesByDay: data.nodesByTagByDay(node.$date.getFullYear(), node.$tag),
                nodesByWeek: data.nodesByTagByWeek(node.$date.getFullYear(), node.$tag),
                node: node,
                weeks: util.getWeeksByYear(node.$date.getFullYear())
            });
        }

        console.timeEnd('d3sidebar.update');
    }

}());
