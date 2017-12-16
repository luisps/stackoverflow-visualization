window.onload = function () {
    d3zoom.init();
    d3bubble.init();
    d3graph.init();
    d3heatmap.init();
    d3scatter.init();
    d3votes.init();
    d3donut.init();
    d3time.init();
    d3sidebar.init();

    // TODO: in the future this will be called by the region dropdown
    data.load('es');
};
