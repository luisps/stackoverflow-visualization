const d3sidebar = (function () {

    // Variables
    let $dispatcher = d3.dispatch('load'),
        d3sidebar,
        $nodesByDay = null,
        $nodesByWeek = null,
        $nodesByYear = null,
        $region = null,
        $regionIcon = null
    ;

    return {
        init,
        $dispatcher
    };

    function init() {
        d3sidebar = d3.select('#sidebar');

        // Initialize communities/scatter
        d3sidebar.select('#communities').style('display', 'none');
        d3sidebar.select('#scatter').style('display', 'flex');

        // Event listeners
        data.$dispatcher.on('update.sidebar', load);
        d3graph.$dispatcher.on('click.sidebar', update);
        d3region.$dispatcher.on('click.sidebar', onRegion)

    }

    function load(data) {
        $nodesByDay = data.nodesByDay;
        $nodesByWeek = data.nodesByWeek;
        $nodesByYear = data.nodesByYear;

        update(null);
    }

    function update(node) {
        //console.time('d3sidebar.update');

        if (node === null) { // Region
            // Hide donuts, show scatter
            d3sidebar.select('#communities').style('display', 'none');
            d3sidebar.select('#overview').style('display', 'flex');

            // Update titles
            d3sidebar.select('.title-activity').text('Region Activity');
            d3sidebar.select('.title-health').text('Region Health');

            // Update icon and tag
            d3sidebar.select('.icon').style('background-image', "url('" + $regionIcon + "')");
            d3sidebar.select('.tag').text($region);

            if ($nodesByDay)
                $dispatcher.call('load', this, {
                    nodesByDay: $nodesByDay,
                    nodesByWeek: $nodesByWeek,
                    nodesByYear: $nodesByYear,
                    node: null,
                    weeks: util.getWeeksByYear($nodesByDay[0].$date.getFullYear())
                });
        } else { // Tag
            // Show donuts, hide scatter
            d3sidebar.select('#communities').style('display', 'flex');
            d3sidebar.select('#overview').style('display', 'none');

            // Update titles
            d3sidebar.select('.title-activity').text('Community Activity');
            d3sidebar.select('.title-health').text('Community Health');

            // Update icon and tag
            d3sidebar.select('.icon').style('background-image', node.$icon ? "url('" + node.$icon.url + "')" : "");
            d3sidebar.select('.tag').text(node.$tag);

            if ($nodesByDay)
                $dispatcher.call('load', this, {
                    nodesByDay: data.nodesByTagByDay(node.$date.getFullYear(), node.$tag),
                    nodesByWeek: data.nodesByTagByWeek(node.$date.getFullYear(), node.$tag),
                    nodesByYear: null,
                    node: node,
                    weeks: util.getWeeksByYear(node.$date.getFullYear())
                });
        }

        //console.timeEnd('d3sidebar.update');
    }

    function onRegion(data) {
        $region = data.region;
        $regionIcon = data.icon;
    }

}());
