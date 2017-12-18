const util = (function () {

    let rem = null;

    return {
        // Thanks to https://stackoverflow.com/questions/36532307/rem-px-in-javascript
        getRem: () => rem || (rem = parseFloat(getComputedStyle(document.documentElement).fontSize)),

        // Thanks to https://stackoverflow.com/a/6117889
        getWeek: (d) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
            let yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        },

        getWeeksByYear: (year) => {
            let dateStart = new Date(year, 0, 1),
                dateEnd = new Date(year,  11, 31);

            dateStart.setDate(dateStart.getDate() - dateStart.getDay());
            dateEnd.setDate(dateEnd.getDate() + (6 - dateEnd.getDay()));

            let res = [];
            for (; dateStart <= dateEnd; dateStart.setDate(dateStart.getDate() + 7))
                res.push(new Date(dateStart));

            return res;
        }
    }

}());