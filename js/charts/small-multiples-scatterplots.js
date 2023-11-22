let plotOne, plotTwo, plotThree;

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
        plotOne = new ScatterplotOne(
            {parentElement: '#scatterplot-one'},
            dispatcher
        );
        plotTwo = new ScatterplotTwo(
            {parentElement: '#scatterplot-two'},
            dispatcher
        );
        plotThree = new ScatterplotThree(
            {parentElement: '#scatterplot-three'},
            dispatcher
        );
    }

    updateVis() {
        let vis = this;

        plotOne.data = vis.data;
        plotOne.updateVis();

        plotTwo.data = vis.data;
        plotTwo.updateVis();

        plotThree.data = vis.data;
        plotThree.updateVis();
    }
}
