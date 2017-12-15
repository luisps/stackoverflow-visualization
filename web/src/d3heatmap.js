const d3heatmap = (function () {

    // Private Variables

    return {
        init
    };

    function init() {

        // Event Listeners
        d3sidebar.$dispatcher.on('load.sidebar', load);
    }

    function load(data) {

        console.log('heatmap data', data)

    }

})();