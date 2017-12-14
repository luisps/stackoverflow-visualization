const d3heatmap = (function () {

    // Variables
    let selectedTag = null,
        tagData = []
    ;

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

    function updateTagData() {

        //erase data from previous tag
        tagData = [];
        var dataNodes = data.nodes;
        var prev = null;

        for (var year in dataNodes) {
            for (var month in dataNodes[year]) {
                for (var day in dataNodes[year][month]) {
                    var activity = dataNodes[year][month][day][selectedTag];

                    //since we're dealing with accumulated values we must subtract
                    //the counts of the current day to the counts of the previous day
                    if (prev == null) {
                        var questionCount = activity.questioncount,
                            answerCount = activity.answercount,
                            commentCount = activity.commentcount
                            ;
                    } else {
                        var questionCount = activity.questioncount - prev.questioncount,
                            answerCount = activity.answercount - prev.answercount,
                            commentCount = activity.commentcount - prev.commentcount
                            ;
                    }
                    prev = activity;

                    tagData.push({
                        date: new Date(year, month, day),
                        total: questionCount + answerCount + commentCount,
                        summary: [
                        {
                            name: 'Questions',
                            value: questionCount
                        },
                        {
                            name: 'Answers',
                            value: answerCount
                        },
                        {
                            name: 'Comments',
                            value: commentCount
                        }]
                    });
                }
            }
        }

    }


}());
