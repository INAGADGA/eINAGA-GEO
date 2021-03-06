var _timer;
var geomGoogle, geomINAGA;
var map, tb, coordx, coordy, geom, url;
var coordConsulta;  
var textoDescarga = "";
var textoParcelas = ""; 
var textoParcelasDesglosado = ""; 
var contadorParcelas = 0;
var listcoor = []; var orden = 0;
var loading; var edicion = false; var medicion = false;
var visible = [];
var visibleFiguras = [];
var prefijo, nomCapa,  ultpos = 0;
var prefijoParce = "Catastro_Parcela_";
var campoRefpar = "REFPAR";
var geomBuffer;
var stringGeoJson;
var myVar;
var valores;
var contadorConsultas = 0;
var mitracking = ""; var contadorTrack = 0;
var coordsTracking = [];
var track;        
var watchID;
var geometryProyectada;        
var directorioAlmacenamiento = "";

require([
    "dojo/dom",
    "dojo/dom-style",
    "dojo/_base/array",
    "dojo/_base/connect",
    "dojo/parser",
    "dojo/query",
    "dojo/on",
    "dojo/dom-construct",

    "esri/Color",
    "esri/config",
    "esri/map",
    "esri/graphic",
    "esri/units",
    "esri/InfoTemplate",
    "esri/dijit/PopupMobile",

    "esri/toolbars/draw",

    "esri/geometry/Circle",
    "esri/geometry/normalizeUtils",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/geometryEngine",
    "esri/geometry/jsonUtils",
    "esri/tasks/GeometryService",
    "esri/tasks/BufferParameters",
    "esri/tasks/query",

    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",

    "esri/dijit/Measurement",
    "esri/dijit/OverviewMap",
    "esri/dijit/BasemapGallery",
    "esri/dijit/Basemap",
    "esri/dijit/BasemapLayer",

    "esri/dijit/Scalebar",
    "esri/dijit/Search",
    "esri/dijit/HomeButton",
    "esri/dijit/Legend",
    "esri/dijit/LocateButton",

    "esri/layers/FeatureLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/WMSLayer",
    "esri/layers/WMSLayerInfo",
    "esri/layers/LabelClass",
    "esri/renderers/SimpleRenderer"

], function (dom, domStyle, array, connect, parser, query, on, domConstruct, Color, esriConfig, Map, Graphic, Units, InfoTemplate, PopupMobile, Draw, Circle, normalizeUtils, webMercatorUtils, geometryEngine, jsonUtils, GeometryService, BufferParameters, Query, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol,
    Font, Measurement, OverviewMap, BasemapGallery, Basemap, BasemapLayer, Scalebar, Search, HomeButton, Legend, LocateButton, FeatureLayer, ArcGISDynamicMapServiceLayer, WMSLayer, WMSLayerInfo,
    LabelClass, SimpleRenderer
){
                
        parser.parse();

        if (cordova.platformId === 'ios') {
            directorioAlmacenamiento = "Download"; //"documents"; //cordova.file.documentsDirectory; // ;                   
        }
        else {
            directorioAlmacenamiento = "Download";
        }
                
        var popup = new PopupMobile(null, domConstruct.create("div"));

        var customExtentAndSR = new esri.geometry.Extent(-300000, 4840000, 120000, 5280000, new esri.SpatialReference({ wkid: 3857 })); 
        // variables capa de busqueda del servicio a consultar  ------------------------------------------------------------------------------------------------------------------------------
        var tituloVisor = "<center><b><font color='white'>eINAGA-GEO</font></b></center>"
        dom.byId("tituloVisor").innerHTML = tituloVisor;


        //  otras variables -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        var d = new Date();
        var fecha = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        var fecha2 = d.getFullYear() + "" + ("00" + (d.getMonth() + 1)).slice(-2) + "" + ("00" + (d.getDate())).slice(-2);
        var symbolTrack = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_DIAMOND, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([0, 255, 0, 1]));
        var symbolParcelas = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([255, 255, 255]), 2), new Color([0, 0, 255, 0.25]));
        var symbolPunto = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([255, 255, 0, 0.25]));
        //var symbolOVC = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 1), new Color([0, 0, 58, 0.85]));
        var symbolLine = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2);
        var symbolPoligono = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2), new Color([255, 0, 0, 0.25]));

        var gsvc = new esri.tasks.GeometryService("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
        esriConfig.defaults.geometryService = gsvc;
        esriConfig.defaults.io.alwaysUseProxy = false;
        var basemaps = [];
        var layer2 = new esri.dijit.BasemapLayer({ url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" });
        layer2.opacity = 0.0;
        var basemap2 = new esri.dijit.Basemap({ layers: [layer2], title: "Blanco", thumbnailUrl: "" });

        // incicializar mapa -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        map = new Map("map", {
            basemap: "satellite", 
            infoWindow: popup,
            extent: customExtentAndSR
        });
                
        map.disableKeyboardNavigation();
        map.addLayer(new esri.layers.GraphicsLayer({ "id": "Analisis" }));
        map.addLayer(new esri.layers.GraphicsLayer({ "id": "Buffer" }));
        map.addLayer(new esri.layers.GraphicsLayer({ "id": "Parcelas" }));
        map.addLayer(new esri.layers.GraphicsLayer({ "id": "Tracking" }));


        // widgets -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // widget medicion
        var measurement = new Measurement({
            map: map,
            defaultAreaUnit: esri.Units.SQUARE_METERS,
            defaultLengthUnit: esri.Units.METERS
        }, dom.byId("measurementDiv")
        );
        measurement.startup();
        // widget geolocate
        var geoLocate = new LocateButton({ map: map }, "LocateButton");
        geoLocate.startup();
                
        // widget overview
        var overviewMapDijit = new OverviewMap({
            map: map,
            attachTo: "bottom-right",
            expandFactor: 3,
            height: 200,
            width: 200,
            color: " #D84E13",
            visible: false,
            opacity: .40
        });
        overviewMapDijit.startup();
                
        // widget basemap
        // cargamnos los mapas base
        var oceano = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer' });
        var oceanoEtiqueta = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer' });
        // topo item for gallery
        var oceanoBasemap = new Basemap({
            layers: [oceano, oceanoEtiqueta],
            id: 'oceanos',
            title: 'Océanos',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/f9498c1f95714efabb626125cb2bb04a/info/thumbnail/tempoceans.jpg'
        });
        // terreno etiquetas

        var terreno = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer' });
        var terrenoEtiqueta = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer' });
        // topo item for gallery
        var terrenoBasemap = new Basemap({
            layers: [terreno, terrenoEtiqueta],
            id: 'terreno',
            title: 'Terreno Etiquetas',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/532c8cc75f414ddebc5d665ba00015ca/info/thumbnail/terrain_labels.jpg'
        });

        //topo map
        var topoLayer = new BasemapLayer({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer' });
        // topo item for gallery
        var topoBasemap = new Basemap({
            layers: [topoLayer],
            id: 'topo',
            title: 'Topográfico',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/6e03e8c26aad4b9c92a87c1063ddb0e3/info/thumbnail/topo_map_2.jpg'
        });

        //dark grey
        var dkGreyLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer' });
        var dkGreyLabelsLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Transportation/MapServer' });
        var dkGreyBasemap = new Basemap({
            layers: [dkGreyLayer, dkGreyLabelsLayer],
            id: 'dkGrey',
            title: 'Lona Gris Oscuro',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/a284a9b99b3446a3910d4144a50990f6/info/thumbnail/ago_downloaded.jpg'
        });

        //light grey
        var ltGreyLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer' });
        var ltGreyLabelsLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer' });
        var ltGreyBasemap = new Basemap({
            layers: [ltGreyLayer, ltGreyLabelsLayer],
            id: 'ltGrey',
            title: 'Lona Gris Claro',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/8b3d38c0819547faa83f7b7aca80bd76/info/thumbnail/light_canvas.jpg'
        });
        // imagenes
        var imagenes = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer' });
        var etiquetas = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer' });
        var imagenBasemap = new Basemap({
            layers: [imagenes, etiquetas],
            id: 'images',
            title: 'Imágenes con etiquetas',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/3027a41ed46d4a9b915590d14fecafc0/info/thumbnail/imagery_labels.jpg'
        });
        // clarity
        var clarity = new BasemapLayer({ url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer' });
        var clarityBasemap = new Basemap({
            layers: [clarity, etiquetas],
            id: 'clarity',
            title: 'clarity world',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/da10cf4ba254469caf8016cd66369157/info/thumbnail/imagery_clarity_sm.jpg'
        });

        // NACIONAL GEOGRAPIC
        var natGeo = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/NatGeo_World_Map/MapServer' });
        var natGeoBasemap = new Basemap({
            layers: [natGeo],
            id: 'natgeo',
            title: 'Nacional Geographic',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/7ec6f7c55cf6478596435f2d501834fa/info/thumbnail/natgeo.jpg'
        });

        // open street map
        var street1 = new BasemapLayer({
            type: "WebTiledLayer", url: "https://tile.openstreetmap.org/${level}/${col}/${row}.png"
        });

        var streetBasemap = new Basemap({
            layers: [street1],
            id: 'street',
            title: 'Open Street Map',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/d415dff75dd042258ceda46f7252ad70/info/thumbnail/temposm.jpg'
        });
        // widget basemap
        var basemapGallery = new BasemapGallery({
            showArcGISBasemaps: false,
            map: map,
            basemaps: [topoBasemap, dkGreyBasemap, ltGreyBasemap, imagenBasemap, clarityBasemap, natGeoBasemap, streetBasemap, terrenoBasemap, oceanoBasemap]
        }, 'basemapGallery');

        basemapGallery.startup();
        basemapGallery.on("error", function (msg) {
            //console.log("basemap gallery error:  ", msg);
        });
        basemapGallery.add(basemap2);

                
        // widget home
        var home = new HomeButton({
            map: map
        }, "HomeButton");
        home.startup();
        //Eventos -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        on(dom.byId("posicion"), "click", function () {
            getPosition();
        });

        tb = new esri.toolbars.Draw(map);

        query(".tool").on("click", function (evt) {
            reseteaMedicion();
            var g = map.getLayer("Analisis");
            g.clear();
            geomGoogle = undefined;
            map.getLayer("Buffer").clear();
            map.getLayer("Tracking").clear();
            $("#checkbox-1").prop('checked', false).checkboxradio("refresh");

            if (evt.target.id.substring(0, 4) != "rec_") {
                map.graphics.clear();
                if (map.getScale() < 25000) {
                    if (tb) {
                        tb.activate(evt.target.id);
                        map.setInfoWindowOnClick(false);
                        $("#myPanel").panel("close");
                        edicion = true;
                    }
                }
                else {
                    tb.deactivate();
                    showMessage("Debe acercarse hasta una escala menor de 25.000 para digitalizar");
                }
            }
        });

        //add the legend
        map.on("layers-add-result", function (evt) {
            var layerInfo = array.map(evt.layers, function (layer, index) {
                return { layer: layer.layer, title: layer.layer.name };
            });
            if (layerInfo.length > 0) {
                var legendDijit = new Legend({
                    map: map,
                    layerInfos: layerInfo
                }, "legendDiv");
                legendDijit.startup();
            }
        });
        map.on("click", function (evt) {
            $(".esriMobileInfoView").css("display", "none");
            if (!edicion && measurement.activeTool === null && !track) {
                if (dom.byId("myonoffswitch").checked) {
                    map.setInfoWindowOnClick(false);
                    geomGoogle = evt.mapPoint;                            
                    var outSR = new esri.SpatialReference(25830);
                    var params = new esri.tasks.ProjectParameters();
                    params.geometries = [evt.mapPoint]; 
                    params.outSR = outSR;
                    var pt;
                    var newurl = "";
                    gsvc.project(params, function (projectedPoints) {
                        pt = projectedPoints[0];
                        geometryProyectada = pt;
                        var urlCat = "http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?&REQUEST=GetFeatureInfo&VERSION=1.1.1&SRS=EPSG%3A25830&BBOX=" + pt.x + "," + pt.y + "," + (pt.x + 1) + "," + (pt.y + 1) + "&WIDTH=" + map.width + "&HEIGHT=" + map.height + "&X=" + evt.layerX + "&Y=" + evt.offsetY;
                        popup.setContent('<iframe style="float:left; height:30em; width:100%" src=' + urlCat + ' frameborder="0" scrolling="yes"></iframe>');
                        popup.setTitle("Información catastral");
                        // dibujar y zoom a coordenada
                        replaceGraphic("Analisis", geomGoogle, symbolPunto, true);
                        actualizaCoordTextBox(geomGoogle, geometryProyectada, false);
                        // cerrar ventana datos
                        $(".esriMobileInfoView").css("display", "inline-block");
                        $(".esriMobileNavigationBar").css("display", "inline-block");
                                
                    });
                }
                else if (dom.byId("consultaParcelas").checked) {
                    map.setInfoWindowOnClick(false);
                    dameParcela(evt.mapPoint);
                }
                else {
                    map.infoWindow.resize(280, 300);
                }
            }
            coordx = evt.mapPoint.x.toFixed(2).replace('.', ',');
            coordy = evt.mapPoint.y.toFixed(2).replace('.', ',');
        });
        map.on("zoom-end", function () {
            $("#escala").text("Escala 1:" + map.getScale().toFixed(0));
        });

        map.on("update-end", function () {
            map.setMapCursor("default");
            domStyle.set(dom.byId("procesando"), "display", "none");
            $("#escala").text("Escala 1:" + map.getScale().toFixed(0));
        });
        map.on("update-start", function () {
            map.setMapCursor("wait");
            domStyle.set(dom.byId("procesando"), "display", "inline-block");
            $("#popupNested").popup("close");
        });
                


        $(document).ready(function () {

            $("#checkCatastro").click(function () {
                cambiaVisibilidad("OVC");
            });
            $("#checkSigpac").click(function () {
                cambiaVisibilidad("SIGPAC");
            });
            $("#checkLimites").click(function () {
                cambiaVisibilidad("Limites");
            });
            $("#checkCotos").click(function () {
                cambiaVisibilidad("Cotos");
            });
            $("#checkMontes").click(function () {
                cambiaVisibilidad("Montes");
            });
            $("#checkVVPP").click(function () {
                cambiaVisibilidad("VVPP");
            });
            $("#checkGranjas").click(function () {
                cambiaVisibilidad("Granjas");
            });
            $("#checkRaster").click(function () {
                cambiaVisibilidad("IGN");
            });
            $("#checkboxhmd").click(function () {
                if ($('#checkboxhmd').is(":checked")) { visibleFiguras.push("0") }
                else { quitaValoresVisibilidad("0"); }
                dynamicMSLayerFPA.setVisibleLayers(visibleFiguras);
            });
            $("#checkboxlics").click(function () {
                if ($('#checkboxlics').is(":checked")) { visibleFiguras.push("1") }
                else { quitaValoresVisibilidad("1"); }
                dynamicMSLayerFPA.setVisibleLayers(visibleFiguras);
            });
            $("#checkboxzepas").click(function () {
                if ($('#checkboxzepas').is(":checked")) { visibleFiguras.push("2") }
                else { quitaValoresVisibilidad("2"); }
                dynamicMSLayerFPA.setVisibleLayers(visibleFiguras);
            });
            $("#checkboxlig").click(function () {
                if ($('#checkboxlig').is(":checked")) { visibleFiguras.push("3") }
                else { quitaValoresVisibilidad("3"); }
                dynamicMSLayerFPA.setVisibleLayers(visibleFiguras);
            });
            $("#checkboxenp").click(function () {
                if ($('#checkboxenp').is(":checked")) { visibleFiguras.push("4") }
                else { quitaValoresVisibilidad("4"); }
                dynamicMSLayerFPA.setVisibleLayers(visibleFiguras);
            });
            $("#checkboxporn").click(function () {
                if ($('#checkboxporn').is(":checked")) { visibleFiguras.push("5") }
                else { quitaValoresVisibilidad("5"); }
                dynamicMSLayerFPA.setVisibleLayers(visibleFiguras);
            });
            $("#checkboxacrit").click(function () {
                if ($('#checkboxacrit').is(":checked")) { visibleFiguras.push("6") }
                else { quitaValoresVisibilidad("6"); }
                dynamicMSLayerFPA.setVisibleLayers(visibleFiguras);
            });
            $("#checkboxappe").click(function () {
                if ($('#checkboxappe').is(":checked")) { visibleFiguras.push("7") }
                else { quitaValoresVisibilidad("7"); }
                dynamicMSLayerFPA.setVisibleLayers(visibleFiguras);
            });
            $("#myonoffswitch").change(function () {
                cambiaVisibilidadOVC();
            });
            $("#consultaParcelas").change(function () {
                toogleVisibilidadOvcSigpac();
            });
        });

        on(dom.byId("clearGraphicsM"), "click", function () {
            if (map) {
                reseteaMedicion();
            }
        });

        map.on("load", initToolbar);
        measurement.on("measure-end", function (evt) {
            if (evt.toolName == "location") {
                var outSR = new esri.SpatialReference(25830);
                var params = new esri.tasks.ProjectParameters();
                params.geometries = [evt.geometry]; //[pt.normalize()];
                params.outSR = outSR;
                var pt;
                gsvc.project(params, function (projectedPoints) {
                    pt = projectedPoints[0];
                    coordx = pt.x.toFixed(0);
                    coordy = pt.y.toFixed(0);
                    dom.byId("etrs").innerHTML = "<hr /><b>Coordenada ETRS89 30N</br><table style='width:100%'><tr><th>X</th><th>Y</th></tr><tr><td>" + pt.x.toFixed(0) + "</td><td>" + pt.y.toFixed(0) + "</td></tr></table><hr />";
                });
            }
            $("#myPanel").panel("open");
            medicion = false;
        });
        measurement.on("tool-change", function (evt) {
            map.setInfoWindowOnClick(false); dom.byId("etrs").innerHTML = "";
            $("#myPanel").panel("close");
            medicion = true;
        });
            
        on(dom.byId("localizaCoord"), "click", function () {
            var _point = new esri.geometry.Point(Number(dom.byId("CoordX").value.replace(',', '.')), Number(dom.byId("CoordY").value.replace(',', '.')), new esri.SpatialReference({ wkid: 25830 }));
            dameGeom4326Analisis(_point, true);
        });

        on(dom.byId("convierteCoord"), "click", function () {
            var _point = new esri.geometry.Point(Number(dom.byId("Longitud").value.replace(',', '.')), Number(dom.byId("Latitud").value.replace(',', '.')), new esri.SpatialReference({ wkid: 4326 }));
            dameGeomEtrs89Analisis(_point,true);                    
        });

        popup.on("selection-change", function () {
            graphico = popup.getSelectedFeature();
        });
        popup.on("hide", function () {
            $(".esriMobileInfoView").css("display", "none");
        });

        on(dom.byId("analisisDistancias"), "click", function () {
            // Comprobar si la geometría es de líneas por si han incluido un track que no pasa por el filtro de longitud al ser creado
            if (geomGoogle != undefined && geomGoogle.type == "polyline") {
                var long = geometryEngine.geodesicLength(geometryEngine.simplify(geomGoogle), "meters");
                if (long > 5000) {
                    showMessage("La longitud de la geomtría es de " + (Math.round(long * 100) / 100) + " y debe ser menor de 5.000 m");
                    return;
                }
            }
            // Comprobar la distancia del análisis
            var distancia = $("#km").val();
            if (geomGoogle === undefined) { showMessage("Debe de dibujar la localización antes de realizar el análisis"); }
            else if (distancia === undefined || distancia < 10) { showMessage("La distancia del análisis debe ser superior a 10 m"); }
            else if (distancia > 5000) { showMessage("La distancia de análisis debe ser menor de 5.000 m"); }
            else
                doBuffer(geomGoogle);
        });
        on(dom.byId("descargaGeom"), "click", function () {
            if (stringGeoJson === undefined) { showMessage("Debe de dibujar la localización antes de descargarla"); }
            else {
                generarTextoFromGeom(geometryProyectada, prefijo + dameFechaHora() + '.txt');
                writeToFile(prefijo + dameFechaHora() + '.geojson', stringGeoJson);
            }
        });                
        $("#abreFichero").click(function (e) {
            var t = document.getElementById("fichero");
            var selFile = t.options[t.selectedIndex].text;
            readFile(selFile);
        });

        on(dom.byId("descarga"), "click", function () {
            generaTextoDescarga("INF_" + dameFechaHora() + '.pdf')
        });

        on(dom.byId("descargaParcelas"), "click", function () {
            writeToFile(prefijoParce + dameFechaHora() + '.txt', textoParcelasDesglosado);
        });
        on(dom.byId("limpiaParcelas"), "click", function () {
            var g = map.getLayer("Parcelas");
            g.clear();
            textoParcelasDesglosado = "";
            textoParcelas = "";
            dom.byId("ArrayParcelas").innerHTML = "";
            contadorParcelas = 0;
            dom.byId("ParcelasSel").innerHTML = "";
        });
        on(dom.byId("select-choice-1"), "change", function () {
            if (dom.byId("consultaParcelas").checked) {
                var x = document.getElementById("select-choice-1").value;
                if (textoParcelasDesglosado.length > 0) {
                    showMessage("Para cambiar de tipo de parcesa es necesario que borre la selección actual");
                }
                else {
                    if (x === "01") {
                        prefijoParce = "Catastro_Parcela_";
                        campoRefpar = "REFPAR";
                    }
                    else if (x === "02") {
                        prefijoParce = "Catastro_Subparcela_";
                        campoRefpar = "REFPAR_SUBP";
                    }
                    else {
                        prefijoParce = "Sigpac_";
                        campoRefpar = "REFREC";
                    }
                    toogleVisibilidadOvcSigpac();
                }
            }
        });

        on(dom.byId("select-choice-1"), "click", function () {
            if (textoParcelasDesglosado.length > 0) {
                showMessage("Para cambiar de tipo de parcesa es necesario que borre la selección actual");
                return;
            }
        });

                
        const buttonStart = document.getElementById('tracking_start');
        const buttonStop = document.getElementById('tracking_stop');
        buttonStart.addEventListener('click', iniciaTracking);
        buttonStop.addEventListener('click', finalizaTracking);

        //Funciones -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        function dameFechaHora() {
            var local = new Date();
            var localdatetime = fecha2 + ("00" + (local.getHours())).slice(-2) + ("00" + (local.getMinutes())).slice(-2) + ("00" + (local.getSeconds())).slice(-2);
            return localdatetime;
        }
        function iniciaTracking() {
            map.setInfoWindowOnClick(false);
            var numero = 30000; //$("#intervalo").val() * 10000;
            track = true;
            mitracking = "";
            contadorTrack = 0;
            map.getLayer("Tracking").clear();
            getTrack(numero);
        }
        function finalizaTracking() {
            map.setInfoWindowOnClick(true);
            track = false;
            dom.byId("gps").innerHTML = "";
            navigator.geolocation.clearWatch(watchID);
            var singlePathPolyline = new esri.geometry.Polyline([coordsTracking]);
            guardaTracking(singlePathPolyline, "track_" + dameFechaHora() + ".txt");
        }
        function cambiaVisibilidadOVC() {
            var x = document.getElementById("select-choice-1").value;
            if (dom.byId("myonoffswitch").checked) {
                $("#checkCatastro").prop('checked', true).checkboxradio("refresh");
                setVisible("OVC");
            }
            else if (x === "03" || !dom.byId("consultaParcelas").checked) {
                $("#checkCatastro").prop('checked', false).checkboxradio("refresh");
                setInVisible("OVC");
            }
        };
        function toogleVisibilidadOvcSigpac() {
            var x = document.getElementById("select-choice-1").value;
            if (x == "01" || x == "02") {
                $("#checkCatastro").prop('checked', true).checkboxradio('refresh');
                setVisible("OVC");
                $("#checkSigpac").prop('checked', false).checkboxradio('refresh');
                setInVisible("SIGPAC");
            }
            else {
                $("#checkSigpac").prop('checked', true).checkboxradio("refresh");
                setVisible("SIGPAC");
                $("#checkCatastro").prop('checked', false).checkboxradio("refresh");
                setInVisible("OVC");
            }
        }
        function dameParcela() {
            try {
                var query = new Query();
                query.geometry = arguments[0];
                query.outFields = ["*"];
                var dropd = $("#select-choice-1").find('option:selected').val();
                if (dropd === "01") {
                    nomCapa = "{0} Parcelas Seleccionadas";
                    fc_parce.queryFeatures(query, dameParce);
                }
                else if (dropd === "02") {
                    nomCapa = "{0} Subparcelas Seleccionadas";
                    fc_subparce.queryFeatures(query, dameParce);
                }
                else {
                    nomCapa = "{0} Recintos Seleccionados";
                    fc_recintos.queryFeatures(query, dameParce);
                }
            }
            catch (ex) {
                showMessage(ex);
            }
        }
        function showMessage(message) {
            dom.byId("dialogoPop").innerHTML = message;
            $("#popupDialog").popup('open');
        }
        function quitaValoresVisibilidad(pos) {
            capas = [];
            esta = false;
            for (index = 0; index < visibleFiguras.length; index++) {
                if (visibleFiguras[index] != pos) { capas.push(visibleFiguras[index]); }
            }
            visibleFiguras = capas;
        };
        function reseteaMedicion() {
            measurement.clearResult();
            measurement.setTool("area", false);
            measurement.setTool("distance", false);
            measurement.setTool("location", false);
            map.setInfoWindowOnClick(true);
        }
                
        function actualizaGeometriaDigitalizada(evtObj) {
            var geom = evtObj.geometry;
            switch (geom.type) {
                case "point":
                    break;
                case "polyline":
                    var long = geometryEngine.geodesicLength(geometryEngine.simplify(evtObj.geometry), "meters");
                    if (long > 5000) {
                        showMessage("No se pueden realizar análisis con líneas de más de 5 Km");
                        return;
                    }
                    break;
                case "polygon":
                    geom.removePoint(0, geom.rings[0].length - 2);
                    var area = geometryEngine.geodesicArea(geometryEngine.simplify(geom), "hectares");
                    if (geom.isSelfIntersecting(geom)) {
                        showMessage("El perímetro del polígono intersecta consigo mismo");
                        return;
                    }
                    if (area > 500) {
                        showMessage("No se pueden realizar análisis con polígonos de más de 500 Ha");
                        return;
                    }
                    break;
            }
            dameGeomEtrs89Analisis(geom, false);
            edicion = false;
        }
                                
        function dameGeomEtrs89Analisis(geom, abrirPanel) {
            //map.graphics.clear();
            map.getLayer("Buffer").clear();
            map.getLayer("Tracking").clear();
            var outSR = new esri.SpatialReference(25830);
            var params = new esri.tasks.ProjectParameters();
            geomGoogle = geom;
            params.geometries = [geomGoogle]; //[pt.normalize()];
            params.outSR = outSR;
            var newurl = "";
            gsvc.project(params, function (rtdos) {
                geometryProyectada = rtdos[0];
                console.log(geometryProyectada);
                var symbol;
                switch (geometryProyectada.type) {
                    case "point":
                        prefijo = "pnt_";
                        symbol = symbolPunto; 
                        actualizaCoordTextBox(geomGoogle, geometryProyectada, abrirPanel);
                        break;
                    case "polyline":
                        prefijo = "lin_";
                        symbol = symbolLine; 
                        break;
                    case "polygon":
                        prefijo = "pol_";
                        symbol = symbolPoligono; 
                        break;
                }
                replaceGraphic("Analisis", geomGoogle, symbol, true);
                map.getLayer("Buffer").clear();
                map.getLayer("Tracking").clear();
                map.graphics.clear();
                var feature = L.esri.Util.arcgisToGeoJSON(geometryProyectada, "FID");
                stringGeoJson = JSON.stringify(feature);
                tb.deactivate();
                map.setInfoWindowOnClick(true);
                $("#myPanel").panel("open");
                        
            });
        }
        function dameGeom4326Analisis(geom, abrirPanel) {
            map.getLayer("Buffer").clear();
            map.getLayer("Tracking").clear();
            map.graphics.clear();
            geometryProyectada  = geom;
            var feature = L.esri.Util.arcgisToGeoJSON(geometryProyectada , "FID");
            stringGeoJson = JSON.stringify(feature);
            var outSR = new esri.SpatialReference(4326);
            var params = new esri.tasks.ProjectParameters();                    
            params.geometries = [geom]; //[pt.normalize()];
            params.outSR = outSR;
            var newurl = "";
            gsvc.project(params, function (rtdos) {
                geomGoogle = rtdos[0];
                var symbol;
                switch (geomGoogle.type) {
                    case "point":
                        prefijo = "pnt_";
                        symbol = symbolPunto;
                        actualizaCoordTextBox(geomGoogle, geometryProyectada, abrirPanel);
                        break;
                    case "polyline":
                        prefijo = "lin_";
                        symbol = symbolLine;
                        break;
                    case "polygon":
                        prefijo = "pol_";
                        symbol = symbolPoligono;
                        break;
                }
                replaceGraphic("Analisis", geomGoogle, symbol, true);
                map.graphics.clear();                        
                tb.deactivate();
                map.setInfoWindowOnClick(true);
                if (abrirPanel) { $("#myPanel").panel("open"); }
            });
        }
                
        function doBuffer() {
            var distancia = $("#km").val();
            map.getLayer("Buffer").clear();                    
            map.graphics.clear();
            map.setInfoWindowOnClick(true);
            tb.deactivate();
            var geometry = geomGoogle;
            var params = new BufferParameters();
            params.distances = [distancia];
            params.outSpatialReference = map.spatialReference;
            params.unit = [esri.tasks.GeometryService.UNIT_METER];
            params.geodesic = true;
            // normaliza la geometria               
            normalizeUtils.normalizeCentralMeridian([geometry]).then(function (normalizedGeometries) {
                var normalizedGeometry = normalizedGeometries[0];
                if (normalizedGeometry.type === "polygon") {
                    esriConfig.defaults.geometryService.simplify([normalizedGeometry], function (geometries) {
                        params.geometries = geometries;
                        esriConfig.defaults.geometryService.buffer(params, showBuffer);
                    });
                } else {
                    params.geometries = [normalizedGeometry];
                    esriConfig.defaults.geometryService.buffer(params, showBuffer);
                }
            });
        }
        function showBuffer(b) {
            var sym = new esri.symbol.SimpleFillSymbol();
            sym.setColor(null);
            sym.setOutline(new esri.symbol.SimpleLineSymbol("solid", new dojo.Color([255, 0, 0, 1]), 2));
            addGraphic("Buffer", b[0], sym, true);
            dameInf();
        }
        function addGraphicCapa(capa, geom, zoom) {
            geomGoogle = geom;
            var attrs = { "Geometria": "Análisis" };
            var template, g, s;
            template = new esri.InfoTemplate("", "Type: ${type}");
            g = map.getLayer(capa);
            g.clear();
            var symbol;
            switch (geom.type) {
                case "point":
                    symbol = symbolPunto;
                    break;
                case "polyline":
                    symbol = symbolLine; 
                    break;
                case "polygon":
                    symbol = symbolPoligono; 
                    break;
            }
            g.add(new esri.Graphic(geom, symbol, attrs, template));
            if (zoom) {
                if (g.graphics.length > 0) {
                    if (geom.type === "point") {
                        map.centerAndZoom(geom, 18);
                    }
                    else {
                        map.setExtent(esri.graphicsExtent([g.graphics[g.graphics.length - 1]]).expand(1.4), true);
                    }
                }
            }
        }
        function replaceGraphic(capa, geom, sym, zoom) {
            var attrs = { "Geometría": capa };
            var template, g, s;
            template = new esri.InfoTemplate("", "Type: ${type}");
            g = map.getLayer(capa);
            g.clear();
            g.add(new esri.Graphic(geom, sym, attrs, template));
            if (zoom) {
                if (g.graphics.length > 0) {
                    if (geom.type === "point") {
                        map.centerAndZoom(geom, 17);
                    }
                    else {
                        map.setExtent(esri.graphicsExtent([g.graphics[g.graphics.length - 1]]).expand(1.4), true);
                    }
                }
            }
        }
        function addGraphic(capa, geom, sym, zoom) {
            var attrs = { "Geometría": capa };
            var template, g, s;
            geomBuffer = geom;
            template = new esri.InfoTemplate("", "Type: ${type}");
            g = map.getLayer(capa);
            g.add(new esri.Graphic(geom, sym, attrs, template));
            if (zoom) {
                if (g.graphics.length > 0) {
                    if (geom.type === "point") {
                        map.centerAndZoom(geom, 18);
                    }
                    else {
                        map.setExtent(esri.graphicsExtent([g.graphics[g.graphics.length - 1]]).expand(1.4), true);
                    }                            
                }
            }
        }
        function addGraphicTrack(capa, geom, sym, zoom) {
            var attrs = { "type": capa };
            var template, g, s;
            template = new esri.InfoTemplate("", "Type: ${type}");
            g = map.getLayer(capa);
            g.add(new esri.Graphic(geom, sym, attrs, template));
            if (!map.extent.contains(geom)) {
                var zoomMapa = map.getZoom();
                map.centerAndZoom(geom, zoomMapa);
            }
        }


        function dameInf() {
            distancia = $("#km").val();
            dom.byId("listadoRtdos").innerHTML = "";
            dom.byId("resultadoImpacto").innerHTML = "";
            map.setInfoWindowOnClick(true);
            tb.deactivate();

            var query = new Query();
            query.geometry = geomBuffer;
            query.outFields = ["*"];
            //query.where = "";
            query.distance = distancia;
            query.units = "Meters";
            Granjas = "";
            textoDescarga = "";
            consultaDistancias = "<b>Fecha: " + fecha + "</b><hr/>";  // + Granjas;
            dom.byId("listadoRtdos").innerHTML = consultaDistancias;
            consultaDistancias += "<h4 style=\"color:red;\">Entidades a menos de " + distancia + " m</h4>" + Granjas;
            contadorConsultas = 0;
            try {
                if ($('#checkCotos').is(":checked")) {
                    contadorConsultas++;
                    fc_cotos.queryFeatures(query, dameCotos);
                } if ($('#checkMontes').is(":checked")) {
                    contadorConsultas++;
                    fc_montes.queryFeatures(query, dameMontes);
                } if ($('#checkVVPP').is(":checked")) {
                    contadorConsultas++;
                    fc_vvpp.queryFeatures(query, dameVVPP);
                } if ($('#checkGranjas').is(":checked")) {
                    contadorConsultas++;
                    contadorConsultas++;
                    contadorConsultas++;
                    fc_granjasRega.queryFeatures(query, dameGranjasRega);
                    fc_granjasTram.queryFeatures(query, dameGranjasTrami);
                    fc_granjasReso.queryFeatures(query, dameGranjasReso);
                } if ($('#checkboxhmd').is(":checked")) {
                    contadorConsultas++;
                    fc_humedales.queryFeatures(query, dameHumedales);
                } if ($('#checkboxlics').is(":checked")) {
                    contadorConsultas++;
                    fc_lics.queryFeatures(query, dameLics);
                } if ($('#checkboxzepas').is(":checked")) {
                    contadorConsultas++;
                    fc_zepas.queryFeatures(query, dameZepas);
                } if ($('#checkboxlig').is(":checked")) {
                    contadorConsultas++;
                    fc_ligs.queryFeatures(query, dameLigs);
                } if ($('#checkboxenp').is(":checked")) {
                    contadorConsultas++;
                    fc_enp.queryFeatures(query, dameEnp);
                } if ($('#checkboxporn').is(":checked")) {
                    contadorConsultas++;
                    fc_porn.queryFeatures(query, damePorn);
                } if ($('#checkboxacrit').is(":checked")) {
                    contadorConsultas++;
                    fc_acrit.queryFeatures(query, dameAcrit);
                } if ($('#checkboxappe').is(":checked")) {
                    contadorConsultas++;
                    fc_appe.queryFeatures(query, dameAppe);
                }
            }
            catch (ex) {
                showMessage(err.message);
            }
            if (contadorConsultas > 0) {
                visible("loadingDistancias", 1);
                $("#myPanel").panel("close");
                $("#myPanelRtdo").panel("open");
            }
            else {
                showMessage("Debes seleccionar alguna capa de análisis");
                $("#collapCapasAnalisis").collapsible("expand");
            }
        }
        function dameCotos(response) {
            obtieneDatosConsulta(response, "Terrenos Cinegéticos", "Cotos");
            semaforoResta();
        }
        function dameMontes(response) {
            obtieneDatosConsulta(response, "Montes", "Montes");
            semaforoResta();
        }
        function dameVVPP(response) {
            obtieneDatosConsulta(response, "Vías Pecuarias", "VVPP");
            semaforoResta();
        }
        function dameGranjasRega(response) {
            obtieneDatosConsulta(response, "Granjas REGA", "Granjas");
            semaforoResta();
        }
        function dameGranjasTrami(response) {
            obtieneDatosConsulta(response, "Granjas Tramitación", "Granjas");
            semaforoResta();
        }
        function dameGranjasReso(response) {
            obtieneDatosConsulta(response, "Granjas Resolución", "Granjas");
            semaforoResta();
        }
        function dameHumedales(response) {
            obtieneDatosConsulta(response, "Humedales", "Humedales");
            semaforoResta();
        }
        function dameLics(response) {
            obtieneDatosConsulta(response, "LICS", "LICS");
            semaforoResta();
        }
        function dameZepas(response) {
            obtieneDatosConsulta(response, "Zepas", "Zepas");
            semaforoResta();
        }
        function dameLigs(response) {
            obtieneDatosConsulta(response, "LIG", "Ligs");
            semaforoResta();
        }
        function dameEnp(response) {
            obtieneDatosConsulta(response, "ENP", "ENP");
            semaforoResta();
        }
        function damePorn(response) {
            obtieneDatosConsulta(response, "PORN", "PORN");
            semaforoResta();
        }
        function dameAcrit(response) {
            obtieneDatosConsulta(response, "ACRIT", "ACRIT");
            semaforoResta();
        }
        function dameAppe(response) {
            obtieneDatosConsulta(response, "APPE", "APPE");
            semaforoResta();
        }
        function semaforoResta() {
            --contadorConsultas;
            if (contadorConsultas === 0) {
                visible("loadingDistancias", 0);
            }
        }
        function dameParce(response) {
            var features = response.features;
            if (features.length === 0) { return; }
            var dropd = $("#select-choice-1").find('option:selected').val();
            var valor = features[0].attributes[campoRefpar];
            if (textoParcelas.indexOf(valor) == -1) {
                dom.byId("ArrayParcelas").innerHTML += "</p>" + valor;
                contadorParcelas++;
                dom.byId("ParcelasSel").innerHTML = nomCapa.format(contadorParcelas);
                if (dropd === "01") {
                    textoParcelasDesglosado += "\r" +
                        features[0].attributes["DELEGACIO"] + "\t" +
                        features[0].attributes["MUNAGR"] + "\t" +
                        features[0].attributes["MASA"] + "\t" +
                        features[0].attributes["PARCELA"];
                }
                else if (dropd === "02") {
                    textoParcelasDesglosado += "\r" +
                        features[0].attributes["DELEGACIO"] + "\t" +
                        features[0].attributes["MUNAGR"] + "\t" +
                        features[0].attributes["MASA"] + "\t" +
                        features[0].attributes["PARCELA"] + "\t" +
                        features[0].attributes["SUBPARCE"];
                }
                else {
                    textoParcelasDesglosado += "\r" +
                        features[0].attributes["PROVINCIA"] + "\t" +
                        features[0].attributes["AGREGADO"] + "\t" +
                        features[0].attributes["POLIGONO"] + "\t" +
                        features[0].attributes["PARCELA"] + "\t" +
                        features[0].attributes["RECINTO"];
                }
                textoParcelas += ";" + valor;
                activaAnimacion();
                addGraphic("Parcelas", features[0].geometry, symbolParcelas, false);
            }
            else {
                showMessage("Ya está seleccionada");
            }
        }
        function obtieneDatosConsulta(response, texto, texto2) {
            textoDescarga += "<table><h2>" + texto + "</h2>";
            textoDescarga += "<thead><tr>";
            var contador = obtieneDatosRtdo(response);
            var Afeccion = "";
            if (contador == 0) { Afeccion += "<b>" + texto + ":</b><span style='color:blue;font-weight:bold'> (" + contador + ")</span><br>"; }
            else { Afeccion += "<b>" + texto + ":</b><span style='color:red; font-weight:bold'> (" + contador + ")</span><br>"; }

            consultaDistancias += Afeccion;
            dom.byId("listadoRtdos").innerHTML = consultaDistancias;
        }

        function obtieneDatosRtdo(response) {

            var features = response.features;
            for (var property in response.fieldAliases) {
                if (property != "OBJECTID") {
                    textoDescarga += "<td><strong>" + property + "</strong></td>";
                }
            }
            var contador = 0;
            textoDescarga += "</tr></thead>";
            for (var x = 0; x < features.length; x++) {
                var intersecta = geometryEngine.intersects(features[x].geometry, geomBuffer);
                if (intersecta) {
                    getTextContent(features[x]);
                    contador++;
                }
            }
            textoDescarga += "</table>";
            if (contador === 0) {
                textoDescarga += "No se han localizado";
            }
            return contador;
        }
        function getTextContent(graphic) {
            var attr = graphic.attributes;
            var contador = 0;
            textoDescarga += "<tr>";
            contador = 0;
            for (var property in attr) {
                if (property != "OBJECTID") {
                    if ((graphic._layer.fields[contador].type) === "esriFieldTypeDate") {
                        textoDescarga += "<td><strong>" + new Date(parseInt(attr[property])).toLocaleDateString() + "</strong></td>";
                    }
                    else {
                        textoDescarga += "<td><strong>" + attr[property] + "</strong></td>";
                    }
                }
                contador++;
            }
            textoDescarga += "</tr>";
            return textoDescarga;
        }
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        };

        function readFile(fileName) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                fs.root.getFile(directorioAlmacenamiento + "/" + fileName, { create: true, exclusive: false }, function (fileEntry) {
                    fileEntry.file(gotFile, fail);
                }, onErrorReadFile);
            }, onErrorLoadFs);
        }
        function writeToFile(fileName, data) {                    
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                    fs.root.getFile(directorioAlmacenamiento + "/" + fileName, { create: true, exclusive: false }, function (fileEntry) {
                        writeFile(fileEntry, data);
                    }, onErrorCreateFile);
                }, onErrorLoadFs);                    
        }
        function gotFile(file) {
            readAsText(file);
        }
        function fail(error) {
            showMessage(error.code);
        }
        function readAsText(file) {
            var reader = new FileReader();
            reader.onloadend = function (evt) {
                AddCapaTxt(evt.target.result);
            };
            reader.readAsText(file);
        }
        function AddCapaTxt(listadoCoord) {
            try {
                var coordsTracking = [];
                listadoCoord = listadoCoord.replace(/\n|\r|\t/g, " ");
                var coordsFichero = listadoCoord.split(" ");
                for (x = 0; x < coordsFichero.length; x++) {
                    if (coordsFichero[x].trim() == "") {
                        coordsFichero.splice(x, 1);
                    }
                }
                for (x = 0; x < coordsFichero.length; x++) {
                }
                for (x = 0; x < coordsFichero.length - 2; x++) {
                    coordsTracking.push([coordsFichero[x + 1], coordsFichero[x + 2]]);
                    x = x + 2;
                }
                var geomEtrs89;
                var t = document.getElementById("fichero");
                var selFile = t.options[t.selectedIndex].text.substring(0, 4);
                switch (selFile) {
                    case "pnt_":
                        geomEtrs89 = new esri.geometry.Point(coordsTracking[0][0], coordsTracking[0][1], new esri.SpatialReference({ wkid: 25830 }));
                        break;
                    case "lin_":
                    case "trac":
                        geomEtrs89 = new esri.geometry.Polyline([coordsTracking]);
                        break;
                    case "pol_":
                        geomEtrs89 = new esri.geometry.Polygon([coordsTracking]);
                        break;
                }
                geomEtrs89.setSpatialReference(new esri.SpatialReference({ wkid: 25830 }));
                projectToWGS84(geomEtrs89, true);
            }
            catch (err) {
                showMessage(err.message);
            }
        }
        function projectToWGS84(geometry, pintar) {
            try {
                var outSR = new esri.SpatialReference(3857);
                var params = new esri.tasks.ProjectParameters();
                params.geometries = [geometry];
                params.outSR = outSR;
                var pt;
                gsvc.project(params, function (projectedPoints) {
                    pt = projectedPoints[0];
                    if (pintar) {
                        addGraphicCapa("Analisis", pt, true);;
                    }
                });
            }
            catch (err) {
                showMessage(err.message);
            }

        }
        function getFiles() {                                                          
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                    fs.root.getDirectory(directorioAlmacenamiento, { create: true }, function (dirEntry) {
                        var directoryReader = dirEntry.createReader();
                        directoryReader.readEntries(onSuccessReadDir, onErrorReadDir);
                    }, onErrorReadDir);
                }, onErrorLoadFs);                   
        }

        function onErrorLoadFs(error) {
            showMessage('onErrorLoadFs: code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        }
        function onErrorCreateFile(error) {
            showMessage('onErrorCreateFile: code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        }
        function onErrorReadFile(error) {
            showMessage('onErrorReadFile: code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        }
        function onErrorReadDir(error) {
            showMessage('onErrorReadDir: code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        }
        function onSuccessReadDir(entries) {
            var myarray = [];
            var myJSON = "";
            $('#fichero').empty();
            for (var i = 0; i < entries.length; i++) {
                var nameFile = entries[i].name;
                if (extension(nameFile) && checkName(nameFile)) {
                    $('#fichero').append('<option value=' + i + '>' + entries[i].name + ' </option>');
                }
            }
            $('#fichero').selectmenu("refresh", true);
        }
        function extension(element) {
            var extensiones = ['txt']; //, 'geojson'];
            var ext = element.split('.').pop();
            for (x = 0; x < extensiones.length; x++) {
                if (ext == extensiones[x]) {
                    return true;
                }
            }
            return false;
        };
        function checkName(name) {
            var prefijos = ['track_', 'pnt_', 'pol_', 'lin_'];
            var resultado = false;
            for (x = 0; x < prefijos.length; x++) {
                var numero = name.indexOf(prefijos[x]);
                if (numero == 0) {
                    return true;
                }
            }
            return false;
        }
        function writeFile(fileEntry, dataObj) {
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function () {                    
                    getFiles();
                    showMessage("Almacenado en " + fileEntry.fullPath);
                };

                fileWriter.onerror = function (e) {
                    alert("Falla el guardado: " + e.toString());
                    showMessage("Falla el guardado: " + e.toString());
                };

                var blob = new Blob([dataObj], { type: 'text/plain' });
                fileWriter.write(blob);
            });
        }
                
        var errorHandler = function (fileName, e) {
            var msg = '';

            switch (e.code) {
                case FileError.QUOTA_EXCEEDED_ERR:
                    msg = 'Storage quota exceeded';
                    break;
                case FileError.NOT_FOUND_ERR:
                    msg = 'File not found';
                    break;
                case FileError.SECURITY_ERR:
                    msg = 'Security error';
                    break;
                case FileError.INVALID_MODIFICATION_ERR:
                    msg = 'Invalid modification';
                    break;
                case FileError.INVALID_STATE_ERR:
                    msg = 'Invalid state';
                    break;
                default:
                    msg = 'Unknown error';
                    break;
            };

            showMessage('Error (' + fileName + '): ' + msg);
        }

        function visible(id, flag) {
            if (flag == 1) {
                document.getElementById(id).style.visibility = 'visible';
            }
            else if (flag == 0) {
                document.getElementById(id).style.visibility = 'hidden';
            }
        }
        function addPoint4326(geometry) {
            map.graphics.clear();
            var attrs, sym;
            attrs = { "type": "Analisis" };
            symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([0, 255, 0, 0.25]));
            var graphic = new Graphic(geometry, symbol);
            map.graphics.add(graphic);
            map.centerAndZoom(graphic.geometry, 18);
        }

        fTemplate = function locate() {
            if (graphico !== undefined) {
                var extension = graphico.geometry.getExtent();
                if (!extension) {
                    map.centerAndZoom(popup.getSelectedFeature().geometry, 15);
                } else {
                    map.setExtent(graphico.geometry.getExtent(), true);
                }
                // cerrar ventana datos
                $(".esriMobileInfoView").css("display", "none");
                $(".esriMobileNavigationBar").css("display", "none");
            }
        };

        function cambiaVisibilidad(nombre) {
            var targetLayer = map.getLayer(nombre);
            if (targetLayer.visible) {
                targetLayer.setVisibility(false);
            }
            else { targetLayer.setVisibility(true); }
        }

        function setVisible(nombre) {
            var targetLayer = map.getLayer(nombre);
            if (!targetLayer.visible) {
                targetLayer.setVisibility(true);
            }
        }
        function setInVisible(nombre) {
            var targetLayer = map.getLayer(nombre);
            if (targetLayer.visible) {
                targetLayer.setVisibility(false);
            }
        }

        function generaTextoDescarga(nombre) {
            'use strict';
            var cuerpo = "<html><head><title>Análisis de Distancias</title><style>body { font-family: arial, sans-serif}; table{ border-collapse: collapse;width: 100%;}td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;}thead{background-color: #A9BCF5;}</style></head><body><h1>Instituto Aragonés de Gestión Ambiental</h1><h2>Aplicación eINAGA-GEO. Consulta de afecciones</h2><hr><h3>Informe sin carácter vinculante para la Administración</h3><b>Fecha: " + fecha
                + "</b><br><b>Distancia análisis: " + distancia + " m</b>"
                + textoDescarga
                + "<br><hr><br><b>Geometría de consulta en geojson (SRS 25830): </b>" + stringGeoJson
                + "</body></html>";

            let options = { documentSize: 'A4', type: 'share', fileName: nombre };

            //pdf.fromData(cuerpo, options)
            //    .then((stats) => console.log('status', stats); ) // ok..., ok if it was able to handle the file to the OS.
            //    .catch((err) => console.err(err); );

                pdf.fromData(cuerpo, options)
                    .then(function (stats) { console.log(stats); },
                            function (err) { console.log(err); }); 
                       
        }
        function initToolbar(evtObj) {
            tb = new esri.toolbars.Draw(evtObj.map);
            tb.on("draw-end", actualizaGeometriaDigitalizada);
        }

        function showCoordinates(evt) {  
            dom.byId("info").innerHTML = "<b>UTM ETRS89 Huso 30N<br/>x:" + evt.mapPoint.x.toFixed(0) + " y:" + evt.mapPoint.y.toFixed(0) + "</b> <hr/>Escala: 1:" + Math.round(map.getScale(), 0).toLocaleString('de-DE') + "</br></br>";
        }

        function getGET() {
            // capturamos la url
            var loc = document.location.href;
            // si existe el interrogante
            if (loc.indexOf('?') > 0) {
                // cogemos la parte de la url que hay despues del interrogante
                var getString = loc.split('?')[1];
                // obtenemos un array con cada clave=valor
                var GET = getString.split('&');
                var get = {};
                // recorremos todo el array de valores
                for (var i = 0, l = GET.length; i < l; i++) {
                    var pos = GET[i].indexOf('=');
                    var longitud = GET[i].length;
                    var mikey = GET[i].substring(0, pos);
                    var miVal = GET[i].substring(pos + 1, longitud);
                    var tmp = GET[i].split('=');
                    get[mikey] = unescape(decodeURI(miVal));
                }
                return get;
            }
        }
        function guardaTracking(geom, nombreFichero) {
            var outSR = new esri.SpatialReference(25830);
            var params = new esri.tasks.ProjectParameters();
            var geomGoogle = geom;
            params.geometries = [geomGoogle];
            params.outSR = outSR;
            var geometry;
            var newurl = "";
            gsvc.project(params, function (rtdos) {
                geometry = rtdos[0];
                var i = 0;
                if (geometry.paths.length > 0) {
                    for (i = 0; i < geometry.paths[0].length; i++) {
                        var vertice = geometry.getPoint(0, i);
                        mitracking += contadorTrack++ + "\t" + vertice.x + "\t" + vertice.y + "\r\n";
                    }
                    writeToFile(nombreFichero, mitracking);
                }
                else {
                    showMessage("No se ha podido generar el track");
                }
            });
        }
                
        function onSuccess(position) {
            var miposicion = new esri.geometry.Point;
            miposicion.x = position.coords.longitude;
            miposicion.y = position.coords.latitude;
            var altitud = position.coords.altitude;
            var Accuracy = position.coords.accuracy;
            var AltitudeAccuracy = position.coords.altitudeAccuracy;
            var Heading = position.coords.heading;
            var Speed = position.coords.speed;
            var Timestamp = position.timestamp;

            if (track) {
                if (dom.byId("checkGPSprecision").checked) {
                    if (Accuracy < dom.byId("Precision").value) {
                        coordsTracking.push([miposicion.x, miposicion.y]);
                        addGraphicTrack("Tracking", miposicion, symbolTrack, true);
                        document.getElementById("gps").style.color = "white";
                    }
                    else {
                        document.getElementById("gps").style.color = "red";
                    }
                }
                else {
                    coordsTracking.push([miposicion.x, miposicion.y]);
                    addGraphicTrack("Tracking", miposicion, symbolTrack, true);
                    document.getElementById("gps").style.color = "white";
                }
                dom.byId("gps").innerHTML =
                    "Precisión: " + Accuracy + " m </p>" +
                    "Long: " + miposicion.x + "</p>" +
                    "Lat: " + miposicion.y; 
            }
            else {
                dameGeomEtrs89Analisis(miposicion, true);
            }
        };

        function onError(error) {
            dom.byId("gps").innerHTML = "Sin señal GPS";
        }

        function getTrack(numero) {                    
            watchID = navigator.geolocation.watchPosition(onSuccess, onError, { timeout: 120000, enableHighAccuracy: true, maximumAge: numero });
        }

        function getPosition() {
            var options = {
                enableHighAccuracy: true
            }
            var watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, options);                   
        }

        function projectToEtrs89(geometry) {
            var outSR = new esri.SpatialReference(25830);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [geometry]; 
            params.outSR = outSR;
            var pt;
            gsvc.project(params, function (projectedPoints) {
                pt = projectedPoints[0];
                actualizaCoordTextBox(geometry,pt, true);
            });

        }
        function actualizaCoordTextBox(pt,ptEtrs,abrirPanel) {
            coordx = ptEtrs.x.toFixed(0);
            coordy = ptEtrs.y.toFixed(0);
            dom.byId("etrs").innerHTML = "<hr /><b>Coordenada en ETRS89 30N</br><table style='width:100%'><tr><th>X</th><th>Y</th></tr><tr><td>" + coordx + "</td><td>" + coordy + "</td></tr></table><hr />";
            dom.byId("CoordX").value = coordx;
            dom.byId("CoordY").value = coordy;
            dom.byId("Longitud").value = pt.getLongitude().toFixed(8);
            dom.byId("Latitud").value = pt.getLatitude().toFixed(8);; 
            if (abrirPanel) {                
                $("#myPanel").panel("open");
                $("#collapCoord").collapsible("expand");
                $("#collapCoordETRS").collapsible("expand");
                $("#collapCoordGEO").collapsible("expand");
            }
        }
                
        function zoomToCoord(x, y) {
            var _point = new esri.geometry.Point(x, y, new esri.SpatialReference({ wkid: 25830 }));
            var outSR = new esri.SpatialReference(4326);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [_point]; 
            params.outSR = outSR;
            var pt;
            gsvc.project(params, function (projectedPoints) {
                pt = projectedPoints[0];
                addPoint(pt);
                map.centerAndZoom(pt, 18);
            });
        }

        function listDir(path) {
            window.resolveLocalFileSystemURL(path,
                function (fileSystem) {
                    var reader = fileSystem.createReader();
                    reader.readEntries(
                        function (entries) {
                            console.log(entries);
                        },
                        function (err) {
                            console.log(err);
                        }
                    );
                }, function (err) {
                    console.log(err);
                }
            );
        }

        function generarTextoFromGeom(migeometry,nombre) {
            console.log('inicia proceso guardado ********************************************************************************');
            var texto = "";
            var tipogeom = esri.geometry.getJsonType(migeometry);
            i = 1;
            if (tipogeom == "esriGeometryPolygon") {
                for (x = 0; x < migeometry.rings.length; x++) {
                    for (z = 0; z < migeometry.rings[x].length; z++) {
                        texto += i++ + '\t' + migeometry.rings[x][z][0].toFixed(2) + '\t' + migeometry.rings[x][z][1].toFixed(2) + "\r";
                    }
                }
            }
            else if (tipogeom == "esriGeometryPolyline") {
                for (x = 0; x < migeometry.paths.length; x++) {
                    for (z = 0; z < migeometry.paths[x].length; z++) {
                        texto += i++ + '\t' + migeometry.paths[x][z][0].toFixed(2) + '\t' + migeometry.paths[x][z][1].toFixed(2) + "\r";
                    }
                }
            }
            else { texto += i++ + '\t' + migeometry.x.toFixed(2) + '\t' + migeometry.y.toFixed(2); }

            writeToFile(nombre, texto);                                        
        };

        function showLoading() {
            domStyle.set(dom.byId("loading"), "display", "inline-block");
        }
        function hideLoading() {
            domStyle.set(dom.byId("loading"), "display", "none");
        }
        function OpenInNewTab(url) {
            var win = window.open(url);
            win.focus();
        }

        function activaAnimacion() {
            var elm = document.querySelector("#ParcelasSel");
            var newone = elm.cloneNode(true);
            elm.parentNode.replaceChild(newone, elm);
        }
                
        // Capas necesarias para las búsquedas-------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // create a text symbol to define the style of labels               
        var fc_cotos = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Cotos_Caza/MapServer/2");  
        var fc_montes = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_CMA/MapServer/5");  
        var fc_vvpp = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_CMA/MapServer/6");  
        var fc_humedales = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/0");  
        var fc_lics = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/1");  
        var fc_zepas = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/2");  
        var fc_ligs = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/3");  
        var fc_enp = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/4");  
        var fc_porn = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/5");  
        var fc_acrit = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/6");  
        var fc_appe = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/7");  
        var fc_parce = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/5");  
        var fc_subparce = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/6");  
        var fc_recintos = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/8");
        var fc_granjasRega = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Explotaciones_G/MapServer/0");
        var fc_granjasTram = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Explotaciones_G/MapServer/1");
        var fc_granjasReso = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Explotaciones_G/MapServer/2");

                
        // busquedas -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        var s = new Search({
            enableButtonMode: true,
            enableLabel: false,
            enableInfoWindow: true,
            showInfoWindowOnSelect: true,
            enableSuggestions: true,
            enableSuggestionsMenu: true,
            map: map
        }, "search");
        var sources = [
            {
                featureLayer: new esri.layers.FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/3"),
                searchFields: ["D_MUNI_INE"],
                displayField: "D_MUNI_INE",
                exactMatch: false,
                name: "Municipios",
                outFields: ["*"],
                placeholder: " ",
                maxResults: 6,
                maxSuggestions: 6,
                enableSuggestions: true,
                minCharacters: 0
            }, {
                featureLayer: new esri.layers.FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/5"),
                searchFields: ["REFPAR"],
                displayField: "REFPAR",
                exactMatch: true,
                name: "Parcelas Catastrales",
                outFields: ["*"],
                placeholder: "14 primeros dígitos de REFPAR",
                maxResults: 6,
                maxSuggestions: 6,
                enableSuggestions: true,
                minCharacters: 0
            }, {
                featureLayer: new esri.layers.FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/7"),
                searchFields: ["REFPAR"],
                displayField: "REFPAR",
                exactMatch: true,
                name: "Parcelas Sigpac",
                outFields: ["*"],
                placeholder: " ",
                maxResults: 6,
                maxSuggestions: 6,
                enableSuggestions: true,
                minCharacters: 0
            }, {
                locator: new esri.tasks.Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
                singleLineFieldName: "SingleLine",
                name: "Geocoding Service",
                localSearchOptions: {
                    minScale: 300000,
                    distance: 50000
                },
                placeholder: "Search Geocoder",
                maxResults: 3,
                maxSuggestions: 6,
                enableSuggestions: false,
                minCharacters: 0
            }]

        s.set("sources", sources);
        s.sources[0].searchExtent = customExtentAndSR;
        s.sources[1].searchExtent = customExtentAndSR;
        s.startup();

        // capas
        var resourceInfo2 = {
            extent: customExtentAndSR, 
            layerInfos: []
        };

        function getInfotemplate(titulo, campos) {
            campos += '<div id="divlocalizar"> ' +
                '<input type="button" value="Acercar "  id="locate"  title="Centrar Mapa" alt="Centrar Mapa" class = "localizacion" onclick="  fTemplate(); "/></div>';
            return new esri.InfoTemplate(titulo, campos);
        }

        var dynamicMSLayerMontes = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_CMA/MapServer", {
            id: "Montes",
            outFields: ["*"]
        });
        dynamicMSLayerMontes.setVisibility(false);
        dynamicMSLayerMontes.setInfoTemplates({                    
            4: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Montes", "<h3>Montes:</h3><b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}")) },
            5: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Montes Gen", "<h3>Montes:</h3><b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${DENOMINACION}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${TIPO}")) },
            6: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Vías Pecuarias", "<h3>Vías Pecuarias:</h3><b>Municipio:</b> ${MUNICIPIO}<br><b>Nombre:</b> ${NOMBRE_VIA}<br><b>Tipo:</b> ${DTIPVIA}")) }
        });
        dynamicMSLayerMontes.setVisibleLayers([4,5]);
        dynamicMSLayerMontes.setImageFormat("png32", true);

        var dynamicMSLayerVVPP = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_CMA/MapServer", {
            id: "VVPP",
            outFields: ["*"],                    
            visible: false,
            infoTemplates : {
                6: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Vías Pecuarias", "<h3>Vías Pecuarias:</h3><b>Municipio:</b> ${MUNICIPIO}<br><b>Nombre:</b> ${NOMBRE_VIA}<br><b>Tipo:</b> ${DTIPVIA}")) }
            }
        });
        dynamicMSLayerVVPP.setVisibleLayers([6]);
        dynamicMSLayerVVPP.setImageFormat("png32", true);

        var dynamicMSLayerGranjas = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Explotaciones_Ganaderas/MapServer", {
            id: "Granjas",
            outFields: ["*"],                    
            visible: false,
            infoTemplates : {
                0: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Granja REGA", "<h3>Granja REGA:</h3><b>Codigo:</b> ${CODIGO}<br><b>Explotacion:</b> ${EXPLOTACION}<br><b>Especie:</b> ${ESPECIE}<br><b>Familia:</b> ${FAMILIA}")) },
                1: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Granja Tramitación", "<h3>Granja Tramitación:</h3><b>Codigo:</b> ${CODIGO}<br><b>Explotacion:</b> ${EXPLOTACION}<br><b>Especie:</b> ${ESPECIE}<br><b>Familia:</b> ${FAMILIA}")) },
                2: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Granja Resuelta", "<h3>Granja Resuelta:</h3><b>Codigo:</b> ${CODIGO}<br><b>Explotacion:</b> ${EXPLOTACION}<br><b>Especie:</b> ${ESPECIE}<br><b>Familia:</b> ${FAMILIA}")) }
            }
        });
        dynamicMSLayerGranjas.setVisibleLayers([0,1,2]);
        dynamicMSLayerGranjas.setImageFormat("png32", true);

        var dynamicMSLayerCotos = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Cotos_Caza/MapServer", {
            id: "Cotos",
            outFields: ["*"]
        });
        dynamicMSLayerCotos.setVisibility(false);
        dynamicMSLayerCotos.setInfoTemplates({
            1: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Terrenos Cinegéticos", "<h3>Terrenos Cinegéticos:</h3><b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}")) },
            2: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Terrenos Cinegéticos", "<h3>Terrenos Cinegéticos:</h3><b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}")) }
        });
        dynamicMSLayerCotos.setImageFormat("png32", true);

        var dynamicMSLayerLimites = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer", {
            id: "Limites",
            outFields: ["*"]
        });
        dynamicMSLayerLimites.setImageFormat("png32", true);
        dynamicMSLayerLimites.setInfoTemplates({
            3: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Municipios", "<h3>Municipios:</h3><b>Código INE:</b> ${C_MUNI_INE}<br><b>Nombre:</b> ${D_MUNI_INE}<br><b>Comarca:</b> ${D_COMARCA}")) }                    
        });
        var dynamicMSLayerFPA = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer", {
            id: "Figuras",
            outFields: ["*"]
        });
        dynamicMSLayerFPA.setInfoTemplates({
            0: { infoTemplate: new esri.InfoTemplate(getInfotemplate("HUMEDALES", "<h3>HUMEDALES:</h3><b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
            1: { infoTemplate: new esri.InfoTemplate(getInfotemplate("LICS", "<h3>LICS:</h3><b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
            2: { infoTemplate: new esri.InfoTemplate(getInfotemplate("ZEPAS", "<h3>ZEPAS:</h3><b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
            3: { infoTemplate: new esri.InfoTemplate(getInfotemplate("LIG", "<h3>LIG:</h3><b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
            4: { infoTemplate: new esri.InfoTemplate(getInfotemplate("ENP", "<h3>ENP:</h3><b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
            5: { infoTemplate: new esri.InfoTemplate(getInfotemplate("PORN", "<h3>PORN:</h3><b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
            6: { infoTemplate: new esri.InfoTemplate(getInfotemplate("AREAS CRITICAS", "<h3>Áreas Críticas:</h3><b><b>CODIGO:</b> ${CODZONA}<br><b>Nombre:</b> ${DZONA}")) },
            7: { infoTemplate: new esri.InfoTemplate(getInfotemplate("APPE", "<h3>Ámbitos de Protección:</h3><b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
        });
        dynamicMSLayerFPA.setVisibleLayers([]);
        dynamicMSLayerFPA.setImageFormat("png32", true);
        var layer1 = new WMSLayerInfo({
            name: 'Catastro',
            title: 'Catastro'
        });
        var resourceInfo = {
            extent: customExtentAndSR,
            featureInfoFormat: "text/html",
            layerInfos: [layer1]
        };
        var layerCat = new WMSLayer('http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?', {
            resourceInfo: resourceInfo,
            visibleLayers: ['catastro']

        });
        layerCat.visible = false;
        layerCat.id = "OVC";
        layerCat.version = "1.1.1";
        layerCat.spatialReferences[0] = 3857; //new esri.SpatialReference(3857);


        var layerSigpacPar = new WMSLayerInfo({
            name: 'PARCELA',
            title: 'PARCELA'
        });
        var layerSigpacRec = new WMSLayerInfo({
            name: 'RECINTO',
            title: 'RECINTO'
        });
        var resourceInfo = {
            extent: customExtentAndSR,
            layerInfos: [layerSigpacPar, layerSigpacRec]
        };
        var wmsSigpac = new WMSLayer('http://wms.magrama.es/wms/wms.aspx?', {
            resourceInfo: resourceInfo,
            visibleLayers: ['PARCELA', 'RECINTO']

        });
        wmsSigpac.visible = false;
        wmsSigpac.id = "SIGPAC";
        wmsSigpac.version = "1.1.1";
        wmsSigpac.spatialReferences[0] = 25830;


        var layerIGN = new WMSLayerInfo({
            name: 'mtn_rasterizado',
            title: 'mtn_rasterizado'
        });
        var resourceInfo = {
            extent: customExtentAndSR,
            layerInfos: [layerIGN]
        };
        var wmsLayeriGN = new WMSLayer('https://www.ign.es/wms-inspire/mapa-raster?', {
            resourceInfo: resourceInfo,
            visibleLayers: ['mtn_rasterizado']

        });
        wmsLayeriGN.visible = false;
        wmsLayeriGN.id = "IGN";
        wmsLayeriGN.version = "1.1.1";
        wmsLayeriGN.spatialReferences[0] = 3857;

        map.addLayers([wmsLayeriGN, dynamicMSLayerMontes, dynamicMSLayerVVPP, dynamicMSLayerGranjas, dynamicMSLayerCotos, dynamicMSLayerFPA, dynamicMSLayerLimites, wmsSigpac, layerCat]);

        getFiles();
    
    });

