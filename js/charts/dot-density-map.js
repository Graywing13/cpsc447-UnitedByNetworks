class DotDensityMap {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 600,
            margin: _config.margin || {
                top: 30,
                right: 150, // Increased right margin to accommodate the second label
                bottom: 100,
                left: -120
            }
        }
        this.dispatcher = dispatcher
        this.stateBorders = _config.stateBorders
        this.collegeData = _config.collegeData
        this.initVis()
    }

    initVis() {
        let vis = this

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        // Add a label at the bottom
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + vis.config.margin.right - 100)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'orangered')
            .text('Amount of inter-SES friends');

        // Add "low" label on the left
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 210) // Adjust the x value as needed
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 82) // Adjust the y value as needed
            .attr('text-anchor', 'end')
            .attr('fill', 'black')
            .style('font-weight', 'bold')
            .text('low');

        // Add "high" label on the right
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 - 40) // Adjust the x value as needed
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 82) // Adjust the y value as needed
            .attr('text-anchor', 'start')
            .attr('fill', 'black')
            .style('font-weight', 'bold')
            .text('low');

        // Add "low" label on the left
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 120) // Adjust the x value as needed
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 82) // Adjust the y value as needed
            .attr('text-anchor', 'end')
            .attr('fill', 'black')
            .style('font-weight', 'bold')
            .text('high');

        // Add "high" label on the right
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 315) // Adjust the x value as needed
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 82) // Adjust the y value as needed
            .attr('text-anchor', 'start')
            .attr('fill', 'black')
            .style('font-weight', 'bold')
            .text('high');

        // Add circles under the "Amount of inter-SES friends" label
        const circleData = [0.8, 1.8, 2.8, 3.8, 4.8]; // You can adjust the number of circles or their sizes as needed

        vis.svg.selectAll('.circle')
            .data(circleData)
            .enter().append('circle')
            .attr('class', 'circle')
            .attr('cx', (d, i) => vis.width / 2 - 30 + i * 30) // Increase the spacing between circles
            .attr('cy', vis.config.containerHeight - vis.config.margin.bottom + 60) // Adjust the y-coordinate as needed
            .attr('r', d => d * 2) // Adjust the radius as needed
            .attr('fill', 'orangered');


        // Add a color gradient bar
        const gradient = vis.svg.append('defs')
            .append('linearGradient')
            .attr('id', 'color-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');

        gradient.append('stop')
            .attr('offset', '0%')
            .style('stop-color', 'purple');

        gradient.append('stop')
            .attr('offset', '100%')
            .style('stop-color', 'yellow');

        vis.svg.append('rect')
            .attr('x', vis.width / 2 + 187) // Adjust the positioning of the color bar
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 55) // Adjust the positioning of the color bar
            .attr('width', 150) // Adjust the width of the color bar
            .attr('height', 15) // Adjust the height of the color bar
            .style('fill', 'url(#color-gradient)');

        // Add a label to the right
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + vis.config.margin.right + 120) // Adjust the x value as needed
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'orangered')
            .text('Amount of mutual friends');

        // Call the update function to render the map
        vis.updateVis()
    }

    updateVis() {
        // TODO: Any update logic if needed

        // Render the visualization
        this.renderVis()
    }

    renderVis() {
        let vis = this

        // Set up a projection for the map
        const projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(1020)

        // Create a path generator
        const path = d3.geoPath().projection(projection)

        // Bind data and create path elements for each state
        vis.svg.selectAll('path')
            .data(vis.stateBorders)
            .enter().append('path')
            .attr('d', path)
            .attr('stroke', '#000')
            .attr('stroke-width', 1)
            .attr('fill', '#fff')

        // Bind data and create a group for each college
        const collegeGroups = vis.svg.selectAll('.college')
            .data(vis.collegeData)
            .enter().append('g')
            .attr('class', 'college')
            .attr('transform', d => `translate(${projection([d.lon, d.lat])[0]}, ${projection([d.lon, d.lat])[1] + 10})`)

        // Append a circle for each college within its group
        collegeGroups.append('circle')
            .attr('r', 2)
            .attr('fill', 'blue')
    }
}
