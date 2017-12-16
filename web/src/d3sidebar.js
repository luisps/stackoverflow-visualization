const d3sidebar = (function () {

    // Variables
    let $dispatcher = d3.dispatch('load'),
        d3sidebar,
        nodesByWeek = null,
        nodesByDay = null
    ;

    return {
        init,
        $dispatcher
    };

    function init() {
        d3sidebar = d3.select('#sidebar');

        // Event listeners
        data.$dispatcher.on('update.sidebar', load);
        d3graph.$dispatcher.on('click.sidebar', update);
    }

    function load(data) {
        d3sidebar.select('.tag').text('es.stackoverflow.com');

        nodesByDay = data.nodesByDay;
        nodesByWeek = data.nodesByWeek;
    }

    function update(node) {
        if (node === null) { // Global
            // TODO: enable scatter, disable pie charts

            $dispatcher.call('load', this, {
                nodesByDay,
                nodesByWeek,
                node: null
            });
        } else { // Tag
            // TODO:

            d3sidebar.select('.icon').style('background-image', "url('" + node.$icon.url + "')");
            d3sidebar.select('.tag').text(node.$tag);

            $dispatcher.call('load', this, {
                nodesByDay: data.nodesByTagByDay(node.$date.year, node.$tag),
                nodesByWeek: data.nodesByTagByWeek(node.$date.year, node.$tag),
                node: node
            });
        }
    }

}());
