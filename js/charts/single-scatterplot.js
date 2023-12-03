class SingleScatterplot {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 150,
            margin: _config.margin || {
                top: 20,
                right: 250,
                bottom: 20,
                left: 20
            },
            tooltipPadding: _config.tooltipPadding || 10
        }
        this.dispatcher = dispatcher
        this.selectedCollege = null
        this.plotIndex = _config.plotIndex
        this.backgroundColor = _config.backgroundColor
        this.circleClassName = _config.circleClassName
        this.initVis()
    }

    initVis() {
        let vis = this

        // svg drawing area config
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('style', `background-color:${vis.backgroundColor}`)

        // initialize axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
            .domain([-1, 3])

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([-2, 2])

        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(-vis.height - 10)

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-vis.width - 10)

        // group elements
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'black-color')

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`)

        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis')

        // side title
        vis.svg.append('text')
            .attr('class', 'right-margin-text')
            .attr('x', vis.config.containerWidth - vis.config.margin.right + 20)
            .attr('y', 30)
            .attr('dy', '.71em')
            .style('font-weight', 'bold')
            .style('font-size', 'medium')
            .text('Most Correlated:')

        // axis labels
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 10)
            .attr('y', 0)
            .attr('dy', '.71em')
            .text('Δ SES')
    }

    updateVis() {
        let vis = this

        // If the category's correlation does not exist (likely due to too few points), skip to renderVis
        vis.category = vis.topThreeCategories[vis.plotIndex]
        if (!vis.category) return vis.renderVis()

        // Figure out the correlation (if it exists)
        vis.correlation = vis.correlationData.get(vis.category)?.toFixed(3)

        // Setup dynamic y range, scale, and getter function
        let yDataRange = d3.extent(vis.data, d => d.change_ses)
        vis.yScale.domain(yDataRange)
        vis.yValue = d => d.change_ses

        // Setup dynamic x getter function
        vis.xValue = d => vis.category === 'mean_students_per_cohort'
            ? (d[vis.category] / 10000)
            : d[vis.category]

        // filter data
        vis.data = vis.data.filter(
            (d) => d.change_ses !== ''
                && d[vis.category] !== ''
                && d.ec_parent_ses_college <= vis.maxParentSes
        )

        vis.renderVis()
    }

    renderVis() {
        let vis = this

        // Initialize a box that says "not enough data" if there isn't enough data
        vis.svg.selectAll('.not-enough-data')
            .data([vis.correlation])
            .join(
                enter => {
                    const wrapper = enter.append('g')
                        .attr('class', 'not-enough-data')
                        .style('visibility', vis.correlation === undefined ? 'visible' : 'hidden')
                    wrapper.append('rect')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', vis.config.containerWidth)
                        .attr('height', vis.config.containerHeight - 1)
                        .raise()
                    wrapper.append('text')
                        .text("Select a wider range of Family SES to see more insights.")
                        .attr('x', 20)
                        .attr('y', vis.config.containerHeight / 2 - 10)
                        .raise()
                    wrapper.append('text')
                        .text("Hint: the selected range may be too low for the sankey's filtered data")
                        .attr('font-style', 'italic')
                        .attr('x', 20)
                        .attr('y', vis.config.containerHeight / 2 + 30)
                        .raise()

                    return wrapper
                },
                update => update.style('visibility', vis.correlation === undefined ? 'visible' : 'hidden')
            )

        // If the correlation is undefined, no need to render everything else
        if (vis.correlation === undefined) {
            return
        }

        vis.chart.selectAll('circle')
            .data(vis.data, d => d.college)
            .join(
                enter => {
                    enter.append("circle")
                        .attr('class', vis.circleClassName)
                        .attr('r', 2)
                        .attr('cy', d => vis.yScale(vis.yValue(d)))
                        .attr('cx', d => vis.xScale(vis.xValue(d)))
                        .on('mouseenter', (event, d) => {
                            // Get absolute mouse coordinates
                            const mouseX = event.pageX
                            const mouseY = event.pageY

                            // Position the tooltip at the cursor with college name
                            d3.select('#tooltip')
                                .html(`<strong>${d.college_name}</strong>`)
                                .style('left', `${mouseX + vis.config.tooltipPadding}px`)
                                .style('top', `${mouseY + vis.config.tooltipPadding}px`)
                                .style('display', 'block')

                            // Initiate linkage highlighting
                            vis.dispatcher.call('highlightCollege', null, d)
                        })
                        .on('mouseleave', () => {
                            // Remove linkage highlighting & tooltip
                            vis.dispatcher.call('highlightCollege', null, null)
                            d3.select('#tooltip')
                                .style('display', 'none')
                        })
                },
                update => {
                    return update
                        .attr('cy', d => vis.yScale(vis.yValue(d)))
                        .attr('cx', d => vis.xScale(vis.xValue(d)))
                        .attr('class', d => d.college === vis.selectedCollege?.college ? 'point-highlight' : vis.circleClassName)
                        .attr('r', d => d.college === vis.selectedCollege?.college ? 4 : 2)
                },
                exit => {
                    return exit.remove();
                }
            )

        // Make highlighted dots more visible
        d3.selectAll('.point-highlight').raise()

        // draw gridlines
        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove())

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove())

        vis.chart.selectAll('.most-correlated')
            .data([vis.topThreeCategories[vis.plotIndex]])
            .join(
                enter => enter.append("text")
                    .attr('class', 'right-margin-text most-correlated')
                    .attr('x', vis.config.containerWidth - vis.config.margin.right)
                    .attr('y', 45)
                    .attr('dy', '.71em')
                    .style('font-style', 'italic')
                    .text(categoryNameAndDescription.get(vis.topThreeCategories[vis.plotIndex])[0]),
                update => update.text(categoryNameAndDescription.get(vis.topThreeCategories[vis.plotIndex])[0])
            )

        vis.chart.selectAll('.correlation')
            .data([vis.correlation])
            .join(
                enter => enter.append("text")
                    .attr('class', 'right-margin-text correlation')
                    .attr('x', vis.config.containerWidth - vis.config.margin.right)
                    .attr('y', 65)
                    .attr('dy', '.71em')
                    .style('font-style', 'italic')
                    .text(`Pearson's Correlation: ${vis.correlation}`),
                update => update.text(`Pearson's Correlation: ${vis.correlation}`)
            )

        // Notify main.js that rendering is done
        vis.dispatcher.call('completedInitialLoad', null, `scatterplot ${vis.plotIndex}`)
    }
}
