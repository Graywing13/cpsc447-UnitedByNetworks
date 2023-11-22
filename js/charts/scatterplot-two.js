class ScatterplotTwo {
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
            .attr('style', 'background-color:#C0C0C0');

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
            .attr('class', 'black-color');

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

        // y dynamic get and set
        let yDataRange = d3.extent(vis.data, d => d.change_ses);
        vis.yScale.domain(yDataRange);
        vis.yValue = d => d.change_ses;

        // x dynamic get and set
        vis.xValue = d => d[vis.topThreeCategories[1]];

        // axis titles
        // vis.chart.append('text')
        //     .attr('class', 'axis-title')
        //     .attr('y', vis.height - 15)
        //     .attr('x', vis.width + 10)
        //     .attr('dy', '.71em')
        //     .style('text-anchor', 'end')
        //     .text(vis.topThreeCategories[1]);

        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 10)
            .attr('y', 0)
            .attr('dy', '.71em')
            .text('Δ SES');

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

        vis.svg.append('text')
            .attr('class', 'right-margin-text')
            .attr('x', vis.config.containerWidth - vis.config.margin.right + 20)
            .attr('y', 20) 
            .attr('dy', '.71em')
            .style('font-weight', 'bold')
            .text('2nd Most Correlated:');

        vis.svg.append('text')
            .attr('class', 'right-margin-text')
            .attr('x', vis.config.containerWidth - vis.config.margin.right + 20)
            .attr('y', 50) 
            .attr('dy', '.71em')
            .style('font-style', 'italic')
            .text(vis.topThreeCategories[1]);  
    
        vis.svg.append('text')
            .attr('class', 'right-margin-text')
            .attr('x', vis.config.containerWidth - vis.config.margin.right + 20)
            .attr('y', 70) 
            .attr('dy', '.71em')
            .text('Description Placeholder');

        vis.svg.append('text')
            .attr('class', 'right-margin-text')
            .attr('x', vis.config.containerWidth - vis.config.margin.right + 20)
            .attr('y', 90) 
            .attr('dy', '.71em')
            .text(`Pearson's Correlation: ${vis.correlationData.get(vis.topThreeCategories[1]).toFixed(2)}`);            

        // // Add foreignObject to the right margin
        // const foreignObject = vis.svg.append('foreignObject')
        //     .attr('x', vis.config.containerWidth - vis.config.margin.right + 100)
        //     .attr('y', 20) 
        //     .attr('width', 100) 
        //     .attr('height', 30);

        // // Append a div inside the foreignObject
        // const foreignDiv = foreignObject.append('xhtml:div')
        //     .style('width', '100%')
        //     .style('height', '100%')
        //     .style('display', 'flex')
        //     .style('align-items', 'center')
        //     .style('justify-content', 'center');

        // // Add HTML content to the div
        // foreignDiv.html(`<div class="tooltip-title">2nd Most Correlated</div>
        //         <div><i>${vis.topThreeCategories[1]}</i></div>
        //         <ul>
        //             <li></li>
        //             <li></li>
        //     </ul>`);             

    }

    calculatePearsonCorrelation(data) {
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
            const dataFiltered = data.filter((d) => d.change_ses !== '' && d[category] !== '');
            const changeSesData = dataFiltered.map(d => d.change_ses)
            const categoryData = dataFiltered.map(d => d[category])
            
            const correlationCoefficient = ss.sampleCorrelation(changeSesData, categoryData)

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
