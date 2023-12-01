const PARENT_SES_NAME_PREFIX = 'Parent SES Q'
const FRIENDING_BIAS_NAME_PREFIX = 'Friending Bias Q'
const PARENT_SES_CATEGORY_PREFIX = 'parentSesQ'
const FRIENDING_BIAS_CATEGORY_PREFIX = 'friendingBiasQ'
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

class SankeyChart {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 240,
            margin: _config.margin || {
                top: 40,
                right: 10,
                bottom: 0,
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

        // setup left axis (parental SES)
        vis.leftScale = d3.scaleLinear()
            .range([0, vis.height])
        vis.leftAxis = d3.axisLeft(vis.leftScale)
        vis.leftAxisGroup = vis.chart.append('g')
            .attr('class', 'axis left-axis')
        vis.leftAxisLabel = vis.svg.append('text')
            .attr('x', 0)
            .attr('y', vis.config.margin.top - 30)
            .attr('class', 'axis-label')
            .text('Parent SES')

        // setup right axis (friending bias)
        vis.rightScale = d3.scaleLinear()
            .range([0, vis.height])
        vis.rightAxis = d3.axisRight(vis.rightScale)
        vis.rightAxisGroup = vis.chart.append('g')
            .attr('class', 'axis right-axis')
        vis.rightAxisLabel = vis.svg.append('text')
            .attr('x', vis.config.containerWidth)
            .attr('y', vis.config.margin.top - 30)
            .attr('class', 'axis-label end-label')
            .text('Friending Bias ⓘ')

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
            }).on('mouseleave', () => {
            d3.select('#help-text').style('display', 'none')
        })

        // Initiate sankey generator
        vis.sankey = d3.sankey()
            .nodeId(d => d.name)
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[200, 0], [vis.width - 200, vis.height]])
            .nodeSort(null)
            .linkSort((a, b) => {
                const sortingValueA = a.source.index * 10 + a.target.index
                const sortingValueB = b.source.index * 10 + b.target.index
                return sortingValueA - sortingValueB
            })
    }

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

        // Format node data
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
                        .attr('stroke', (d) => {
                            if (vis.selectedCollege
                                && d.source.quartile === vis.selectedCollege.ec_parent_ses_college_quartile
                                && d.target.quartile === vis.selectedCollege.bias_own_ses_college_quartile) {
                                return BLUE
                            }
                            
                            return `url(#${d.uid})`
                        })
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
                    }),
                exit => exit.remove()
            )

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
                        })
                        .on('click', (event, d) => {
                            // Gets the category to filter on (i.e. friendingBiasQuartile or parentSesQuartile)
                            const filterName = `${d.category.split('Q')[0]}Quartile`
                            // Gets the quartile
                            const quartileValue = +d.quartile

                            const data = {[filterName]: quartileValue}
                            vis.dispatcher.call('filterData', null, data)
                        })

                    // Add tooltip-type label
                    const tooltips = nodes.append('title').text(d => `${d.name}`)

                    // Add node labels
                    const labels = groups.append('text')
                        .attr('class', 'sankey-node-label')
                        .attr('x', d => d.x0 < vis.width / 2 ? d.x0 - 8 : d.x1 + 8)
                        .attr('y', d => (d.y1 + d.y0) / 2)
                        .attr('dy', '0.35em')
                        .attr('text-anchor', d => d.x0 < vis.width / 2 ? 'end' : 'start')
                        .text(d => d.label)
                        .raise()

                    return groups
                },
                update => update.selectAll('rect')
                    .attr('class', d => {
                        let classNames = 'sankey-node clickable'
                        if (selectedParentSesQ || selectedFriendingBiasQ) {
                            classNames += [selectedParentSesQ, selectedFriendingBiasQ].includes(d.category)
                                ? ' focused'
                                : ' not-focused'
                        }
                        return classNames
                    }),
                exit => exit
            )

        // Notify main.js that rendering is done
        vis.dispatcher.call('completedInitialLoad', null, "sankey");
    }
}