(function () {
    //"use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    function onDeviceReady() {

        console.log('inicio visor **************************************************************************');
        var geomGoogle, geomINAGA;
        var map, tb, coordx, coordy, geom, url;
        var coordConsulta;  
        var textoDescarga = "";
        var textoParcelas = ""; 
        var textoParcelasDesglosado = ""; 
        var contadorParcelas = 0;
        var listcoor = []; var orden = 0;
        var loading; var edicion = false;
        var visible = [];
        var visibleFiguras = [];
        var prefijo, ultpos = 0;
        var prefijoParce = "Catastro_Parcela_";
        var campoRefpar = "REFPAR";
        var geomBuffer;
        var stringGeoJson;
        var myVar;
        var valores;
        var contadorConsultas = 0;
               
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
            'esri/dijit/Basemap',
            'esri/dijit/BasemapLayer',

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

        ], function (dom, domStyle, array, connect, parser, query, on, domConstruct, Color, esriConfig, Map, Graphic, Units, InfoTemplate, PopupMobile, Draw, Circle, normalizeUtils, webMercatorUtils, geometryEngine, GeometryService, BufferParameters, Query, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol,
            Font, Measurement, OverviewMap, BasemapGallery, Basemap, BasemapLayer, Scalebar, Search, HomeButton, Legend, LocateButton, FeatureLayer, ArcGISDynamicMapServiceLayer, WMSLayer, WMSLayerInfo, 
            LabelClass, SimpleRenderer
        ) {                
                
                //function init() {
                parser.parse();

                valores = getGET();

                var popup = new PopupMobile(null, domConstruct.create("div"));

                var customExtentAndSR = new esri.geometry.Extent(-300000, 4840000, 120000, 5280000, new esri.SpatialReference({ wkid: 3857 })); //= new esri.geometry.Extent(550000,4400000,825000,4770000, new esri.SpatialReference({wkid:25830}));
                // variables capa de busqueda del servicio a consultar  ------------------------------------------------------------------------------------------------------------------------------
                var tituloVisor = "<center><b><font color='white'>eINAGA-GEO</font></b></center>"
                dom.byId("tituloVisor").innerHTML = tituloVisor; 


                //  otras variables -------------------------------------------------------------------------------------------------------------------------------------------------------------------
                var d = new Date();
                var fecha = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
                var fecha2 = d.getFullYear() + "" + ("00" + (d.getMonth() + 1)).slice(-2) + "" + ("00" + (d.getDate())).slice(-2);

                var sls = new SimpleLineSymbol("solid", new Color("#444444"), 3);
                var sfs = new SimpleFillSymbol("solid", sls, new Color([68, 68, 68, 0.25]));
                var gsvc = new esri.tasks.GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
                esriConfig.defaults.geometryService = gsvc;
                esriConfig.defaults.io.alwaysUseProxy = false;
                //esri.config.defaults.geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

                var basemaps = [];
                //var layer1 = new esri.dijit.BasemapLayer({url:"http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"});
                var layer2 = new esri.dijit.BasemapLayer({ url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" });
                layer2.opacity = 0.0;
                //var basemap1 = new esri.dijit.Basemap({layers:[layer1],title:"Orto",thumbnailUrl:"http://www.mapabase.es/arcgis/rest/services/Raster/MapaBase_o_ETRS89_30N/MapServer/info/thumbnail"});
                var basemap2 = new esri.dijit.Basemap({ layers: [layer2], title: "Blanco", thumbnailUrl: "" });
                //basemaps.push(basemap1);  basemaps.push(basemap2);

                // incicializar mapa -------------------------------------------------------------------------------------------------------------------------------------------------------------------
                map = new Map("map", {
                    basemap: "satellite", //basemap1,     
                    infoWindow: popup,
                    //extent: new esri.geometry.Extent(-2.4, 39.6, 0.7, 43.3)
                    extent: customExtentAndSR
                });
                map.disableKeyboardNavigation();
                map.addLayer(new esri.layers.GraphicsLayer({ "id": "Geodesic" }));
                map.addLayer(new esri.layers.GraphicsLayer({ "id": "Buffer" }));

                //map.infoWindow.resize(400, 300);

                if (valores != undefined) {
                    var coordenadasZoom = valores["zoomEnvelope"].split(":");
                    zoomExtension(coordenadasZoom[0], coordenadasZoom[1], coordenadasZoom[2], coordenadasZoom[3]);
                }
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
                geoLocate = new LocateButton({ map: map }, "LocateButton");
                geoLocate.startup();

                // widget scalebar
                var scalebar = new Scalebar({ map: map, attachTo: "bottom-center", scalebarUnit: "metric" });
                // widget medicion


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

                    if (evt.target.id.substring(0, 4) != "rec_") {
                        map.graphics.clear();
                        if (map.getScale() < 25000) {
                            if (tb) {
                                tb.activate(evt.target.id);
                                map.setInfoWindowOnClick(false);
                                $("#myPanel").panel("close");
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
                    if (dom.byId("myonoffswitch").checked) {
                        map.setInfoWindowOnClick(false);
                        var outSR = new esri.SpatialReference(25830);
                        var params = new esri.tasks.ProjectParameters();
                        params.geometries = [evt.mapPoint]; //map.extent]; //[pt.normalize()];
                        params.outSR = outSR;
                        var pt;
                        var newurl = "";
                        gsvc.project(params, function (projectedPoints) {
                            pt = projectedPoints[0];
                            var urlCat = "https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?&REQUEST=GetFeatureInfo&VERSION=1.1.1&SRS=EPSG%3A25830&BBOX=" + pt.x + "," + pt.y + "," + (pt.x + 1) + "," + (pt.y + 1) + "&WIDTH=" + map.width + "&HEIGHT=" + map.height + "&X=" + evt.layerX + "&Y=" + evt.offsetY;
                            popup.setContent('<iframe style="float:left; height:30em; width:100%" src=' + urlCat + ' frameborder="0" scrolling="yes"></iframe>');
                            popup.setTitle("Información catastral");       
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
                    coordx = evt.mapPoint.x.toFixed(2).replace('.', ',');
                    coordy = evt.mapPoint.y.toFixed(2).replace('.', ',');
                });

                map.on("update-end", function () {
                    map.setMapCursor("default");
                    domStyle.set(dom.byId("procesando"), "display", "none");                    
                });
                map.on("update-start", function () {
                    map.setMapCursor("wait");
                    domStyle.set(dom.byId("procesando"), "display", "inline-block");
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
                    //$("#checkVVPP").click(function () {
                    //    cambiaVisibilidad("Vvpp");
                    //});
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
                });
                measurement.on("tool-change", function (evt) {
                    map.setInfoWindowOnClick(false); dom.byId("etrs").innerHTML = "";
                    $("#myPanel").panel("close");
                });

               
                on(dom.byId("localizaCoord"), "click", function () {
                    //zoomToCoord(dom.byId("CoordX").value, dom.byId("CoordY").value);
                    dom.byId("transformacion2wgs84").innerHTML = "";
                    var _point = new esri.geometry.Point(dom.byId("CoordX").value.replace(',', '.'), dom.byId("CoordY").value.replace(',', '.'), new esri.SpatialReference({ wkid: 25830 }));
                    var outSR = new esri.SpatialReference(4326);
                    var params = new esri.tasks.ProjectParameters();
                    params.geometries = [_point];
                    params.outSR = outSR;
                    var pt;
                    gsvc.project(params, function (projectedPoints) {
                        pt = projectedPoints[0];
                        if (pt == undefined) { dom.byId("transformacion2wgs84").innerHTML = "Coordenada incorrecta"; }
                        else {
                            dom.byId("transformacion2wgs84").innerHTML = "<b>Coordenada Geográfica<hr/><table style='width:100%'><tr><th>Longitud</th><th>Latitud</th></tr><tr><td align='center'>" + pt.x.toFixed(6) + "</td><td align='center'>" + pt.y.toFixed(6) + "</td></tr></table><hr />";
                            addPoint4326(pt);
                        }
                    });
                });

                on(dom.byId("convierteCoord"), "click", function () {
                    dom.byId("transformacion").innerHTML = "";
                    var _point = new esri.geometry.Point(dom.byId("Longitud").value.replace(',', '.'), dom.byId("Latitud").value.replace(',', '.'), new esri.SpatialReference({ wkid: 4326 }));
                    addPoint4326(_point);
                    var outSR = new esri.SpatialReference(25830);
                    var params = new esri.tasks.ProjectParameters();
                    params.geometries = [_point]; //[pt.normalize()];
                    params.outSR = outSR;
                    var pt;
                    gsvc.project(params, function (projectedPoints) {
                        pt = projectedPoints[0];
                        if (pt == undefined) { dom.byId("transformacion").innerHTML = "Coordenada incorrecta"; }
                        else {
                            dom.byId("transformacion").innerHTML = "<b>Coordenada ETRS89 30N<hr/><table style='width:100%'><tr><th>X</th><th>Y</th></tr><tr><td align='center'>" + pt.x.toFixed(0) + "</td><td align='center'>" + pt.y.toFixed(0) + "</td></tr></table><hr />";
                        }
                    });
                });

                popup.on("selection-change", function () {
                    graphico = popup.getSelectedFeature();
                });
                popup.on("hide", function () {
                    $(".esriMobileInfoView").css("display", "none");
                });


                on(dom.byId("analisisDistancias"), "click", function () {
                    // falta comprobar la geometria de consulta no es nula
                    var distancia = $("#km").val();
                    if (geomGoogle === undefined) { showMessage("Debe de dibujar la localización antes de realizar el análisis"); }
                    else if (distancia === undefined || distancia <= 0) { showMessage("Debe indicar la distancia del análisis"); }
                    else
                        doBuffer(geomGoogle);
                });
                on(dom.byId("descargaGeom"), "click", function () {
                    // falta comprobar que existe geometría a descargar
                    if (stringGeoJson === undefined) { showMessage("Debe de dibujar la localización antes de descargarla");}
                    else
                        writeToFile(prefijo + fecha2 + '.geojson', stringGeoJson);
                });

                on(dom.byId("descarga"), "click", function () {
                    generaTextoDescarga("INF_" + fecha2 + '.pdf')
                });

                on(dom.byId("descargaParcelas"), "click", function () {
                    writeToFile(prefijoParce + fecha2 + '.txt', textoParcelasDesglosado);
                });
                on(dom.byId("limpiaParcelas"), "click", function () {
                    textoParcelasDesglosado = "";
                    dom.byId("ArrayParcelas").innerHTML = "";
                    contadorParcelas = 0;
                    dom.byId("ParcelasSel").innerHTML = "";
                });
                on(dom.byId("select-choice-1"), "change", function () {
                    var x = document.getElementById("select-choice-1").value;
                    if (textoParcelasDesglosado.length > 0) {
                        showMessage("Para cambiar de tipo de parcesa es necesario que borre la selección actual");
                    }
                    else {
                        if (x === "01") {
                            prefijoParce = "Catastro_Parcela_";
                            campoRefpar = "REFPAR";                       
                        }
                        if (x === "02") {
                            prefijoParce = "Catastro_Subparcela_";
                            campoRefpar = "REFPAR_SUBP";
                        }
                        else {
                            prefijoParce = "Sigpac_";
                            campoRefpar = "REFREC";
                        }
                    }

                    //var selected = $(this).val();

                    //if (selected != 'bar') {
                    //    if (!confirm('Are you sure?')) {
                    //        $(this).val($.data(this, 'current'));
                    //        return false;
                    //    }
                    //}

                    //$.data(this, 'current', $(this).val());
                });
                on(dom.byId("select-choice-1"), "click", function () {                    
                    if (textoParcelasDesglosado.length > 0) {
                        showMessage("Para cambiar de tipo de parcesa es necesario que borre la selección actual");
                        return;
                    }
                });
                //Funciones -------------------------------------------------------------------------------------------------------------------------------------------------------------------
                
                function dameParcela() {
                    try {
                        var query = new Query();
                        query.geometry = arguments[0];
                        query.outFields = ["*"];
                        var dropd = $("#select-choice-1").find('option:selected').val();
                        if (dropd === "01") {
                            fc_parce.queryFeatures(query, dameParce);
                        }
                        else if (dropd === "02") {
                            fc_subparce.queryFeatures(query, dameParce);
                        }
                        else {
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

                function dibujaGeometria(evtObj) {
                   
                    var distancia = $("#km").val();
                    console.log(evtObj.geometry.cache);
                    switch (evtObj.geometry.type) {
                        case "point":
                            if (distancia > 3000) { showMessage("Se ha superado la superficie máxima"); return; }
                            break;
                        case "polyline":
                            var long = geometryEngine.geodesicLength(geometryEngine.simplify(evtObj.geometry), "meters");
                            showMessage("longitud: " + long + " meters");
                            break;
                        case "polygon":
                            var area = geometryEngine.geodesicArea(geometryEngine.simplify(evtObj.geometry), "hectares");
                            showMessage("area: " + area + " hectares");
                            break;
                    }

                    geomGoogle = evtObj.geometry;
                    dameGeomEtrs89(evtObj.geometry);
                }

                function dameGeomEtrs89() {
                    var g = map.getLayer("Geodesic");
                    g.clear();
                    map.graphics.clear();
                    var outSR = new esri.SpatialReference(25830);
                    var params = new esri.tasks.ProjectParameters();
                    var geomGoogle = arguments[0];
                    params.geometries = [geomGoogle]; //[pt.normalize()];
                    params.outSR = outSR;
                    var geometry;
                    var newurl = "";
                    gsvc.project(params, function (rtdos) {
                        geometry = rtdos[0];
                        console.log(geometry);
                        var symbol;
                        switch (geometry.type) {
                            case "point":
                                prefijo = "pnt_";
                                symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([0, 255, 0, 0.25]));
                                break;
                            case "polyline":
                                prefijo = "lin_";
                                symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 2);
                                break;
                            case "polygon":
                                prefijo = "pol_";
                                symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 0, 0, 0.25]));
                                break;
                        }
                        addGraphic("Geodesic", geomGoogle, symbol);
                        map.getLayer("Buffer").clear();
                        map.graphics.clear();
                        var feature = L.esri.Util.arcgisToGeoJSON(geometry, "FID");
                        stringGeoJson = JSON.stringify(feature);
                        tb.deactivate();
                        map.setInfoWindowOnClick(true);
                        $("#myPanel").panel("open");
                    });
                }
                function reseteaMedicion() {
                    measurement.clearResult();
                    measurement.setTool("area", false);
                    measurement.setTool("distance", false);
                    measurement.setTool("location", false);
                    map.setInfoWindowOnClick(true);
                }
                function zoomExtension(minx, miny, maxx, maxy) {
                    var _extent = new esri.geometry.Extent(minx, miny, maxx, maxy, new esri.SpatialReference({ wkid: 25830 }))
                    var outSR = new esri.SpatialReference(3857);
                    var params = new esri.tasks.ProjectParameters();
                    params.geometries = [_extent];
                    params.outSR = outSR;
                    gsvc.project(params, function (projectedPoints) {
                        pt = projectedPoints[0];
                        map.setExtent(projectedPoints[0], true);
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
                    addGraphic("Buffer", b[0], sym);
                    dameInf();
                }
                function addGraphic(capa, geom,  sym) {
                    var attrs = { "type": "Geodesic" };
                    var template, g, s;
                    geomBuffer = geom;
                    template = new esri.InfoTemplate("", "Type: ${type}");
                    g = map.getLayer(capa);
                    g.add( new esri.Graphic(geom, sym, attrs, template) );
                    if (g.graphics.length > 0) {
                        map.setExtent(esri.graphicsExtent([g.graphics[0]]).expand(1.4), true);
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
                        }if ($('#checkMontes').is(":checked")) {
                            contadorConsultas++; 
                            fc_montes.queryFeatures(query, dameMontes);
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
                    catch(ex){
                        showMessage(err.message);
                    }
                    if (contadorConsultas > 0) {
                        visible("loadingSaturacion", 1);
                        $("#myPanel").panel("close");
                        $("#myPanelRtdo").panel("open");
                    }
                    else {
                        showMessage("Debes seleccionar alguna capa de análisis");
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
                        visible("loadingSaturacion", 0);
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
                        dom.byId("ParcelasSel").innerHTML = contadorParcelas + " Parcelas Seleccionadas";
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
                    }
                    else {
                        showMessage("Ya está seleccionada");
                    }
                }
                function obtieneDatosConsulta(response, texto, texto2) {
                    var Granjas = "<b>" + texto + ":</b><br>";
                    textoDescarga += "<table><h2>" + texto + "</h2>";
                    textoDescarga += "<thead><tr>";
                    var contador = obtieneDatosRtdo(response);
                    if (contador == 0) { Granjas += "No se han localizado<br>"; }
                    else { Granjas += contador + " " + texto2 + "<br>"; }
                    consultaDistancias += Granjas;
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

                function writeToFile2(fileName, data) {
                    if (cordova.platformId === 'ios') {
                    }
                    else {
                        //showMessage(data);
                        showMessage(cordova.file);
                        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (directoryEntry) {
                            directoryEntry.getFile( fileName, { create: true }, function (fileEntry) {
                                fileEntry.createWriter(function (fileWriter) {
                                    fileWriter.onwriteend = function (e) {
                                        // for real-world usage, you might consider passing a success callback
                                        showMessage('<p>Archivo guardado corectamente en</p> ' + cordova.file.dataDirectory.split("/").join('</p>') + "</p> /" + fileName );
                                    };

                                    fileWriter.onerror = function (e) {
                                        // you could hook this up with our global error handler, or pass in an error callback
                                        showMessage('Error: ' + e.toString());
                                    };

                                    var blob = new Blob([data], { type: 'text/plain' });
                                    fileWriter.write(blob);
                                }, errorHandler.bind(null, fileName));
                            }, errorHandler.bind(null, fileName));
                        }, errorHandler.bind(null, fileName));                        
                    }
                }
                function writeToFile(fileName, data) {
                    if (cordova.platformId === 'ios') {
                    }
                    else {
                        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

                            console.log('file system open: ' + fs.name);
                            fs.root.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {

                                showMessage("fileEntry is file?" + fileEntry.isFile.toString());
                                // fileEntry.name == 'someFile.txt'
                                // fileEntry.fullPath == '/someFile.txt'
                                writeFile(fileEntry, data);

                            }, onErrorCreateFile);

                        }, onErrorLoadFs);                    
                    }
                }
                function onErrorLoadFs(er) {
                    showMessage('onErrorLoadFs: code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
                }
                function writeFile(fileEntry, dataObj) {
                    // Create a FileWriter object for our FileEntry (log.txt).
                    fileEntry.createWriter(function (fileWriter) {
                        showMessage(fileEntry.fullPath);
                        fileWriter.onwriteend = function () {
                            showMessage("Successful file write...");
                            //readFile(fileEntry);
                        };

                        fileWriter.onerror = function (e) {
                            showMessage("Failed file write: " + e.toString());
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
                    attrs = { "type": "Geodesic" };
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

                //fresize = function resizeIframe(obj) {
                //    obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
                //}

                function cambiaVisibilidad(nombre) {
                    var targetLayer = map.getLayer(nombre);
                    if (targetLayer.visible) {
                        targetLayer.setVisibility(false);
                    }
                    else { targetLayer.setVisibility(true); }
                }

                function generaTextoDescarga(nombre) {
                    //var texto = [];
                    var cuerpo = "<html><head><title>Análisis de Distancias</title><style>body { font-family: arial, sans-serif}; table{ border-collapse: collapse;width: 100%;}td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;}thead{background-color: #A9BCF5;}</style></head><body><h1>Consulta de afecciones</h1><b>Fecha: " + fecha
                        + "</b><br><b>Distancia análisis: " + distancia + " m</b>"
                        + textoDescarga
                        + "<br><hr><br><b>Geometría de consulta en geojson (SRS 25830): </b>" + stringGeoJson
                        + "</body></html>";
                    //texto.push(cuerpo);
                    //var myWindow = window.open("", "_blank", "scrollbars=yes");
                    //myWindow.document.write(cuerpo);
                    //return new Blob(texto, {
                    //    type: 'text/plain'
                    //});

                    let options = { documentSize: 'A4', type: 'share', fileName: nombre };

                    pdf.fromData(cuerpo, options)
                        .then((stats) => console.log('status', stats))   // ok..., ok if it was able to handle the file to the OS.
                        .catch((err) => console.err(err));

                }
                function initToolbar(evtObj) {
                    //console.debug("initToolbar");
                    tb = new esri.toolbars.Draw(evtObj.map);
                    tb.on("draw-end", dibujaGeometria);
                    //tb.on("draw-complete", reiniciaOrden);
                }

                function showCoordinates(evt) {
                    //display mouse coordinates     
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


                function getPosition() {
                    var options = {
                        enableHighAccuracy: true
                        //,maximumAge: 3600000
                    }
                    var watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

                    function onSuccess(position) {

                        var miposicion = new esri.geometry.Point;
                        miposicion.x = position.coords.longitude;
                        miposicion.y = position.coords.latitude;
                        projectToEtrs89(miposicion);
                        map.centerAndZoom(miposicion, 17);
                        var markerSymbol = new SimpleMarkerSymbol();
                        markerSymbol.setPath("M40.94,5.617C37.318,1.995,32.502,0,27.38,0c-5.123,0-9.938,1.995-13.56,5.617c-6.703,6.702-7.536,19.312-1.804,26.952  L27.38,54.757L42.721,32.6C48.476,24.929,47.643,12.319,40.94,5.617z M27.557,26c-3.859,0-7-3.141-7-7s3.141-7,7-7s7,3.141,7,7  S31.416,26,27.557,26z");
                        markerSymbol.setColor(new Color([19, 24, 175, 0.80]));
                        markerSymbol.setSize(40);
                        map.graphics.clear();
                        map.graphics.add(new Graphic(miposicion, markerSymbol));
                    };

                    function onError(error) {
                        showMessage('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
                    }
                }
                function projectToEtrs89(geometry) {
                    var outSR = new esri.SpatialReference(25830);
                    var params = new esri.tasks.ProjectParameters();
                    params.geometries = [geometry]; //[pt.normalize()];
                    params.outSR = outSR;
                    var pt;
                    gsvc.project(params, function (projectedPoints) {
                        pt = projectedPoints[0];
                        coordx = pt.x.toFixed(0);
                        coordy = pt.y.toFixed(0);
                        dom.byId("etrs").innerHTML = "<hr /><b>Coordenada en ETRS89 30N</br><table style='width:100%'><tr><th>X</th><th>Y</th></tr><tr><td>" + pt.x.toFixed(0) + "</td><td>" + pt.y.toFixed(0) + "</td></tr></table><hr />";
                    });
                }
                function zoomToCoord(x, y) {
                    var _point = new esri.geometry.Point(x, y, new esri.SpatialReference({ wkid: 25830 }));
                    var outSR = new esri.SpatialReference(4326);
                    var params = new esri.tasks.ProjectParameters();
                    params.geometries = [_point]; //[pt.normalize()];
                    params.outSR = outSR;
                    var pt;
                    gsvc.project(params, function (projectedPoints) {
                        pt = projectedPoints[0];
                        addPoint(pt);
                        map.centerAndZoom(pt, 18);
                    });
                }

                function generarTextoFromGeom(migeometry,nombre) {
                    console.log('inicia proceso guardado ********************************************************************************');
                    var texto = [];
                    var tipogeom = esri.geometry.getJsonType(migeometry);
                    i = 1;
                    if (tipogeom == "esriGeometryPolygon") {
                        for (x = 0; x < migeometry.rings.length; x++) {
                            for (z = 0; z < migeometry.rings[x].length; z++) {
                                texto.push(i++ + ' ' + migeometry.rings[x][z][0].toFixed(2).replace('.', ',') + ' ' + migeometry.rings[x][z][1].toFixed(2).replace('.', ','));
                                texto.push('\r\n');
                            }
                        }
                    }
                    else if (tipogeom == "esriGeometryPolyline") {
                        for (x = 0; x < migeometry.paths.length; x++) {
                            for (z = 0; z < migeometry.paths[x].length; z++) {
                                texto.push(i++ + ' ' + migeometry.paths[x][z][0].toFixed(2).replace('.', ',') + ' ' + migeometry.paths[x][z][1].toFixed(2).replace('.', ','));
                                texto.push('\r\n');
                            }
                        }
                    }
                    else { texto.push(i++ + ' ' + migeometry.x.toFixed(2).replace('.', ',') + ' ' + migeometry.y.toFixed(2).replace('.', ',')); }

                    showMessage(cordova.file);
                    writeToFile(nombre, texto.join());
                                        
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
                        locator: new esri.tasks.Locator("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
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

                var legendDijit = new Legend({
                    map: map
                }, "legendDiv");
                legendDijit.startup();

                // capas
                var resourceInfo2 = {
                    extent: customExtentAndSR, // new esri.geometry.Extent(-2.4, 39.6, 0.7, 43.3),
                    //extent: customExtentAndSR,  
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
                    //,opacity: 0.9
                });
                dynamicMSLayerMontes.setVisibility(false);
                dynamicMSLayerMontes.setInfoTemplates({
                    //0: { infoTemplate:   new esri.InfoTemplate("Piquetes de deslinde", "${*}") },
                    //1: { infoTemplate:   new esri.InfoTemplate("Mojones de montes", "${*}") },
                    //2: { infoTemplate:   new esri.InfoTemplate("Consorcios de repoblación", "${*}") },
                    //3: { infoTemplate:   new esri.InfoTemplate("Consorcios de repoblación", "${*}") },
                    //4: { infoTemplate: new esri.InfoTemplate("Montes", "Matricula: ${MATRICULA}<br>Nombre: ${NOMBRE}<br>Titular: ${TITULAR}<br>Tipo: ${DTIPO}") },
                    //5: { infoTemplate: new esri.InfoTemplate("Montes Gen", "Matricula: ${MATRICULA}<br>Nombre: ${DENOMINACION}<br>Titular: ${TITULAR}<br>Tipo: ${TIPO}") }
                    4: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Montes", "<h3>Montes:</h3><b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}")) },
                    5: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Montes Gen", "<h3>Montes:</h3><b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${DENOMINACION}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${TIPO}")) },
                    6: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Vías Pecuarias", "<h3>Vías Pecuarias:</h3><b>Municipio:</b> ${MUNICIPIO}<br><b>Nombre:</b> ${NOMBRE_VIA}<br><b>Tipo:</b> ${DTIPVIA}")) }
                });
                dynamicMSLayerMontes.setImageFormat("png32", true);
                var dynamicMSLayerCotos = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Cotos_Caza/MapServer", {
                    id: "Cotos",
                    outFields: ["*"]
                    //,opacity: 0.7
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

                var dynamicMSLayerFPA = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer", {
                    id: "Figuras",
                    outFields: ["*"]
                    //,opacity: 0.7
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
                var wmsLayeriGN = new WMSLayer('http://www.ign.es/wms-inspire/mapa-raster?', {
                    resourceInfo: resourceInfo,
                    visibleLayers: ['mtn_rasterizado']

                });
                wmsLayeriGN.visible = false;
                wmsLayeriGN.id = "IGN";
                wmsLayeriGN.version = "1.1.1";
                wmsLayeriGN.spatialReferences[0] = 3857;


                map.addLayers([wmsLayeriGN, dynamicMSLayerMontes, dynamicMSLayerCotos, dynamicMSLayerFPA, dynamicMSLayerLimites, wmsSigpac, layerCat]);
                //map.addLayers([wmsLayeriGN, fc_montes,fc_vvpp, fc_cotos, fc_humedales, fc_lics, fc_zepas, fc_ligs, fc_enp, fc_porn, fc_acrit, fc_acrit, dynamicMSLayerLimites, wmsSigpac, layerCat]);

            });
    }
})();
