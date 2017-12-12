window.onload = function () {
    d3zoom.init();
    d3bubble.init();
    d3graph.init();
    //d3heatmap.init();
    d3time.init();

    // TODO: in the future this will be called by the region dropdown
    data.load('es');
};
