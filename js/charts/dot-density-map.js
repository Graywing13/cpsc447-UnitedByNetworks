const PURPLE = '#7b0698'
const ORANGERED = '#d55a4f'
const YELLOW = '#fff538'
class DotDensityMap {
    constructor(_config, dispatcher) {
        this.config = {
            tooltipPadding: 10,
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 600,
            margin: _config.margin || {
                top: 10,
                right: 150,
                bottom: 120,
                left: -120
            }
        }
        this.dispatcher = dispatcher
        this.stateBorders = _config.stateBorders
        this.collegeData = _config.collegeData
        this.selectedCollege = _config.selectedCollege
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
            .text('Amount of mutual friends')

        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 210)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 105)
            .attr('text-anchor', 'end')
            .style('font-weight', 'bold')
            .text('low')

        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 - 40)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 105)
            .attr('text-anchor', 'start')
            .style('font-weight', 'bold')
            .text('low')

        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 135)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 105)
            .attr('text-anchor', 'end')
            .style('font-weight', 'bold')
            .text('high')

        // Add "high" label on the right
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + 315)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 105)
            .attr('text-anchor', 'start')
            .style('font-weight', 'bold')
            .text('high')

        // Add a color gradient bar
        const gradient = vis.svg.append('defs')
            .append('linearGradient')
            .attr('id', 'color-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%')

        gradient.selectAll('stop')
            .data([
                { offset: '0%', color: PURPLE },
                { offset: '50%', color: ORANGERED },
                { offset: '100%', color: YELLOW }
            ])
            .join('stop')
            .attr('offset', d => d.offset)
            .style('stop-color', d => d.color)

        vis.svg.append('rect')
            .attr('x', vis.width / 2 + 187)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom + 70)
            .attr('width', 150)
            .attr('height', 15)
            .style('fill', 'url(#color-gradient)')

        // Add a label to the right
        vis.svg.append('text')
            .attr('class', 'label')
            .attr('x', vis.width / 2 + vis.config.margin.right + 75)
            .attr('y', vis.config.containerHeight - vis.config.margin.bottom / 2)
            .attr('text-anchor', 'middle')
            .text('Student SES')
    }

    updateVis(config) {
        let vis = this
        
        // If this is lightweight (i.e. only the selected college changes), skip heavy filter logic
        if (config?.lightweight) return vis.renderVis()

        vis.collegeData = vis.collegeData.filter(d => (d.clustering_college !== '' && d.ec_own_ses_college !== ''))

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
                .attr('transform', d => `translate(${projection([d.lon, d.lat])[0]}, ${projection([d.lon, d.lat])[1] - 1})`)
                .on('mouseout', () => hideTooltip())
                .on('mousemove', (event, d) => showTooltip(event, d))
            )

        const colourScale = d3.scaleLinear()
            .domain([0.21, 1.06, 1.91])
            .range([PURPLE, ORANGERED, YELLOW])

        // Add circles under the "Amount of mutual friends" label
        const circleData = [0.8, 1.8, 2.8, 3.8, 4.8]
        vis.svg.selectAll('.circle')
            .data(circleData)
            .join('circle')
            .attr('class', 'circle')
            .attr('cx', (d, i) => vis.width / 2 - 25 + i * 35)
            .attr('cy', vis.config.containerHeight - vis.config.margin.bottom + 77)
            .attr('r', d => d * 2)
            .attr('fill', 'orangered')

        // Create a scale for mapping clustering_college values to circle radius
        const radiusScale = d3.scaleLinear()
            .domain([0.0989, 0.660])
            .range([1, 10])

        const tooltip = d3.select('#tooltip')

        // Append a circle for each college within its group
        collegeGroups.selectAll('circle')
            .data(d => [d])
            .join('circle')
            .attr('r', d => radiusScale(d.clustering_college))
            .attr('fill', d => colourScale(d.ec_own_ses_college))
            .attr('class', d => (d.college === vis.selectedCollege?.college) ? 'map-blue-dot' : '')
            .style('opacity', 0.7)

        function showTooltip(event, d) {

            // Update tooltip content with data
            tooltip.html(`<strong>${d.college_name}</strong>`)

            // Dispatch the highlighted college to the main file
            vis.dispatcher.call('highlightCollege', null, d)

            // Get absolute mouse coordinates
            const mouseX = event.pageX
            const mouseY = event.pageY

            // Position the tooltip at the cursor
            tooltip.style('left', `${mouseX + vis.config.tooltipPadding}px`)
                .style('top', `${mouseY + vis.config.tooltipPadding}px`)

            // Update the fill color of the hovered college to blue
            collegeGroups.selectAll('circle')
                .attr('class', c => (c === d) ? 'map-blue-dot' : '')
                .style('opacity', c => (c === d) ? 1 : 0.7)

            // Set the text color of the tooltip to black
            tooltip.style('color', '#000')

            // Show the tooltip
            tooltip.style('display', 'block')
        }

        // Hide the tooltip
        function hideTooltip() {
            tooltip.style('display', 'none')

            // Reset the fill color of all circles to their original color
            collegeGroups.selectAll('circle')
                .style('fill', d => colourScale(d.ec_own_ses_college))
                .style('opacity', 0.7)

            vis.dispatcher.call('highlightCollege', null, null)
        }
        
        d3.select('.map-blue-dot').raise()

        // Notify main.js that rendering is done
        vis.dispatcher.call('completedInitialLoad', null, "dot density map")
    }
}