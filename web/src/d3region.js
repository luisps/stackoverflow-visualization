const d3region = (function () {

    // Variables
    let $dispatcher = d3.dispatch('click'),
        d3dropdown,
        d3label,
        d3labelIcon
    ;

    return {
        $dispatcher,
        init
    };

    function init() {
        d3dropdown = d3.select('#region-dropdown');
        d3label = d3.select('#region > span');
        d3labelIcon = d3.select('#region > img');

        // Event listeners
        d3dropdown.selectAll('.mdl-menu__item').on('click', onClick);

        // Select 'selected'
        setTimeout(() => onClick.call(d3dropdown.select('.mdl-menu__item.selected').node()), 0);
    }

    function onClick() {
        // De-select previously selected and select the newly selected
        d3dropdown.select('.mdl-menu__item.selected').node().classList.remove('selected');
        this.classList.add('selected');

        // Update label
        let region = this.innerText,
            icon = d3.select(this).select('img').attr('src');

        d3label.text(region);
        d3labelIcon.attr('src', icon);

        // Dispatch event
        $dispatcher.call('click', this, { region, icon });
    }

}());
