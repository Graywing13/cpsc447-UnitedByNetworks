const INDEX_0 = 0

class ScatterplotOne {
    constructor(_config, dispatcher, column) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 150,
            margin: _config.margin || {
                top: 20,
                right: 250,
                bottom: 20,
                left: 20
            }
        }
        this.dispatcher = dispatcher;
        this.initVis();
    }

    initVis() {
        let vis = this;

        // svg drawing area config
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('style', 'background-color:rgba(255, 193, 0, 0.5)')

        // initialize axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
            .domain([-1, 3]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([-2, 2]);

        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(-vis.height - 10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-vis.width - 10);

        // group elements
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'black-color')

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        // side title
        vis.svg.append('text')
            .attr('class', 'right-margin-text')
            .attr('x', vis.config.containerWidth - vis.config.margin.right + 20)
            .attr('y', 30)
            .attr('dy', '.71em')
            .style('font-weight', 'bold')
            .style('font-size', 'medium')
            .text('Most Correlated:');

        // axis labels
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 10)
            .attr('y', 0)
            .attr('dy', '.71em')
            .text('Δ SES');
    }

    updateVis() {
        let vis = this;

        // if the category's correlation does not exist (likely due to too few points), skip to renderVis
        const currentCategory = vis.topThreeCategories[INDEX_0]
        if (!currentCategory) {
            return vis.renderVis();
        }

        // y dynamic get and set
        let yDataRange = d3.extent(vis.data, d => d.change_ses);
        vis.yScale.domain(yDataRange);
        vis.yValue = d => d.change_ses;

        // x dynamic get and set
        vis.xValue = d => currentCategory === 'mean_students_per_cohort'
            ? (d[currentCategory] / 10000)
            : d[currentCategory];

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // Figure out the correlation (if it exists)
        const category = vis.topThreeCategories[INDEX_0]
        const correlation = vis.correlationData.get(category)?.toFixed(3)

        // Initialize a box that says "not enough data" if there isn't enough data
        vis.svg.selectAll('.not-enough-data')
            .data([correlation])
            .join(
                enter => {
                    const wrapper = enter.append('g')
                        .attr('class', 'not-enough-data')
                        .style('opacity', correlation === undefined ? 100 : 0)
                    wrapper.append('rect')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', vis.config.containerWidth)
                        .attr('height', vis.config.containerHeight)
                        .attr('fill', 'white')
                        .raise()
                    wrapper.append('text')
                        .text("Select a wider range of Family SES to see more insights.")
                        .attr('x', 20)
                        .attr('y', vis.config.containerHeight / 2)
                        .raise()

                    return wrapper
                },
                update => update.style('opacity', correlation === undefined ? 100 : 0)
            )

        // If the correlation is undefined, no need to render everything else
        if (correlation === undefined) {
            return
        }

        // draw circles
        const circlesData = vis.data.filter((d) => d.change_ses !== '' && d[category] !== '' && d.ec_parent_ses_college <= vis.maxParentSes)
        const circles = vis.chart.selectAll('.point-one')
            .data(circlesData, d => d.college_name)
            .join('circle')
            .attr('class', 'point-one')
            .attr('r', 2)
            .attr('cy', d => vis.yScale(vis.yValue(d)))
            .attr('cx', d => vis.xScale(vis.xValue(d)));

        // draw gridlines
        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove());

        vis.chart.selectAll('.most-correlated')
            .data([vis.topThreeCategories[INDEX_0]])
            .join(
                enter => enter.append("text")
                    .attr('class', 'right-margin-text most-correlated')
                    .attr('x', vis.config.containerWidth - vis.config.margin.right)
                    .attr('y', 45)
                    .attr('dy', '.71em')
                    .style('font-style', 'italic')
                    .text(categoryNameAndDescription.get(vis.topThreeCategories[INDEX_0])[0]),
                update => update.text(categoryNameAndDescription.get(vis.topThreeCategories[INDEX_0])[0])
            )

        vis.chart.selectAll('.correlation')
            .data([correlation])
            .join(
                enter => enter.append("text")
                    .attr('class', 'right-margin-text correlation')
                    .attr('x', vis.config.containerWidth - vis.config.margin.right)
                    .attr('y', 65)
                    .attr('dy', '.71em')
                    .style('font-style', 'italic')
                    .text(`Pearson's Correlation: ${correlation}`),
                update => update.text(`Pearson's Correlation: ${correlation}`)
            )

        // Notify main.js that rendering is done
        vis.dispatcher.call('completedInitialLoad', null, `scatterplot ${INDEX_0}`);
    }
}
