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
        nodesByDay = data.nodesByDay;
        nodesByWeek = data.nodesByWeek;

        update(null);
    }

    function update(node) {
        if (node === null) { // Global
            d3sidebar.select('#scatter').style('display', 'initial');
            d3sidebar.select('#sub-communities').style('display', 'none');
            d3sidebar.select('#related-communities').style('display', 'none');
            // TODO: enable scatter, disable pie charts

            d3sidebar.select('.icon').style('background-image', "");
            d3sidebar.select('.tag').text('es.stackoverflow.com');

            $dispatcher.call('load', this, {
                nodesByDay,
                nodesByWeek,
                node: null
            });
        } else { // Tag
            d3sidebar.select('#scatter').style('display', 'none');
            d3sidebar.select('#sub-communities').style('display', 'initial');
            d3sidebar.select('#related-communities').style('display', 'initial');
            // TODO: disable scatter, enable pie charts

            d3sidebar.select('.icon').style('background-image', node.$icon ? "url('" + node.$icon.url + "')" : "");
            d3sidebar.select('.tag').text(node.$tag);

            $dispatcher.call('load', this, {
                nodesByDay: data.nodesByTagByDay(node.$date.getFullYear(), node.$tag),
                nodesByWeek: data.nodesByTagByWeek(node.$date.getFullYear(), node.$tag),
                node: node
            });
        }
    }

}());
