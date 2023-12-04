class VariablesTable {
    constructor(_config) {
        this.config = {
            tooltipPadding: 10,
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 200,
            containerHeight: _config.containerHeight || 465,
            margin: _config.margin || {
                top: 50,
                right: 10,
                bottom: 10,
                left: 10
            }
        }
        this.descriptions = _config.descriptions
        this.oldVariableOrder = null
        this.podiumColors = podiumColors
        this.initVis()
    }

    initVis() {
        let vis = this

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        // render chart area
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

        // initialize clipping mask for text runover
        vis.chart = vis.chartArea.append('g')
            .attr('clip-path', 'url(#chart-mask)')
            .attr('id', 'variables-table-chart')
        vis.chart.append('defs')
            .append('clipPath')
            .attr('id', 'chart-mask')
            .append('rect')
            .attr('width', vis.width)
            .attr('y', -vis.config.margin.top)
            .attr('height', vis.config.containerHeight)

        // render title
        vis.title = vis.svg.append('text')
            .attr('x', 50)
            .attr('y', vis.config.margin.top - 20)
            .attr('class', 'title')
            .text('All Variables')
    }

    updateVis(config) {
        let vis = this
        
        // If this is lightweight (i.e. only the selected college changes), skip heavy filter logic
        if (config?.lightweight) return vis.renderVis()

        // If persistence map is not initialized, set it to an obj of {name1: 0, name2: 1, name3: 2} etc.
        if (!vis.oldVariableOrder) {
            vis.oldVariableOrder = {}
            vis.topCategories.forEach((category, i) => {
                vis.oldVariableOrder[category[0]] = i
            })
        }

        // set the entry number, as well as how much it's changed since the last iteration
        vis.topCategories = vis.topCategories.map((entry, i) => {
            const entryName = entry[0]
            const result = {
                entryName: entryName, 
                correlation: entry[1], 
                index: i, 
                diff: vis.oldVariableOrder[entryName] - i
            }

            // update for next iteration
            vis.oldVariableOrder[entryName] = i

            return result
        })

        // Render the visualization
        vis.renderVis()
    }

    renderVis() {
        let vis = this
        const ROW_HEIGHT = vis.height / (vis.topCategories?.length || 1)
        const ROW_WIDTH = vis.width
        vis.chart.selectAll(".table-row")
            .data(vis.topCategories, d => d.entryName)
            .join(enter => {
                    const tableRows = enter.append('g')
                        .attr('class', 'table-row')
                        .attr('transform', (d) => `translate(0, ${d.index * ROW_HEIGHT})`)

                    // Append rectangles that will cause tooltip to show up
                    tableRows.append('rect')
                        .attr('height', ROW_HEIGHT - 5)
                        .attr('width', ROW_WIDTH)
                        .style('fill', d => vis.podiumColors[d.index])
                        .on('mouseover', (event, d) => {
                            const [title, description] = vis.descriptions.get(d.entryName)
                            d3.select('#help-text')
                                .style('display', 'block')
                                .style('left', event.pageX - vis.config.tooltipPadding - 285 + 'px')
                                .style('top', event.pageY + vis.config.tooltipPadding - 210 + 'px')
                                .html(`
                                    <div class='tooltip-title'>${title}</div>
                                    <ul>
                                        <li>${description}</li>
                                    </ul>
                                `)
                        })
                        .on('mouseleave', () => d3.select('#help-text').style('display', 'none'))

                    // Append how much that variable's rank has changed
                    tableRows.append('text')
                        .attr('class', 'row-rank')
                        .attr('x', 10)
                        .attr('y', 20)
                        .text(d => `• ${d.diff}`)

                    // Append name for that variable
                    tableRows.append('text')
                        .attr('x', 40)
                        .attr('y', 20)
                        .text(d => vis.descriptions.get(d.entryName)[0])

                    return tableRows
                },
                update => {
                    update.attr('transform', (d) => `translate(0, ${d.index * ROW_HEIGHT})`)
                    update.select('rect')
                        .style('fill', d => vis.podiumColors[d.index])
                    update.select('.row-rank')
                        .attr('class', d => {
                            if (d.correlation === null) return 'row-rank gray-fill'
                            if (d.diff > 0) return 'row-rank green-fill'
                            if (d.diff < 0) return 'row-rank red-fill'
                            return 'row-rank'
                        })
                        .text(d => {
                            if (d.correlation === null) return 'n/a'
                            if (d.diff > 0) return `↑ ${d.diff}`
                            if (d.diff < 0) return `↓ ${d.diff}`
                            return `• ${d.diff}`
                        })
                    return update
                },
                exit => exit.remove()
            )
    }
}