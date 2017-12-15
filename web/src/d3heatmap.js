const d3heatmap = (function () {

    // Private Variables

    return {
        init
    };

    function init() {

        // Set overview type (choices are global, year, month and week)
        var overview = 'year';

        // Handler function
        var print = function (val) {
            console.log(val);
        };

        // Initialize calendar heatmap
        calendarHeatmap.init(COLOR_PRIMARY, overview, print);

        // Event listeners
        //data.$dispatcher.on('load.heatmap', load);

        d3graph.$dispatcher.on('select.heatmap', (selected) => {
            selectedTag = selected.id;
            selectTag();
        })

    }

    function selectTag() {

        if (selectedTag == null) {
            console.log('No tag selected!');
            return;
        }

        updateTagData();
        calendarHeatmap.data = tagData;
        calendarHeatmap.selectedTag = selectedTag.substring(1);
        calendarHeatmap.drawChart();

    }

})();