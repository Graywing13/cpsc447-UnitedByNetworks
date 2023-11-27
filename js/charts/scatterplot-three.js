const INDEX_2 = 2
class ScatterplotThree {
    constructor(_config, dispatcher, column) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 150,
            margin: _config.margin || {
                top: 20,
                right: 200,
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
            .attr('style', 'background-color:#CD7F32');

        // initialize axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
            .domain([-1, 2]);

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
    }

    updateVis() {
        let vis = this;

        // calculate correlation data
        vis.correlationData = this.calculatePearsonCorrelation(vis.data);
        vis.topThreeCategories = this.getTopThreeCategories(vis.correlationData);

        // if the category's correlation does not exist (likely due to too few points), skip to renderVis
        const currentCategory = vis.topThreeCategories[INDEX_2]
        if (!currentCategory) {
            return vis.renderVis();
        }
        // console.log(vis.correlationData)
        // console.log(topThreeCategories)

        // y dynamic get and set
        let yDataRange = d3.extent(vis.data, d => d.change_ses);
        vis.yScale.domain(yDataRange);
        vis.yValue = d => d.change_ses;

        // x dynamic get and set
        vis.xValue = d => d[currentCategory];

        // axis titles
        // vis.chart.append('text')
        //     .attr('class', 'axis-title')
        //     .attr('y', vis.height - 15)
        //     .attr('x', vis.width + 10)
        //     .attr('dy', '.71em')
        //     .style('text-anchor', 'end')
        //     .text(vis.topThreeCategories[INDEX_2]);

        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 10)
            .attr('y', 0)
            .attr('dy', '.71em')
            .text('Δ SES');

        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        
        // Figure out the correlation (if it exists)
        const category = vis.topThreeCategories[INDEX_2]
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
        const circles = vis.chart.selectAll('.point')
            .data(circlesData, d => d.college_name)
            .join('circle')
            .attr('class', 'point')
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

        // TODO fix this from darkening when slider is dragged
        vis.svg.append('text')
            .attr('class', 'right-margin-text')
            .attr('x', vis.config.containerWidth - vis.config.margin.right + 20)
            .attr('y', 20)
            .attr('dy', '.71em')
            .style('font-weight', 'bold')
            .text('Most Correlated:');

        vis.chart.selectAll('.most-correlated')
            .data([vis.topThreeCategories[INDEX_2]])
            .join(
                enter => enter.append("text")
                    .attr('class', 'right-margin-text most-correlated')
                    .attr('x', vis.config.containerWidth - vis.config.margin.right)
                    .attr('y', 30)
                    .attr('dy', '.71em')
                    .style('font-style', 'italic')
                    .text(vis.topThreeCategories[INDEX_2]),
                update => update.text(vis.topThreeCategories[INDEX_2])
            )

        // TODO fix this from darkening when slider is dragged
        vis.svg.append('text')
            .attr('class', 'right-margin-text')
            .attr('x', vis.config.containerWidth - vis.config.margin.right + 20)
            .attr('y', 70)
            .attr('dy', '.71em')
            .text('Description Placeholder');

        vis.chart.selectAll('.correlation')
            .data([correlation])
            .join(
                enter => enter.append("text")
                    .attr('class', 'right-margin-text correlation')
                    .attr('x', vis.config.containerWidth - vis.config.margin.right)
                    .attr('y', 70)
                    .attr('dy', '.71em')
                    .style('font-style', 'italic')
                    .text(`Pearson's Correlation: ${correlation}`),
                update => update.text(`Pearson's Correlation: ${correlation}`)
            )

        // Notify main.js that rendering is done
        vis.dispatcher.call('completedInitialLoad', null, `scatterplot ${INDEX_2}`);
    }

    calculatePearsonCorrelation(data) {
        let vis = this
        let correlationCoefficients = new Map();
        let categoriesOfInterest = [
            'mean_students_per_cohort',
            'ec_high_parent_ses_college',
            'exposure_own_ses_college',
            'exposure_parent_ses_college',
            'bias_own_ses_college',
            'bias_parent_ses_college',
            'bias_high_own_ses_college',
            'bias_high_parent_ses_college',
            'clustering_college',
            'support_ratio_college',
            'volunteering_rate_college'
        ];

        // For every category, filter for valid data, then calculate correlation coefficient
        categoriesOfInterest.forEach((category) => {
            const dataFiltered = data.filter((d) => d.change_ses !== '' && d[category] !== '' && d.ec_parent_ses_college <= vis.maxParentSes);
            const changeSesData = dataFiltered.map(d => d.change_ses)
            const categoryData = dataFiltered.map(d => d[category])

            try {
                const correlationCoefficient = ss.sampleCorrelation(changeSesData, categoryData)
                correlationCoefficients.set(category, correlationCoefficient)
            } catch (e) {
                // there are too few points to calculate a coefficient
                correlationCoefficients.set(category, null)
            }
        })

        return correlationCoefficients;
    }

    getTopThreeCategories(categoryData) {
        let categories = Array.from(categoryData.entries());

        categories.sort((a, b) => b[1] - a[1]);
        let topThreeCategories = categories.slice(0, 3).map(entry => entry && entry[0]);

        return topThreeCategories;
    }
}
