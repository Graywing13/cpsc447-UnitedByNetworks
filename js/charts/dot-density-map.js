class DotDensityMap {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 600,
            margin: _config.margin || {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }
        }
        this.dispatcher = dispatcher
        this.initVis()
    }

    initVis() {
        let vis = this

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            // TODO delete, just to make it visible
            .attr('style', 'background-color:yellow')

        // TODO
    }

    updateVis() {
        let vis = this

        // TODO

        // TODO delete placeholder
        vis.dispatcher.call('placeholder', null, vis.config.parentElement)

        vis.renderVis()
    }

    renderVis() {
        let vis = this

        // TODO
    }
}