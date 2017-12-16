const util = (function () {

    return {
        // Thanks to https://stackoverflow.com/questions/36532307/rem-px-in-javascript
        getRem: () =>  parseFloat(getComputedStyle(document.documentElement).fontSize),

        // Thanks to https://gist.github.com/dblock/1081513
        getWeek: (year, month, day) => {
            let target = new Date(year, month - 1, day),
                dayNr = (target.getDay() + 6) % 7,
                jan4    = new Date(target.getFullYear(), 0, 4);

            target.setDate(target.getDate() - dayNr + 3);
            return 1 + Math.ceil((target - jan4) / 86400000 / 7);
        }
    }

}());