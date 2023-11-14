class SankeyChart {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 360,
            containerHeight: _config.containerHeight || 240,
            margin: _config.margin || {
                top: 10,
                right: 0,
                bottom: 0,
                left: 0
            },
            tooltipPadding: _config.tooltipPadding || 15
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
            .attr('style', 'background-color:beige')

        vis.chart = vis.svg.append('g')
            .attr('id', 'sankey-chart')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

        // setup left axis (parental SES)
        vis.leftScale = d3.scaleLinear()
            .range([0, vis.height])
        vis.leftAxis = d3.axisLeft(vis.leftScale)
        vis.leftAxisGroup = vis.chart.append('g')
            .attr('class', 'axis left-axis')
        vis.leftAxisLabel = vis.svg.append('text')
            .attr('x', 20)
            .attr('y', vis.config.margin.top)
            .attr('class', 'axis-label')
            .text('Parent SES')

        // setup right axis (friending bias)
        vis.rightScale = d3.scaleLinear()
            .range([0, vis.height])
        vis.rightAxis = d3.axisRight(vis.rightScale)
        vis.rightAxisGroup = vis.chart.append('g')
            .attr('class', 'axis right-axis')
        vis.rightAxisLabel = vis.svg.append('text')
            .attr('x', vis.width - 20)
            .attr('y', vis.config.margin.top)
            .attr('class', 'axis-label hoverable end-label')
            .text('Friending Bias ⓘ')

        // Add help text to Friending Bias
        vis.rightAxisLabel
            .on('mouseover', (event) => {
                d3.select('#help-text')
                    .style('display', 'block')
                    .style('left', event.pageX + vis.config.tooltipPadding + 'px')
                    .style('top', event.pageY + vis.config.tooltipPadding + 'px')
                    .html(`
                        <div class="tooltip-title">Friending Bias</div>
                        <ul>
                            <li>The tendency for a student to be friends with other students who have a similar SES.</li>
                            <li>A higher bias means the student mainly has friends with similar socioeconomic backgrounds.</li>
                        </ul>
                    `)
            }).on('mouseleave', () => {
                d3.select('#help-text').style('display', 'none')
            })

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