/**
 * NOTE: since the sankey and boxplots are conjoined, they will be in the same SVG.
 * Therefore, both of them are created using this file.
 */

// ==[ CONSTANTS ]======================================================================================================
const PARENT_SES_NAME_PREFIX = 'Parent SES Q'
const FRIENDING_BIAS_NAME_PREFIX = 'Friending Bias Q'
const PARENT_SES_CATEGORY_PREFIX = 'parentSesQ'
const FRIENDING_BIAS_CATEGORY_PREFIX = 'friendingBiasQ'
const PARENT_SES_TYPE = 'parentSes'
const SANKEY_COLORS = {
    parentSesQ4: '#feeb8a',
    parentSesQ3: '#f89e72',
    parentSesQ2: '#d54f6a',
    parentSesQ1: '#751f8c',
    friendingBiasQ4: '#334f24',
    friendingBiasQ3: '#3f7524',
    friendingBiasQ2: '#55af2a',
    friendingBiasQ1: '#79FF37'
}
const BLUE = '#60b1ef'

const BOXPLOT_WIDTH = 8
const BOXPLOT_CENTER_MARGIN = 40

// ==[ class for sankey with boxplots ]=================================================================================

class SankeyChart {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 700,
            containerHeight: _config.containerHeight || 240,
            margin: _config.margin || {
                top: 40,
                right: 10,
                bottom: 10,
                left: 10
            },
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.dispatcher = dispatcher
        this.dataFilters = {}
        this.selectedCollege = null
        this.initVis()
    }

    // Helper fn to determine the text label of a quarter
    getQuartileLabel(quartile) {
        switch (quartile) {
            case 1:
                return 'Very low'
            case 2:
                return 'Low'
            case 3:
                return 'High'
            case 4:
                return 'Very high'
            default:
                return 'Error'
        }
    }

    // Set up svg, chart, and static items
    initVis() {
        let vis = this

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.chart = vis.svg.append('g')
            .attr('id', 'sankey-chart')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

        // setup sankey's left axis (parental SES)
        vis.leftScale = d3.scaleLinear()
            .range([0, vis.height])
        vis.leftAxis = d3.axisLeft(vis.leftScale)
        vis.leftAxisLabel = vis.svg.append('text')
            .attr('x', 0)
            .attr('y', vis.config.margin.top - 30)
            .attr('class', 'axis-label')
            .text('Parent SES')

        // setup sankey's right axis (friending bias)
        vis.rightScale = d3.scaleLinear()
            .range([0, vis.height])
        vis.rightAxis = d3.axisRight(vis.rightScale)
        vis.rightAxisLabel = vis.svg.append('text')
            .attr('x', vis.config.containerWidth)
            .attr('y', vis.config.margin.top - 30)
            .attr('class', 'axis-label end-label')
            .text('Friending Bias ⓘ')

        // setup parent ses boxplot scales and axes
        vis.parentSesBoxplotScale = d3.scaleLinear()
            .range([0, vis.height])
        vis.parentSesBoxplotAxis = d3.axisRight(vis.parentSesBoxplotScale)
        vis.parentSesBoxplotAxisGroup = vis.chart.append('g')
            .attr('class', 'axis y-axis')

        // setup friending bias boxplot scale
        vis.friendingBiasBoxplotScale = d3.scaleLinear()
            .range([0, vis.height])
        vis.friendingBiasBoxplotAxis = d3.axisLeft(vis.friendingBiasBoxplotScale)
        vis.friendingBiasBoxplotAxisGroup = vis.chart.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', `translate(${vis.width}, 0)`)

        // Add help text to Friending Bias
        vis.rightAxisLabel
            .on('mouseover', (event) => {
                d3.select('#help-text')
                    .style('display', 'block')
                    .style('left', event.pageX - vis.config.tooltipPadding - 285 + 'px')
                    .style('top', event.pageY + vis.config.tooltipPadding - 210 + 'px')
                    .html(`
                        <div class='tooltip-title'>Friending Bias</div>
                        <ul>
                            <li>The tendency for a student to be friends with other students who have a similar SES.</li>
                            <li>A higher bias means the student mainly has friends with similar socioeconomic backgrounds.</li>
                        </ul>
                    `)
            }).on('mouseleave', () => d3.select('#help-text').style('display', 'none'))

        // Initiate sankey generator
        vis.sankey = d3.sankey()
            .nodeId(d => d.name)
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[250, 0], [vis.width - 250, vis.height]])
            .nodeSort(null)
            .linkSort((a, b) => {
                const sortingValueA = a.source.index * 10 + a.target.index
                const sortingValueB = b.source.index * 10 + b.target.index
                return sortingValueA - sortingValueB
            })
    }

    // Filter data and format it for rendering usages
    updateVis() {
        let vis = this

        // Filter for data that contains both variables of interest
        vis.data = vis.data.filter(d => d.ec_parent_ses_college_quartile && d.bias_own_ses_college_quartile)

        // Separate filtered data into groups based on variables of interest
        vis.groupedData = d3.flatRollup(
            vis.data,
            v => v.length,
            d => d.ec_parent_ses_college_quartile,
            d => d.bias_own_ses_college_quartile
        ).map((outcome) => {
            const [parentSesQuartile, friendingBiasQuartile, count] = outcome
            return {
                parentSesQuartile,
                friendingBiasQuartile,
                count
            }
        })

        // Get parent SES nodes' rendering data
        const parentSesNodes = d3.rollups(vis.groupedData, v => d3.sum(v, d => d.count), d => d.parentSesQuartile)
            .sort(([quartileA], [quartileB]) => quartileB - quartileA)
            .map(group => {
                const parentSesQuartile = group[0]
                return {
                    name: `${PARENT_SES_NAME_PREFIX}${parentSesQuartile}`,
                    category: `${PARENT_SES_CATEGORY_PREFIX}${parentSesQuartile}`,
                    label: vis.getQuartileLabel(parentSesQuartile),
                    quartile: parentSesQuartile
                }
            })

        // Get friending bias nodes' rendering data
        const friendingBiasNodes = d3.rollups(vis.groupedData, v => d3.sum(v, d => d.count), d => d.friendingBiasQuartile)
            .sort(([quartileA], [quartileB]) => quartileB - quartileA)
            .map(group => {
                const friendingBiasQuartile = group[0]
                return {
                    name: `${FRIENDING_BIAS_NAME_PREFIX}${friendingBiasQuartile}`,
                    category: `${FRIENDING_BIAS_CATEGORY_PREFIX}${friendingBiasQuartile}`,
                    label: `${vis.getQuartileLabel(friendingBiasQuartile)} bias`,
                    quartile: friendingBiasQuartile
                }
            })

        // All node rendering data
        const processedNodes = ([
            ...parentSesNodes,
            ...friendingBiasNodes
        ])

        // Format link data
        const processedLinks = vis.groupedData.map((group) => {
            const {parentSesQuartile, friendingBiasQuartile, count} = group
            return {
                source: `${PARENT_SES_NAME_PREFIX}${parentSesQuartile}`,
                target: `${FRIENDING_BIAS_NAME_PREFIX}${friendingBiasQuartile}`,
                value: count
            }
        })

        // Apply sankey generator to data
        const {nodes: sankeyNodes, links: sankeyLinks} = vis.sankey({
            nodes: processedNodes.map(d => Object.assign({}, d)),
            links: processedLinks.map(d => Object.assign({}, d))
        })
        vis.sankeyNodes = sankeyNodes
        vis.sankeyLinks = sankeyLinks.map(d => {
            return {
                ...d,
                uid: `link-${d.y0}-${d.y1}` // assumed to be a unique way to identify a link
            }
        })

        // Get quartiles data for boxplots and connector polygons
        vis.quartileData = {}
        const quartiles = [0, 0.25, 0.5, 0.75, 1]
        const parentSesValuesSorted = vis.data
            .map((d) => d.ec_parent_ses_college)
            .sort(d3.ascending)
        const friendingBiasValuesSorted = vis.data
            .map((d) => d.bias_own_ses_college)
            .sort(d3.ascending)
        vis.quartileData.parentSes = quartiles.map((q) => d3.quantile(parentSesValuesSorted, q))
        vis.quartileData.friendingBias = quartiles.map((q) => d3.quantile(friendingBiasValuesSorted, q))

        // update boxplot scales
        vis.parentSesBoxplotScale.domain([vis.quartileData.parentSes[4], vis.quartileData.parentSes[0]])
        vis.friendingBiasBoxplotScale.domain([vis.quartileData.friendingBias[4], vis.quartileData.friendingBias[0]])

        // Create boxplot-sankey connector polygons
        vis.boxplotPolygons = sankeyNodes.map((node) => {
            const {category, x0, x1, y0, y1} = node

            // Whether this is a parent ses or friending bias node
            const nodeType = node.category.split('Q')[0]
            // Which scale to use
            const scaleFunction = nodeType === PARENT_SES_TYPE
                ? vis.parentSesBoxplotScale
                : vis.friendingBiasBoxplotScale
            // Where the center of the boxplot is
            const boxplotCenter = nodeType === PARENT_SES_TYPE
                ? BOXPLOT_CENTER_MARGIN
                : vis.width - BOXPLOT_CENTER_MARGIN
            const xValueOffset = nodeType === PARENT_SES_TYPE ? (BOXPLOT_WIDTH / 2) : -(BOXPLOT_WIDTH / 2)
            // Polygon's leftmost x-value
            const xValue = (node.quartile === 1 || node.quartile === 4)
                ? boxplotCenter
                : boxplotCenter + xValueOffset

            // Create the points that will be used by the polygon connecting the boxplot to sankey
            // Depending on if the polygon is on the left or right side, the value the points are pushed will differ
            const polygonData = {category}
            const polygonMap = []
            if (nodeType === PARENT_SES_TYPE) {
                polygonMap.push({x: x0, y: y1})
                polygonMap.push({x: x1, y: y1})
                polygonMap.push({x: x1, y: y0})
                polygonMap.push({x: x0, y: y0})
                polygonMap.push({x: xValue, y: scaleFunction(vis.quartileData[nodeType][node.quartile])})
                polygonMap.push({x: xValue, y: scaleFunction(vis.quartileData[nodeType][node.quartile - 1])})
            } else {
                polygonMap.push({x: x1, y: y0})
                polygonMap.push({x: x0, y: y0})
                polygonMap.push({x: x0, y: y1})
                polygonMap.push({x: x1, y: y1})
                polygonMap.push({x: xValue, y: scaleFunction(vis.quartileData[nodeType][node.quartile - 1])})
                polygonMap.push({x: xValue, y: scaleFunction(vis.quartileData[nodeType][node.quartile])})
            }

            polygonData.polygonMap = polygonMap

            return polygonData
        })

        vis.renderVis()
    }

    renderVis() {
        let vis = this

        // Determine the selected quartiles if they exist
        const {parentSesQuartile, friendingBiasQuartile} = vis.dataFilters
        const selectedParentSesQ = parentSesQuartile && `parentSesQ${parentSesQuartile}`
        const selectedFriendingBiasQ = friendingBiasQuartile && `friendingBiasQ${friendingBiasQuartile}`

        // Create links (must occur first so that text displays on top)
        vis.linkMarks = vis.chart.selectAll('.sankey-link-group')
            .data(vis.sankeyLinks, d => d.uid)
            .join(
                enter => {
                    const groups = enter.append('g')
                        .attr('class', 'sankey-link-group')

                    // Add link gradient (makes link visible)
                    const gradients = groups.append('linearGradient')
                        .attr('id', d => d.uid)
                        .attr('gradientUnits', 'userSpaceOnUse')
                        .attr('x1', d => d.source.x1)
                        .attr('x2', d => d.target.x0)
                    gradients.append('stop')
                        .attr('offset', '0%')
                        .attr('stop-color', d => SANKEY_COLORS[d.source.category])
                    gradients.append('stop')
                        .attr('offset', '100%')
                        .attr('stop-color', d => SANKEY_COLORS[d.target.category])

                    // Add link path
                    const paths = groups.append('path')
                        .attr('class', 'sankey-link clickable')
                        .attr('d', d3.sankeyLinkHorizontal())
                        .attr('stroke', (d) => `url(#${d.uid})`)
                        .attr('stroke-width', d => Math.max(1, d.width))
                        .on('click', (event, d) => {
                            const data = {
                                parentSesQuartile: +d.source.quartile,
                                friendingBiasQuartile: +d.target.quartile
                            }
                            vis.dispatcher.call('filterData', null, data)
                        })

                    // Add tooltip-type label
                    const tooltips = groups.append('title').text(d => `${d.source.name} → ${d.target.name}`)

                    return groups
                },
                update => update.selectAll('path')
                    .attr('class', d => {
                        if ((selectedParentSesQ && d.source.category !== selectedParentSesQ)
                            || (selectedFriendingBiasQ && d.target.category !== selectedFriendingBiasQ)) {
                            return 'sankey-link clickable not-focused'
                        }
                        return 'sankey-link clickable'
                    })
                    .attr('stroke', (d) => {
                        if (vis.selectedCollege
                            && d.source.quartile === vis.selectedCollege.ec_parent_ses_college_quartile
                            && d.target.quartile === vis.selectedCollege.bias_own_ses_college_quartile) {
                            return BLUE
                        }

                        return `url(#${d.uid})`
                    }),
                exit => exit.remove()
            )

        // Create boxplot-sankey connector polygons
        const polygons = vis.chart.selectAll('polygon')
            .data(vis.boxplotPolygons, d => d.category)
            .join(enter => enter.append('polygon')
                .attr('points', d => d.polygonMap
                    .map((p) => [(p.x), (p.y)].join(','))
                    .join(' '))
                .attr('fill', d => SANKEY_COLORS[d.category])
            )
            .on('click', (event, d) => {
                const [nodeType, quartile] = d.category.split('Q')
                // Gets the category to filter on (i.e. friendingBiasQuartile or parentSesQuartile)
                const filterName = `${nodeType}Quartile`
                // Gets the quartile
                const quartileValue = +quartile

                const data = {[filterName]: quartileValue}
                vis.dispatcher.call('filterData', null, data)
            })

        // Create node rects
        vis.rectMarks = vis.chart.selectAll('.sankey-node-group')
            .data(vis.sankeyNodes, d => d.name)
            .join(enter => {
                    const groups = enter.append('g')
                        .attr('class', 'sankey-node-group')

                    const nodes = groups.append('rect')
                        .attr('class', 'sankey-node clickable')
                        .attr('x', d => d.x0)
                        .attr('y', d => d.y0)
                        .attr('height', d => d.y1 - d.y0)
                        .attr('width', d => d.x1 - d.x0)
                        .attr('fill', d => SANKEY_COLORS[d.category])
                        .style('stroke', d => {
                            // If a college is selected, outline the node quartiles it belongs to with blue
                            if (vis.selectedCollege) {
                                if (d.category.split('Q')[0] === PARENT_SES_TYPE) {
                                    if (d.quartile === vis.selectedCollege.ec_parent_ses_college_quartile) {
                                        return BLUE
                                    }
                                } else {
                                    if (d.quartile === vis.selectedCollege.bias_own_ses_college_quartile) {
                                        return BLUE
                                    }
                                }
                            }
                        })
                        .raise()

                    // Add tooltip-type label
                    const tooltips = nodes.append('title').text(d => `${d.name}`)

                    // Add node labels
                    const labels = groups.append('text')
                        .attr('class', 'sankey-node-label')
                        .attr('id', d => d.label.replaceAll(' ', '-'))
                        .attr('x', d => d.x0 < vis.width / 2 ? d.x0 - 8 : d.x1 + 8)
                        .attr('y', d => (d.y1 + d.y0) / 2)
                        .attr('dy', '0.35em')
                        .attr('text-anchor', d => d.x0 < vis.width / 2 ? 'end' : 'start')
                        .text(d => d.label)
                        .raise()

                    d3.select('#High-bias')
                        .text('')
                        .append('tspan')
                        .text('High')
                        .append('tspan')
                        .attr('dx', '-2.1em')
                        .attr('dy', '1.2em')
                        .text('bias')

                    return groups
                },
                update => update.selectAll('rect')
                    .attr('class', d => {
                        let classNames = 'sankey-node'
                        if (selectedParentSesQ || selectedFriendingBiasQ) {
                            classNames += [selectedParentSesQ, selectedFriendingBiasQ].includes(d.category)
                                ? ' focused'
                                : ' not-focused'
                        }
                        return classNames
                    }).style('stroke', d => {
                        // If a college is selected, outline the node quartiles it belongs to with blue
                        if (vis.selectedCollege) {
                            if (d.category.split('Q')[0] === 'parentSes') {
                                if (d.quartile === vis.selectedCollege.ec_parent_ses_college_quartile) {
                                    return BLUE
                                }
                            } else {
                                if (d.quartile === vis.selectedCollege.bias_own_ses_college_quartile) {
                                    return BLUE
                                }
                            }
                        }
                    }),
                exit => exit
            )

        // Render boxplot axes
        vis.parentSesBoxplotAxisGroup.call(vis.parentSesBoxplotAxis)
        vis.friendingBiasBoxplotAxisGroup.call(vis.friendingBiasBoxplotAxis)

        // Render boxplots' vertical center line
        const parentSesBoxplot = vis.chart.selectAll('#parent-ses-boxplot-center')
            .data([vis.quartileData.parentSes])
            .join('line')
            .attr('id', 'parent-ses-boxplot-center')
            .attr('x1', BOXPLOT_CENTER_MARGIN)
            .attr('x2', BOXPLOT_CENTER_MARGIN)
            .attr('y1', d => vis.parentSesBoxplotScale(d[0]))
            .attr('y2', d => vis.parentSesBoxplotScale(d[4]))
        const friendingBiasBoxplot = vis.chart.selectAll('#friending-bias-boxplot-center')
            .data([vis.quartileData.friendingBias])
            .join('line')
            .attr('id', 'friending-bias-boxplot-center')
            .attr('x1', vis.width - BOXPLOT_CENTER_MARGIN)
            .attr('x2', vis.width - BOXPLOT_CENTER_MARGIN)
            .attr('y1', d => vis.friendingBiasBoxplotScale(d[0]))
            .attr('y2', d => vis.friendingBiasBoxplotScale(d[4]))

        // Render boxplots' box
        vis.chart.selectAll('#parent-ses-boxplot-box')
            .data([vis.quartileData.parentSes])
            .join('rect')
            .attr('id', 'parent-ses-boxplot-box')
            .attr('class', 'boxplot-box')
            .attr('x', BOXPLOT_CENTER_MARGIN - BOXPLOT_WIDTH / 2)
            .attr('y', d => vis.parentSesBoxplotScale(d[3]))
            .attr('height', d => vis.parentSesBoxplotScale(d[1]) - vis.parentSesBoxplotScale(d[3]))
            .attr('width', BOXPLOT_WIDTH)
        vis.chart.selectAll('#friending-bias-boxplot-box')
            .data([vis.quartileData.friendingBias])
            .join('rect')
            .attr('id', 'friending-bias-boxplot-box')
            .attr('class', 'boxplot-box')
            .attr('x', vis.width - BOXPLOT_CENTER_MARGIN - BOXPLOT_WIDTH / 2)
            .attr('y', d => vis.friendingBiasBoxplotScale(d[3]))
            .attr('height', d => vis.friendingBiasBoxplotScale(d[1]) - vis.friendingBiasBoxplotScale(d[3]))
            .attr('width', BOXPLOT_WIDTH)

        // Render boxplots' min, median, and max (indexes 0, 2, and 4)
        vis.chart.selectAll('.parent-ses-boxplot-lines')
            .data(vis.quartileData.parentSes.filter((_d, i) => i % 2 === 0))
            .join('line')
            .attr('class', 'parent-ses-boxplot-lines')
            .attr('x1', BOXPLOT_CENTER_MARGIN - BOXPLOT_WIDTH / 2)
            .attr('x2', BOXPLOT_CENTER_MARGIN + BOXPLOT_WIDTH / 2)
            .attr('y1', d => vis.parentSesBoxplotScale(d))
            .attr('y2', d => vis.parentSesBoxplotScale(d))
        vis.chart.selectAll('.friending-bias-boxplot-lines')
            .data(vis.quartileData.friendingBias.filter((_d, i) => i % 2 === 0))
            .join('line')
            .attr('class', 'friending-bias-boxplot-lines')
            .attr('x1', vis.width - BOXPLOT_CENTER_MARGIN - BOXPLOT_WIDTH / 2)
            .attr('x2', vis.width - BOXPLOT_CENTER_MARGIN + BOXPLOT_WIDTH / 2)
            .attr('y1', d => vis.friendingBiasBoxplotScale(d))
            .attr('y2', d => vis.friendingBiasBoxplotScale(d))

        // Notify main.js that rendering is done
        vis.dispatcher.call('completedInitialLoad', null, 'sankey');
    }
}