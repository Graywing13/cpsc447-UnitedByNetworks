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
    'change_ses'
]
d3.csv('data/social-capital-usa-colleges.csv').then(data => {
    data.forEach(d => {
        numericalAttributes.forEach((numAttr) => {
            if (d[numAttr]) d[numAttr] = +d[numAttr]
        })
    })
    allData = data
    console.log(allData[0])

    dotDensityMap = new DotDensityMap({parentElement: '#dot-density-map'}, dispatcher)
    dualDataScatterplot = new DualDataScatterplot(
        {parentElement: '#dual-data-scatterplot'},
        dispatcher
    )
    smallMultiplesScatterplotsWrapper = new SmallMultiplesScatterplots(
        {parentElement: '#small-multiples-scatterplots'},
        dispatcher
    )

    console.log('hi')

    updateGraphs()
})