window.onload = function () {
    data.init();
    d3zoom.init(); // Must init before everyone else
    d3bubble.init();
    d3donut.init();
    d3graph.init();
    d3heatmap.init();
    d3region.init();
    d3scatter.init();
    d3sidebar.init();
    d3time.init();
    d3votes.init();

    // TODO: in the future this will be called by the region dropdown
};
