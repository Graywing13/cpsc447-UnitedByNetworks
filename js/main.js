let allData;
let dotDensityMap, sankeyChart, smallMultiplesScatterplotsWrapper

const dispatcher = d3.dispatch('completedInitialLoad', 'sankeyLinkSelected')

let isDarkMode = false
let bisliderParentSesValue = 1.74
let initialLoadCompletionCount = 0

/**
 * ==[ CONSTANTS ]======================================================================================================
 */

const TOTAL_CHART_COUNT = 5
const DO_NOT_SHOW_INTRO_MODAL_KEY = 'doNotShowIntroModal'

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
    smallMultiplesScatterplotsWrapper.maxParentSes = bisliderParentSesValue
    smallMultiplesScatterplotsWrapper.updateVis()
}

/**
 * ==[ DISPATCH HANDLERS ]==============================================================================================
 */

dispatcher.on('completedInitialLoad', _chartName => {
    // Update the amount of elements loaded
    initialLoadCompletionCount++
    d3.select('#load-percentage').text(`${initialLoadCompletionCount * 20} %`)

    // If everything is done loading, hide the loading screen
    if (initialLoadCompletionCount === TOTAL_CHART_COUNT) {
        d3.select('#loading').attr('class', 'invisible')
    }
})

dispatcher.on('sankeyLinkSelected', data => {
        const {parentSesQuartile, friendingBiasQuartile} = data
        alert(`main.js will filter for:\n- Parent SES Q${parentSesQuartile} \n- Friending Bias Q${friendingBiasQuartile}`)
    }
)

/**
 * ==[ LOAD DATA ]======================================================================================================
 */
// TODO some of these variables may not be needed
const numericalAttributes = [
    'mean_students_per_cohort',
    'ec_own_ses_college,',
    'ec_parent_ses_college',
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
    'lat',
    'lon',
    'change_ses'
]
d3.csv('data/preprocessed-social-capital-usa-colleges.csv').then(data => {
    data.forEach(d => {
        numericalAttributes.forEach((numAttr) => {
            if (d[numAttr] !== '') d[numAttr] = +d[numAttr]
        })
    })
    allData = data

    // Load US State Boundaries data
    d3.json('data/us-state-boundaries.geojson').then(function (us) {
        const stateBorders = us.features

        // Load US State Boundaries data
        d3.json('data/us-state-boundaries.geojson').then(function (us) {
            const stateBorders = us.features

            // Initialize Dot Density Map
            dotDensityMap = new DotDensityMap({
                parentElement: '#dot-density-map',
                stateBorders: stateBorders,
                collegeData: allData
            }, dispatcher)

            // Initialize Sankey
            sankeyChart = new SankeyChart(
                {parentElement: '#sankey-div'},
                dispatcher
            )

            // Initialize Small Multiples Scatterplots 
            smallMultiplesScatterplotsWrapper = new SmallMultiplesScatterplots({
                parentElement: '#small-multiples-scatterplots'
            }, dispatcher)

            updateGraphs()
        })
    })
})

/**
 * ==[ INTRO MODAL ]====================================================================================================
 */

// If the user had clicked "Don't show again", hide the intro modal on load
if (window.localStorage.getItem(DO_NOT_SHOW_INTRO_MODAL_KEY) === 'true') {
    d3.select('#intro-modal').style('visibility', 'hidden')
}

// Close intro modal when [x] pressed
d3.select('#close-intro-modal-button')
    .on('click', (_event) => {
        d3.select('#intro-modal').style('visibility', 'hidden')
    })

// Open intro modal when [?] pressed
d3.select('#open-intro-modal-button')
    .on('click', (_event) => {
        d3.select('#intro-modal').style('visibility', 'visible')
    })

// If user clicks "don't show again", hide the modal and persist this preference
d3.select('#dont-show-again')
    .on('click', (_event) => {
        d3.select('#intro-modal').style('visibility', 'hidden')
        window.localStorage.setItem(DO_NOT_SHOW_INTRO_MODAL_KEY, 'true')
    })

/**
 * ==[ OTHER LOGIC ]====================================================================================================
 */

function setupDarkModeSwitch() {
    d3.select('#dark-mode-switch')
        .select('p')
        .text(`${isDarkMode ? 'Dark' : 'Light'}`)
    d3.select('#dark-mode-switch')
        .on('click', () => {
            isDarkMode = !isDarkMode
            document.querySelector(":root").setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
            setupDarkModeSwitch()
        })
}

setupDarkModeSwitch()

d3.select('#parent-ses-slider')
    .on('input', (event) => {
        bisliderParentSesValue = event.target.value
        updateGraphs()
    })
