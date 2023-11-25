# D3 Project Starter Template

Notes
- This is meant for a screen size of at least 1600x900, otherwise tooltips may be cut off.
- Zoom may need to be reduced to ~75% to display all content

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

Special thanks
- StackOverflow
  - Joining groups: https://stackoverflow.com/a/68201968
- Image credits
  - Cats in intro modal: https://i.pinimg.com/736x/ea/39/fc/ea39fc7a6e6ac52ab124f0d5802d8a0b.jpg
- Colour help
  - https://coolors.co/eeeae7-031826-cfa077-30292f-5d737e
- Misc research
  - CSS visibility fade: https://greywyvern.com/337