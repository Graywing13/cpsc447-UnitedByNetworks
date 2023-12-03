let plotOne, plotTwo, plotThree;

const categoriesOfInterest = [
    'mean_students_per_cohort',
    'ec_own_ses_college',
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

const categoryNameAndDescription = new Map([
    ['mean_students_per_cohort',
        ['# students per cohort (10000s)',
            'Average number of students per cohort, measured by 10000s']],
    ['ec_own_ses_college',
        ['Low SES x high SES friendships',
            'How often low-SES students are friends with high-SES students (a higher value indicates more friendships with high-SES students)']],
    ['ec_high_parent_ses_college',
        ['Frequency of students from high-SES families being friends',
            'How often students from high-SES families are friends with other students also from high-SES families (a higher value indicates more friendships with other students of similar high-SES families)']],
    ['exposure_own_ses_college',
        ['Low SES x high SES contact rate',
            'Measure of how often low SES students have contact with high SES students (a higher value indicates that students with low SES are interacting more with students with high SES)']],
    ['exposure_parent_ses_college',
        ['Low family SES x high family SES contact rate',
            'Measure of how often students from families of low SES have contact with students from families of high SES (a higher value indicates that students from lower SES families are interacting more with students from higher SES families)']],
    ['bias_own_ses_college',
        ['Likelihood of befriending peers with same SES',
            'Student tendency to be friends with other students who have a similar SES (i.e a higher bias indicates that students are more likely to be friends with other students of similar economic backgrounds)']],
    ['bias_parent_ses_college',
        ['Likelihood of befriending peers with same family SES',
            'Student tendency to be friends with other students who have parents with similar SES (i.e a higher bias indicates that students are more likely to be friends with other students from families with similar economic backgrounds)']],
    ['bias_high_own_ses_college',
        ['Likelihood of befriending peers with high SES',
            'Student tendency to befriend other students with high-SES (a higher bias indicates that students are more likely to be friends with other students of high economic backgrounds)']],
    ['bias_high_parent_ses_college',
        ['Likelihood of befriending peers from high SES families',
            'Students of high-SES families tendency to befriend other students who also have high-SES families (a higher bias indicates that students with families from higher economic backgrounds are more likely to befriend other students also from high-SES families)']],
    ['clustering_college',
        ['Friend cluster formation',
            'The fraction of a student\'s individual friends that are also friends with each other']],
    ['support_ratio_college',
        ['% mutual friends',
            'The proportion of friendship pairs that share another mutual friend within the same college']],
    ['volunteering_rate_college',
        ['Student volunteering rate',
            'The percentage of Facebook users who are members of a group which is predicted to be about volunteering or activism based on group title and other group characteristics']]
]);

class SmallMultiplesScatterplots {
    constructor(_config, dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 550,
            containerHeight: _config.containerHeight || 450,
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
        plotOne = new SingleScatterplot(
            {
                parentElement: '#scatterplot-one',
                plotIndex: 0,
                backgroundColor: 'rgba(255, 193, 0, 0.5)',
                circleClassName: 'point-one'
            },
            dispatcher
        );

        plotTwo = new SingleScatterplot(
            {
                parentElement: '#scatterplot-two',
                plotIndex: 1,
                backgroundColor: 'rgba(190, 190, 190, 0.65)',
                circleClassName: 'point-two'
            },
            dispatcher
        )

        plotThree = new SingleScatterplot(
            {
                parentElement: '#scatterplot-three',
                plotIndex: 2,
                backgroundColor: 'rgba(207, 128, 10, 0.6)',
                circleClassName: 'point-three'
            },
            dispatcher
        )
    }

    updateVis() {
        let vis = this;

        // Figure out correlation (if it exists)
        vis.correlationData = vis.calculatePearsonCorrelation(vis.data);
        vis.topCategories = vis.getTopCategories(vis.correlationData);
        vis.topThreeCategories = vis.topCategories.slice(0, 3).map(entry => entry && entry[0]);

        plotOne.data = vis.data;
        plotOne.maxParentSes = vis.maxParentSes;
        plotOne.correlationData = vis.correlationData;
        plotOne.topThreeCategories = vis.topThreeCategories;
        plotOne.updateVis();

        plotTwo.data = vis.data;
        plotTwo.maxParentSes = vis.maxParentSes;
        plotTwo.correlationData = vis.correlationData;
        plotTwo.topThreeCategories = vis.topThreeCategories;
        plotTwo.updateVis();

        plotThree.data = vis.data;
        plotThree.maxParentSes = vis.maxParentSes;
        plotThree.correlationData = vis.correlationData;
        plotThree.topThreeCategories = vis.topThreeCategories;
        plotThree.updateVis();
    }

    calculatePearsonCorrelation(data) {
        let vis = this
        let correlationCoefficients = new Map();

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

    getTopCategories(categoryData) {
        let categories = Array.from(categoryData.entries());

        categories.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

        return categories;
    }
}
