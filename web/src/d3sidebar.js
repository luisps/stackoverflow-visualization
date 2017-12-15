const d3sidebar = (function () {

    // Variables
    let $dispatcher = d3.dispatch('load')
    ;

    return {
        init,
        $dispatcher
    };

    function init() {
        // Event listeners
        d3graph.$dispatcher.on('select.sidebar', load);
    }

    function load(node) {
        let tag = node.$tag,
            year = node.$date.year
        ;

        $dispatcher.call('load', this, {
            nodesByYear: data.nodesByTagByDay(year, tag),
            nodesByWeek: data.nodesByTagByWeek(year,  tag),
            node: node
        });
    }

}());
