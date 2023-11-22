let allData;
let dotDensityMap, dualDataScatterplot, smallMultiplesScatterplotsWrapper

const dispatcher = d3.dispatch('placeholder')

/**
 * ==[ HELPERS ]========================================================================================================
 */
// Update all graphs with new data / new filter change
function updateGraphs() {
    const filteredData = allData // TODO edit as needed

    dotDensityMap.data = filteredData
    dotDensityMap.updateVis()

    dualDataScatterplot.data = filteredData
    dualDataScatterplot.updateVis()

    smallMultiplesScatterplotsWrapper.data = filteredData
    smallMultiplesScatterplotsWrapper.updateVis()
}

/**
 * ==[ DISPATCH HANDLERS ]==============================================================================================
 */
// TODO delete placeholder
dispatcher.on('placeholder', str => {
    console.log(`${str} called dispatch`)
})

/**
 * ==[ LOAD DATA ]======================================================================================================
 */
const numericalAttributes = [
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
    'volunteering_rate_college',
    'ec_parent_ses_college_quartile',
    'bias_own_ses_college_quartile',
    'change_ses'
]
d3.csv('data/preprocessed-social-capital-usa-colleges.csv').then(data => {
    data.forEach(d => {
        numericalAttributes.forEach((numAttr) => {
            if (d[numAttr]) d[numAttr] = +d[numAttr]
        })
    })
    allData = data
    console.log(allData[0])

    // Load US State Boundaries data
    d3.json('data/us-state-boundaries.geojson').then(function (us) {
        const stateBorders = us.features

        // Initialize Dot Density Map
        dotDensityMap = new DotDensityMap({
            parentElement: '#dot-density-map',
            stateBorders: stateBorders,
            collegeData: allData
        }, dispatcher)

        // Initialize Dual Data Scatterplot
        dualDataScatterplot = new DualDataScatterplot({
            parentElement: '#dual-data-scatterplot'
        }, dispatcher)
        
         // Initialize Small Multiples Scatterplots 
        smallMultiplesScatterplotsWrapper = new SmallMultiplesScatterplots({
            parentElement: '#small-multiples-scatterplots'
        }, dispatcher)

        updateGraphs()
    })
})