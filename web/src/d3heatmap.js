const d3heatmap = (function () {

    // Variables
    let $data = null,
        $tag = null
    ;

    return {
        init
    };

    function init() {
        metrics = ['questioncount', 'answercount', 'commentcount']
        metricNames = ['Question', 'Answer', 'Comment']
        selectedMetric = 0;

        //initialize heatmap
        heatmap = calendarHeatmap()
            .selector('.heatmap-container')
            .tooltipEnabled(true)
            .colorRange(['#f4f7f7', '#79a8a9'])
            .onClick(function (data) {
                console.log('data', data);
            });

        //initialize heatmap slider
        $('.metrics').css('visibility', 'visible');
        $('.metrics').slick();

        //update metric on slider change
        $('.metrics').on('afterChange', function(ev, slick, currentSlide) {
            selectedMetric = currentSlide;
            load();
        });

        // Event listeners
        d3time.$dispatcher.on('update.heatmap', (data) => {
            $data = data.series.nodes;
            load();
        });
        d3graph.$dispatcher.on('select', (selected) => {
            $tag = selected.id;
            load();
        })
    }

    function load() {
        if ($data === null || $tag === null) return;

        let metric = metrics[selectedMetric],
            metricName = metricNames[selectedMetric];

        heatmap.tooltipUnit(metricName);
        heatmap.data($data[$tag].map((n) => {
            n.count = n[metric];
            return n;
        }));
        heatmap();
    }

    /*
    function updateHeatmapTag() {
        tagActivity = [];

        // TODO: use the year and month selected from the timeline. Centralize this on the data module
        let dataNodes = data.selected_nodes;


        for (var year in dataNodes) {
            for (var month in dataNodes[year]) {
                for (var day in dataNodes[year][month]) {

                    activity = dataNodes[year][month][day]['$' + selectedTag];
                    tagActivity.push({
                        date: new Date(year, month, day),
                        questioncount: activity.questioncount,
                        answercount: activity.answercount,
                        commentcount: activity.commentcount
                    });
                }
            }
        }

    }
    */

    /*
    function getMetricData(tagActivity, metric) {
        return tagActivity.map(function(node) {
            return {
                date: node.date,
                count: node[metric]
            };
        });
    }

    function updateHeatmapMetric() {
        var metricData = getMetricData(tagActivity, metrics[selectedMetric]);
        var metricName = metricNames[selectedMetric];

        heatmap.data(metricData);
        heatmap.tooltipUnit(metricName);
        heatmap();  // render the chart
    }
    */


}());
