/**
 * ==[ CONSTANTS ]======================================================================================================
 */

const TOTAL_CHART_COUNT = 5
const DO_NOT_SHOW_INTRO_MODAL_KEY = 'doNotShowIntroModal'
const USE_THEME_KEY = 'useTheme'
const MAX_BISLIDER_VALUE = 1.74

/**
 * ==[ VARIABLES ]======================================================================================================
 */

let allData;
let dotDensityMap, sankeyChart, smallMultiplesScatterplotsWrapper;

const dispatcher = d3.dispatch('completedInitialLoad', 'filterData')

let isDarkMode = false
let bisliderParentSesValue = MAX_BISLIDER_VALUE
let initialLoadCompletionCount = 0

// The selected college's data (a processed data object that contains all attributes)
let selectedCollege = null
// Filters that are applied by sankey and affects the other views
let dataFilters = {
    parentSesQuartile: null,
    friendingBiasQuartile: null
}
let filteredData;

/**
 * ==[ HELPERS ]========================================================================================================
 */

function updateGraphs() {
    // Update with data
    dotDensityMap.collegeData = filteredData
    dotDensityMap.updateVis()

    // Sankey always displays all data, but the opacity of the marks change
    sankeyChart.data = allData
    sankeyChart.dataFilters = dataFilters
    sankeyChart.selectedCollege = selectedCollege
    sankeyChart.updateVis()

    // Update all graphs with new data, or with new filter change
    smallMultiplesScatterplotsWrapper.data = filteredData
    smallMultiplesScatterplotsWrapper.maxParentSes = bisliderParentSesValue
    smallMultiplesScatterplotsWrapper.updateVis()
}

/**
 * ==[ DISPATCH HANDLERS ]==============================================================================================
 */

// Handler that is called whenever a chart has finished rendering
dispatcher.on('completedInitialLoad', _chartName => {
    // Update the amount of elements loaded
    initialLoadCompletionCount++
    d3.select('#load-percentage').text(`${initialLoadCompletionCount * 20} %`)

    // If everything is done loading, hide the loading screen
    if (initialLoadCompletionCount === TOTAL_CHART_COUNT) {
        d3.select('#loading').attr('class', 'invisible')
    }
})

// Applies filters when sankey links/nodes is selected
dispatcher.on('filterData', newDataFilters => {
    const parentSesIsEqual = dataFilters.parentSesQuartile === newDataFilters.parentSesQuartile
    const friendingBiasIsEqual = dataFilters.friendingBiasQuartile === newDataFilters.friendingBiasQuartile
    
    if (parentSesIsEqual && friendingBiasIsEqual) {
        // if the filters are the same, that means a selected node was deselected; reset filters
        dataFilters = {parentSesQuartile: null, friendingBiasQuartile: null}
    } else {
        // otherwise, set the new filter
        dataFilters = newDataFilters
    }
    
    // filter data
    const {parentSesQuartile, friendingBiasQuartile} = dataFilters
    filteredData = allData.filter((d) => {
        return (!parentSesQuartile || d.ec_parent_ses_college_quartile === parentSesQuartile)
            && (!friendingBiasQuartile || d.bias_own_ses_college_quartile === friendingBiasQuartile)
    })
    
    updateGraphs()
})

/**
 * ==[ LOAD DATA ]======================================================================================================
 */

// Attributes used in the site (most are used in the small multiples scatterplots)
const numericalAttributes = [
    'mean_students_per_cohort',
    'ec_own_ses_college',
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

// Load and process data
d3.csv('data/preprocessed-social-capital-usa-colleges.csv').then(data => {
    data.forEach(d => {
        numericalAttributes.forEach((numAttr) => {
            if (d[numAttr] !== '') d[numAttr] = +d[numAttr]
        })
    })
    allData = data
    filteredData = allData // since data is not filtered initially

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

            // Update data of graphs, and call updateVis()
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

// Make switch display right text, append click listener
function setupDarkModeSwitch() {
    d3.select('#dark-mode-switch')
        .select('p')
        .text(`${isDarkMode ? 'Dark' : 'Light'}`)
    d3.select('#dark-mode-switch')
        .on('click', () => {
            isDarkMode = !isDarkMode
            const newMode = isDarkMode ? 'dark' : 'light'
            document.querySelector(":root").setAttribute('data-theme', newMode);
            window.localStorage.setItem(USE_THEME_KEY, newMode)
            setupDarkModeSwitch()
        })
}

// Initialize theme & switch's text
if (window.localStorage.getItem(USE_THEME_KEY) === 'dark') {
    isDarkMode = true
    document.querySelector(":root").setAttribute('data-theme', 'dark');
}
setupDarkModeSwitch()

d3.select('#parent-ses-slider')
    .on('input', (event) => {
        bisliderParentSesValue = event.target.value
        updateGraphs()
    })

// Reset values, sliders, and data when clear filters button is clicked
d3.select('#clear-filters')
    .on('click', (_event) => {
        dataFilters = {parentSesQuartile: null, friendingBiasQuartile: null}
        bisliderParentSesValue = MAX_BISLIDER_VALUE
        document.getElementById('parent-ses-slider').value = MAX_BISLIDER_VALUE
        
        filteredData = allData
        updateGraphs()
    })
