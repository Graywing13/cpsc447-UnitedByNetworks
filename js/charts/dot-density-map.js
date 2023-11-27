class DotDensityMap {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 600,
            margin: _config.margin || {
                top: 30,
                right: 150,
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

        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + vis.config.margin.right - 100)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom / 2)
            .attr('text-anchor', 'middle')
            .text('Amount of inter-SES friends');

        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 210)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 82)
            .attr('text-anchor', 'end')
            .style('font-weight', 'bold')
            .text('low');

        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 - 40)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 82)
            .attr('text-anchor', 'start')
            .style('font-weight', 'bold')
            .text('low');

        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 120)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 82)
            .attr('text-anchor', 'end')
            .style('font-weight', 'bold')
            .text('high');

        // Add "high" label on the right
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 315)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 82)
            .attr('text-anchor', 'start')
            .style('font-weight', 'bold')
            .text('high');

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
            .attr('x', vis.width / 2 + 187)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 55)
            .attr('width', 150)
            .attr('height', 15)
            .style('fill', 'url(#color-gradient)');

        // Add a label to the right
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + vis.config.margin.right + 120)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom / 2)
            .attr('text-anchor', 'middle')
            .text('Amount of mutual friends');
    }

    updateVis() {
        let vis = this

        // Render the visualization
        vis.renderVis()
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
            .join(enter => enter.append('path')
                .attr('d', path)
                .attr('stroke', '#000')
                .attr('stroke-width', 1)
                .attr('fill', '#fff')
            )

        // Bind data and create a group for each college
        const collegeGroups = vis.svg.selectAll('.college')
            .data(vis.collegeData, d => d.college)
            .join(enter => enter.append('g')
                .attr('class', 'college')
                .attr('transform', d => `translate(${projection([d.lon, d.lat])[0]}, ${projection([d.lon, d.lat])[1] + 10})`)
            )

        const colourScale = d3.scaleLinear()
            .domain([0.099, 0.82])
            .range(['purple', 'yellow']);

        // Add circles under the "Amount of inter-SES friends" label
        const circleData = [0.8, 1.8, 2.8, 3.8, 4.8];

        vis.svg.selectAll('.circle')
            .data(circleData)
            .enter().append('circle')
            .attr('class', 'circle')
            .attr('cx', (d, i) => vis.width / 2 - 30 + i * 30)
            .attr('cy', vis.config.containerHeight - vis.config.margin.bottom + 60)
            .attr('r', d => d * 2)
            .attr('fill', 'orangered');

        // Create a scale for mapping bias_own_ses_college values to circle radius
        const radiusScale = d3.scaleLinear()
            .domain([-0.16, 0.38])
            .range([1, 10]);

        // Append a circle for each college within its group
        collegeGroups.append('circle')
            .attr('r', d => radiusScale(d.bias_own_ses_college))
            .attr('fill', d => colourScale(d.clustering_college || 0));
        
        // Notify main.js that rendering is done
        vis.dispatcher.call('completedInitialLoad', null, "dot density map");
    }
}
