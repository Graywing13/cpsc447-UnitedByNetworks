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
        this.dispatcher = dispatcher;
        this.stateBorders = _config.stateBorders; 
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Call the update function to render the map
        vis.updateVis();
    }

    updateVis() {
        // TODO: Any update logic if needed

        // Render the visualization
        this.renderVis();
    }

    renderVis() {
        let vis = this;

        // Set up a projection for the map
        const projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(1020);

        // Create a path generator
        const path = d3.geoPath().projection(projection);

        // Bind data and create path elements for each state
        vis.svg.selectAll('path')
            .data(vis.stateBorders)
            .enter().append('path')
            .attr('d', path)
            .attr('stroke', '#000') 
            .attr('stroke-width', 1) 
            .attr('fill', '#fff'); 
    }
}
