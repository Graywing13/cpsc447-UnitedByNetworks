# D3 Project Starter Template

Notes
- This is meant for a screen size of at least 1600x900
- Zoom may need to be reduced to 50-67% to display all content

Supported Features
- Core Visualization: 
  - Dot Density map -- bidirectional linking with both sankey and small multiples scatterplot
  - Sankey -- filter data in map & scatterplots by clicking links, connected boxplots at the side for more information
  - Small multiples scatterplot -- filter scatterplots' data with slider, dynamic table to view all variables, bidirectional linking with both sankey and map
- Visualization aid: 
  - Clear Filters button -- reset sankey filters & scatterplot slider
  - Description modal -- with "Don't show again" to hide on load, and openable via help icon
  - Light/dark mode -- to aid with luminance contrast
  - Label tooltips (e.g. on Sankey's friending bias & the rankings table)

Resources
- D3 Sankey usage: 
  - Resources
    - https://observablehq.com/@d3/sankey/2?collection=@d3/d3-sankey
    - https://github.com/d3/d3-sankey#sankey_nodeSort
  - Changes
    - Data preprocessing and processing is done on our own
    - As for sankey generation, split up code into the right places (`updateVis`, `renderVis`)
      and renamed variables as needed, or to follow class conventions
    - Modified sankey configurations (`nodeSort`, `linkSort`)
- Dark mode switcher: https://dev.to/ananyaneogi/create-a-dark-light-mode-switch-with-css-variables-34l8
- Preprocess CSV:
  - Resources
    - https://stackoverflow.com/questions/54034911/how-to-use-read-and-write-stream-of-csv-parse
    - https://csv.js.org/parse/examples/stream_pipe/
  - Changes
    - Mainly only used the stream setup listed in the sites; all other logic is written by us.
- Boxplots:
  - Resources:
    - https://d3-graph-gallery.com/graph/boxplot_basic.html
  - Changes
    - Made axes on our own
    - Converted this to join()
- Drawing polygons (boxplot-sankey connectors)
  - Resources: 
    - https://stackoverflow.com/a/13204818
  - Changes
    - Created our own points generator
    - Used our own scales generator
    - Converted this to join()

Special thanks
- StackOverflow
  - Joining groups: https://stackoverflow.com/a/68201968
  - Inspiration for storing variable changes: https://stackoverflow.com/a/23411456
  - Transition transform: https://stackoverflow.com/a/35598838
- Colour help
  - https://coolors.co/eeeae7-031826-cfa077-30292f-5d737e
- Misc research
  - CSS visibility fade: https://greywyvern.com/337
  - tspan usage: https://stackoverflow.com/a/16701952, https://stackoverflow.com/a/42215609
  - Update group's child (i.e. use select() not selectAll()): https://groups.google.com/g/d3-js/c/ea_4Zr_JFM4?pli=1
