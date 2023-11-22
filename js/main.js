let allData;
let dotDensityMap, sankeyChart, smallMultiplesScatterplotsWrapper

const dispatcher = d3.dispatch('placeholder', 'sankeyLinkSelected')

let isDarkMode = false

/**
 * ==[ HELPERS ]========================================================================================================
 */
// Update all graphs with new data / new filter change
function updateGraphs() {
    const filteredData = allData // TODO edit as needed

    dotDensityMap.data = filteredData
    dotDensityMap.updateVis()

    sankeyChart.data = filteredData
    sankeyChart.updateVis()

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

dispatcher.on('sankeyLinkSelected', data => {
        const {parentSesQuartile, friendingBiasQuartile} = data
        alert(`main.js will filter for:\n- Parent SES Q${parentSesQuartile} \n- Friending Bias Q${friendingBiasQuartile}`)
    }
)

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

    dotDensityMap = new DotDensityMap({parentElement: '#dot-density-map'}, dispatcher)
    sankeyChart = new SankeyChart(
        {parentElement: '#sankey-div'},
        dispatcher
    )
    smallMultiplesScatterplotsWrapper = new SmallMultiplesScatterplots(
        {parentElement: '#small-multiples-scatterplots'},
        dispatcher
    )

    console.log('hi')

    updateGraphs()
})

/**
 * ==[ OTHER LOGIC ]====================================================================================================
 */

function setupDarkModeSwitch() {
    d3.select('#dark-mode-switch')
        .text(`Switch to ${isDarkMode ? 'light' : 'dark'} mode`)
        .on('click', () => {
            isDarkMode = !isDarkMode
            document.querySelector(":root").setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
            setupDarkModeSwitch()
        })
}

setupDarkModeSwitch()
