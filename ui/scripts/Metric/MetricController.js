var metricController = (function () {

    var controllerConfig = {
        metrics: [
            metrics.numberOfStatements,
            metrics.dateOfCreation,
            metrics.dateOfLastChange
        ],
        mappings: [
            mappings.color,
            mappings.colorGradient,
            mappings.transparency,
            mappings.pulsation,
            mappings.flashing,
            mappings.rotation,
        ]
    };

    var domHelper;
    
    var layerCounter = 0;
    var layers = [];

    var metricDefault = {
        variant: metrics.numberOfStatements,
        from: 0,
        to: 0
    }

    var mappingDefault = {
        variant: mappings.color,
        color: "black",
        startColor: "blue",
        endColor: "red",
        transparency: 0.5,
        period: 1000,
        scale: 2
    };


    function initialize(setupConfig) {
        application.transferConfigParams(setupConfig, controllerConfig);
    }

    function activate(rootDiv) {
        domHelper = new DomHelper();
        domHelper.buildUI(rootDiv, controllerConfig);

        addLayer(rootDiv);

        $(cssIDs.executeButton).click(executeButtonClicked);
        $(cssIDs.resetButton).click(reset);
        $(cssIDs.addLayerButton).click(() => addLayer(rootDiv));
    }

    async function executeButtonClicked(event) {
        for (let layer of layers) {
            layer.readUIData();

            await layer.getMatchingEntities();

            layer.doMapping()
        }
    }

    function addLayer(rootDiv) {
        var newLayer = new MetricLayer(++layerCounter);
        layers.push(newLayer);

        newLayer.buildUILayer(rootDiv);

        if (layerCounter > 1) {
            $(cssIDs.deleteButton + (layerCounter - 1)).jqxButton({ disabled: true });
        }
    }

    function removeLayer() {
        if (layerCounter == 1) {
            reset();
        } else {

            layers.pop().destroy();
            --layerCounter;

            //really necessary?
            layers.forEach(layer => layer.doMapping());
        }
        
        $(cssIDs.deleteButton + layerCounter).jqxButton({ disabled: false });
    }

    // Universal method to load a data from Neo4j using imported cypher-query
    async function getNeo4jData(cypherQuery) {
        const payload = {
            'statements': [
                // neo4j requires keyword "statement", so leave as is
                { 'statement': `${cypherQuery}` }
            ]
        }

        try {
            let response = await fetch('http://localhost:7474/db/data/transaction/commit', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            let data = await response.json();
            return data.results;
        } catch (error) {
            events.log.warning.publish({ text: error });
        }
    }

    function reset() {
        while (layerCounter > 1) {
            removeLayer();
        }

        layers[0].reset();
    }


    return {
        initialize: initialize,
        activate: activate,
        reset: reset,
        removeLayer: removeLayer,

        getNeo4jData: getNeo4jData,

        controllerConfig: controllerConfig,
        metricDefault: metricDefault,
        mappingDefault: mappingDefault
    }

})();