class SmallMultiplesScatterplots {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 360,
            containerHeight: _config.containerHeight || 240,
            margin: _config.margin || {
                top: 20,
                right: 20,
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
            .attr('height', vis.config.containerHeight);

        // initialize axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
            .domain([0, 2]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([0, 2]);

        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(-vis.height - 10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-vis.width - 10);

        // append main container
        vis.mainContainer = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // append three sub-containers with padding
        vis.subContainers = vis.mainContainer.selectAll('.sub-container')
            .data([0, 1, 2]) // data for three sub-containers
            .enter()
            .append('g')
            .attr('class', (d, index) => `sub-container sub-container-${index}`)
            .attr('transform', (d, index) => `translate(${index * (vis.width + 10)}, 0)`)
            .attr('style', 'background-color:red');

        // group elements
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);
        
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');
        
        // axis titles
        // vis.chart.append('text')
        //     .attr('class', 'axis-title')
        //     .attr('y', vis.height - 15)
        //     .attr('x', vis.width + 10)
        //     .attr('dy', '.71em')
        //     .style('text-anchor', 'end')
        //     .text('Distance');

        // vis.svg.append('text')
        //     .attr('class', 'axis-title')
        //     .attr('x', 0)
        //     .attr('y', 0)
        //     .attr('dy', '.71em')
        //     .text('Hours');
    }

    updateVis() {
        let vis = this;

        // calculate correlation data
        vis.correlationData =  this.calculatePearsonCorrelation(vis.data);
        vis.topThreeCategories = this.getTopThreeCategories(vis.correlationData);
        // console.log(correlationData)
        // console.log(topThreeCategories)

        // y dynamic get and set
        let yDataRange = d3.extent(vis.data, d => d.change_ses);
        vis.yScale.domain(yDataRange);
        vis.yValue = d => d.change_ses;

        // x dynamic get and set
        vis.xScale.domain([0,2]); // leave as static, too complicated to make dynamic
        vis.xValue = d => d[vis.topThreeCategories[0]];

        // // x dynamic get and set for each sub-container
        // vis.xScales = vis.topThreeCategories.map(category =>
        //     d3.scaleLinear().range([0, vis.width]).domain([0, 2])
        // );
        // vis.xValues = vis.topThreeCategories.map((category, index) => d => d[category]);

        // TODO delete placeholder
        vis.dispatcher.call('placeholder', null, vis.config.parentElement);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // draw gridlines
        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove());

        // draw circles
        const circles = vis.chart.selectAll('.point')
                .data(vis.data, d => d.college_name)
            .join('circle')
                .attr('class', 'point')
                .attr('r', 2)
                .attr('cy', d => vis.yScale(vis.yValue(d)))
                .attr('cx', d => vis.xScale(vis.xValue(d)));

    }

    calculatePearsonCorrelation(data) {
        let correlationCoefficients = new Map();
        let changeSesData = data.map(d => d.change_ses);
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

        categoriesOfInterest.forEach((category) => {
            let categoryData = data.map(d => d[category]);
            let categoryDataEdited = categoryData.map((value) => {
                return value === "" ? 0 : parseFloat(value);
              });
            let correlationCoefficient = ss.sampleCorrelation(changeSesData, categoryDataEdited)
            // console.log(correlationCoefficient)

            correlationCoefficients.set(category, correlationCoefficient)
        }) 

        return correlationCoefficients;
    }

    getTopThreeCategories(categoryData) {
        let categories = Array.from(categoryData.entries());

        categories.sort((a, b) => b[1] - a[1]);
        let topThreeCategories = categories.slice(0, 3).map(entry => entry[0]);

        return topThreeCategories;
    }
}
