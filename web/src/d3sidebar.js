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
        
        //global view
        if (node == null) {

            d3.select('#sidebar .tag').html('Global');

        }
        else { //tag view

            let tag = node.$tag,
                year = node.$date.year
                ;

            d3.select('#sidebar .tag').html(tag);
            console.log(data.nodesByTagByDay(year, tag));
            console.log(node);

            $dispatcher.call('load', this, {
                nodesByYear: data.nodesByTagByDay(year, tag),
                nodesByWeek: data.nodesByTagByWeek(year,  tag),
                node: node
            });

        }

    }

}());
