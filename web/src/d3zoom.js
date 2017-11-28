const d3zoom = (function () {

    // Constants
    const ZOOM_DURATION = 200;
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 16;

    // Variables
    let d3svg,
        d3svgDimensions,
        d3zoom,
        d3zoomTransform = { k: 1, x: 0, y: 0 }
    ;

    return {
        $dimensions: () => d3svgDimensions,
        init,
        zoomReset,
        zoomTo
    };

    function init() {
        d3svg = d3.select('#zoom');
        d3svgDimensions = window.getComputedStyle(d3svg.node());
        d3svgDimensions = { height: parseInt(d3svgDimensions.height), width: parseInt(d3svgDimensions.width) };

        d3zoom = d3.zoom()
            .scaleExtent([ZOOM_MIN, ZOOM_MAX])
            .on('zoom', () => {
                let duration = d3.event.transform.k !== d3zoomTransform.k ? ZOOM_DURATION : 0;
                d3zoomTransform = d3.event.transform;

                d3bubble.$d3select().transition().ease(d3.easeLinear).duration(duration).attr('transform', d3.event.transform);
                d3graph.$d3select().transition().ease(d3.easeLinear).duration(duration).attr('transform', d3.event.transform);
            })
        ;
        d3svg.call(d3zoom);
    }

    // https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
    function zoomTo(boundingBox, percentage) {
        let scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, percentage / Math.max(boundingBox.width / d3svgDimensions.width, boundingBox.height / d3svgDimensions.height))),
            translateX = d3svgDimensions.width / 2 - scale * boundingBox.x,
            translateY = d3svgDimensions.height / 2 - scale * boundingBox.y
        ;

        d3svg.transition()
            .duration(ZOOM_DURATION)
            .call(d3zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    }

    function zoomReset() {
        d3svg.transition()
            .duration(ZOOM_DURATION)
            .call(d3zoom.transform, d3.zoomIdentity);
    }

}());