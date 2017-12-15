const sidebar = (function () {

    // Variables
    let $dispatcher = d3.dispatch('dataChanged'),
        selected = null,
        selectedTag = null,
        globalView = true
    ;

    return {
        init,
        $dispatcher
    };

    function init() {

        //temporary - hardcoded year
        var year = 2016;

        // Event listeners
        d3graph.$dispatcher.on('select.sidebar', (n) => {
            selected = n;
            selectedTag = n.id;

            //call public methods of data.js
            var nodesByDay = data.nodesByTagByDay(year, selectedTag);
            var nodesByWeek = data.nodesByTagByWeek(year, selectedTag);

            console.log(nodesByDay);
        });

    }

}());
