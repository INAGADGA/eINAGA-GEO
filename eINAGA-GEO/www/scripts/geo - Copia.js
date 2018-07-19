(function () {
    //"use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    function onDeviceReady() {

        console.log('inicio visor **************************************************************************');

        var map, tb, coordx, coordy, geom, url;
        var listcoor = []; var orden = 0;
        var loading; var edicion = false;
        var visible = [];
        var visibleFiguras = [];
        var prefijo, ultpos = 0;
        var poligonoConsulta;
        var myVar;
        var valores;
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

        ], function (dom, domStyle, array, connect, parser, query, on, domConstruct, Color, esriConfig, Map, Graphic, Units, InfoTemplate, PopupMobile, Draw, Circle, normalizeUtils, webMercatorUtils, GeometryService, BufferParameters, Query, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol,
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
                var fecha2 = d.getDate() + "" + (d.getMonth() + 1) + "" + d.getFullYear();

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

                //Funciones -------------------------------------------------------------------------------------------------------------------------------------------------------------------

                function dibujaGeometria(evtObj) {
                    if (map.getScale() < 25000) {
                        var geometry = dameGeomEtrs89(evtObj.geometry);
                        doBuffer(evtObj.geometry);
                    }
                    else { map.graphics.clear(); tb.deactivate(); alert("Debe acercarse hasta una escala menor de 25000 para digitalizar"); }

                }

                function dameGeomEtrs89() {
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
                        var graphic = new esri.Graphic(geomGoogle, symbol);
                        map.graphics.add(graphic);
                        generarTextoFromGeom(geometry, prefijo + fecha2 + '.txt');
                        tb.deactivate();
                        map.setInfoWindowOnClick(true);
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

                function doBuffer(evtObj) {
                    var distancia = $("#km").val();
                    map.getLayer("Geodesic").clear();
                    map.graphics.clear();
                    map.setInfoWindowOnClick(true);
                    tb.deactivate();
                    var geometry = evtObj, symbol;
                    switch (geometry.type) {
                        case "point":
                            symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([0, 255, 0, 0.25]));
                            break;
                        case "polyline":
                            symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 1);
                            break;
                        case "polygon":
                            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                            break;
                    }
                    var graphic = new Graphic(geometry, symbol);
                    map.graphics.add(graphic);
                    //setup the buffer parameters
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
                                esriConfig.defaults.geometryService.buffer(params, showGeodesic);
                            });
                        } else {
                            params.geometries = [normalizedGeometry];
                            esriConfig.defaults.geometryService.buffer(params, showGeodesic);
                        }
                    });

                }
                function showGeodesic(b) {
                    var attrs, sym;
                    attrs = { "type": "Geodesic" };
                    sym = new esri.symbol.SimpleFillSymbol();
                    sym.setColor(null);
                    sym.setOutline(new esri.symbol.SimpleLineSymbol("solid", new dojo.Color([255, 0, 0, 1]), 2));
                    addGraphic(b[0], attrs, sym);
                }
                function addGraphic(geom, attrs, sym) {
                    var template, g, s;
                    poligonoConsulta = geom;
                    template = new esri.InfoTemplate("", "Type: ${type}");
                    g = map.getLayer("Geodesic");
                    map.getLayer(attrs.type).add(
                        new esri.Graphic(geom, sym, attrs, template)
                    );
                    if (g.graphics.length > 0) {
                        map.setExtent(esri.graphicsExtent([g.graphics[0]]).expand(3), true);
                    }
                    //var query = new Query();
                    //query.geometry = geom.getExtent();
                    //query.outFields = ["*"];
                    //query.where = filtroFecha;
                    //fcCotos.queryFeatures(query, dameCotos);
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

                //Eventos -------------------------------------------------------------------------------------------------------------------------------------------------------------------
                on(dom.byId("posicion"), "click", function () {
                    getPosition();
                });

                tb = new esri.toolbars.Draw(map);
                //tb.on("draw-end",
                //    dibujaGeometria
                //);

                query(".tool").on("click", function (evt) {
                    reseteaMedicion();

                    if (evt.target.id.substring(0, 4) != "rec_") {
                        map.graphics.clear();
                        if (map.getScale() < 25000) {
                            if (tb) {
                                tb.activate(evt.target.id);
                                map.setInfoWindowOnClick(false);
                                $("[data-role=panel]").panel("close");
                            }
                        }
                        else { tb.deactivate(); alert("Debe acercarse hasta una escala menor de 25.000 para digitalizar"); }
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
                    $("#checkVVPP").click(function () {
                        cambiaVisibilidad("Vvpp");
                    });
                    $("#checkRaster").click(function () {
                        cambiaVisibilidad("IGN");
                    });
                    $("#checkboxhmd").click(function () {
                        cambiaVisibilidad("Humedales");
                    });
                    $("#checkboxlics").click(function () {
                        cambiaVisibilidad("Lics");
                    });
                    $("#checkboxzepas").click(function () {
                        cambiaVisibilidad("Zepas");
                    });
                    $("#checkboxlig").click(function () {
                        cambiaVisibilidad("Ligs");
                    });
                    $("#checkboxenp").click(function () {
                        cambiaVisibilidad("Enp");
                    });
                    $("#checkboxporn").click(function () {
                        cambiaVisibilidad("Porn");
                    });
                    $("#checkboxacrit").click(function () {
                        cambiaVisibilidad("Acrit");
                    });
                    $("#checkboxappe").click(function () {
                        cambiaVisibilidad("Appe");
                    });

                });

                function quitaValoresVisibilidad(pos) {
                    capas = [];
                    esta = false;
                    for (index = 0; index < visibleFiguras.length; index++) {
                        if (visibleFiguras[index] != pos) { capas.push(visibleFiguras[index]); }
                    }
                    visibleFiguras = capas;
                };

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
                    $("[data-role=panel]").panel("open");
                });
                measurement.on("tool-change", function (evt) {
                    map.setInfoWindowOnClick(false); dom.byId("etrs").innerHTML = "";
                    $("[data-role=panel]").panel("close");
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

                // funciones   -------------------------------------------------------------------------------------------------------------------------------------------------------------------
                function dameInf() {
                    dameGeomEtrs89(coordConsulta);
                    //visible("loadingSaturacion", 1);
                    //distancia = $("#distAnalisis").val();
                    dom.byId("listadoRtdos").innerHTML = "";
                    dom.byId("resultadoImpacto").innerHTML = "";
                    var g = map.getLayer("Geodesic");
                    g.clear();
                    map.graphics.clear();
                    map.setInfoWindowOnClick(true);
                    tb.deactivate();

                    var circleGeometry = new esri.geometry.Circle({
                        center: coordConsulta,   //.getExtent().getCenter(),
                        radius: distancia,
                        geodesic: true
                    });
                    var query = new Query();
                    query.geometry = coordConsulta; //circleGeometry.getExtent();
                    query.outFields = ["*"];
                    //query.where = "";
                    query.distance = distancia;
                    query.units = "Meters";
                    Granjas = "";
                    textoDescarga = "";
                    consultaDistancias = "<b>Fecha: " + fecha + "</b><hr/>";  // + Granjas;
                    dom.byId("listadoRtdos").innerHTML = consultaDistancias;
                    var analisisDist = $('#checkAnalisis').is(":checked");
                    var analisisSaldo = $('#checkSaldo').is(":checked");
                    if (analisisDist) {
                        consultaDistancias += "<h4 style=\"color:red;\">Explotaciones a menos de " + distancia + " m</h4>" + Granjas;
                        var symbolPnt = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([0, 255, 0, 0.25]));
                        var sym = new esri.symbol.SimpleFillSymbol();
                        sym.setColor(null);
                        sym.setOutline(new esri.symbol.SimpleLineSymbol("solid", new dojo.Color([255, 0, 0, 1]), 2));
                        addGraphic(coordConsulta, symbolPnt);
                        addGraphic(circleGeometry, sym);
                        poligonoConsulta = circleGeometry;

                        if ($('#checkGr_Prod').is(":checked")) { fcGranjasProduccion.queryFeatures(query, dameGranjasProd); }
                        if ($('#checkGr_TInaga').is(":checked")) { fcGranjasInagaTram.queryFeatures(query, dameGranjasINAGATrm); }
                        if ($('#checkGr_RInaga').is(":checked")) { fcGranjasInagaReso.queryFeatures(query, dameGranjasINAGAResol); }
                        visible("descarga", 1);
                    }
                    else {
                        visible("descarga", 0);
                    }
                    if (analisisSaldo) {
                        cursorEspera();
                        query.geometry = coordConsulta;
                        query.distance = 5000;
                        query.units = "Meters";
                        fcRecintos.queryFeatures(query, dameSaldoAcumulado);
                    }
                    else {
                        visible("loadingSaturacion", 0);
                        $("[data-role=panel]").panel("open")
                    }
                }

                function dameGranjasProd(response) {
                    var Granjas = "<b>Explotaciones REGA (Producción):</b><br>";
                    textoDescarga += "<table><h2>Explotaciones REGA (Producción)</h2>";
                    textoDescarga += "<thead><tr>";
                    obtieneDatosRtdo(response);
                    if (response.features.length == 0) { Granjas += "No se han localizado<br>"; }
                    else { Granjas += response.features.length + " explotaciones<br>"; }
                    consultaDistancias += Granjas;
                    dom.byId("listadoGranjas").innerHTML = consultaDistancias;
                }

                function dameGranjasINAGATrm(response) {
                    var Granjas = "<b>Explotaciones tramitándose en INAGA:</b><br>";
                    textoDescarga += "<table><h2>Explotaciones tramitándose en INAGA</h2>";
                    textoDescarga += "<thead><tr>";
                    obtieneDatosRtdo(response);
                    if (response.features.length == 0) { Granjas += "No se han localizado<br>"; }
                    else { Granjas += response.features.length + " explotaciones<br>"; }
                    consultaDistancias += Granjas;
                    dom.byId("listadoGranjas").innerHTML = consultaDistancias;
                }

                function writeToFile(fileName, data) {
                    //data = JSON.stringify(data, null, '\t');
                    window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (directoryEntry) {
                        directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
                            fileEntry.createWriter(function (fileWriter) {
                                fileWriter.onwriteend = function (e) {
                                    // for real-world usage, you might consider passing a success callback
                                    alert('Write of file "' + fileName + '"" completed.');
                                };

                                fileWriter.onerror = function (e) {
                                    // you could hook this up with our global error handler, or pass in an error callback
                                    alert('Write failed: ' + e.toString());
                                };

                                var blob = new Blob([data], { type: 'text/plain' });
                                fileWriter.write(blob);
                            }, errorHandler.bind(null, fileName));
                        }, errorHandler.bind(null, fileName));
                    }, errorHandler.bind(null, fileName));

                    alert('finaliza');
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

                    console.log('Error (' + fileName + '): ' + msg);
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
                        alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
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

                    alert(cordova.file);
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

                
                // Capas necesarias para las búsquedas-------------------------------------------------------------------------------------------------------------------------------------------------------------------
                // create a text symbol to define the style of labels
                var statesColor = new Color("#666");
                var statesLine = new SimpleLineSymbol("solid", statesColor, 1.5);
                var statesSymbol = new SimpleFillSymbol("solid", statesLine, null);
                var statesRenderer = new SimpleRenderer(statesSymbol);

                var statesLabel = new TextSymbol().setColor(statesColor);
                statesLabel.font.setSize("14pt");
                statesLabel.font.setFamily("arial");

                //this is the very least of what should be set within the JSON  
                var json = {
                    "labelExpressionInfo": { "value": "{MATRICULA}" }
                };

                //create instance of LabelClass (note: multiple LabelClasses can be passed in as an array)
                var labelClass = new LabelClass(json);
                labelClass.symbol = statesLabel; // symbol also can be set in LabelClass' json
                
                
                var fc_cotos = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Cotos_Caza/MapServer/2", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("Terrenos Cinegéticos", "<b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}")),                    
                    id:"Cotos"
                });  
                fc_cotos.setRenderer(statesRenderer);
                fc_cotos.setLabelingInfo([labelClass]);
                var fc_montes = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_CMA/MapServer/5", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("Montes", "<b>Matricula:</b> ${MATRICULA} <br><b>Nombre:</b> ${DENOMINACION} <br><b>Titular:</b> ${TITULAR} <br><b>Tipo:</b> ${TIPO}")),
                    id:"Montes"
                });  
                var fc_vvpp = new ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_CMA/MapServer/6", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("Vías Pecuarias", "<b>MUNICIPIO:</b> ${MUNICIPIO}<br><b>NOMBRE_VIA:</b> ${NOMBRE_VIA}<br><b>Tipo:</b> ${DTIPVIA}")),
                    id:"Vvpp"
                });  
                var fc_humedales = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/0", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("HUMEDALES", "<b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")),
                    id:"Humedales"
                });  
                var fc_lics = new ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/", {
                    visibleLayers:[0,1], 
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("LICS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")),
                    id:"Lics"
                });  
                var fc_zepas = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/2", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("ZEPAS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")),
                    id:"Zepas"
                });  
                var fc_ligs = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/3", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("ZEPAS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")),
                    id:"Ligs"
                });  
                var fc_enp = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/4", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("ZEPAS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")),
                    id:"Enp"
                });  
                var fc_porn = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/5", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("ZEPAS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")),
                    id:"Porn"
                });  
                var fc_acrit = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/6", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("AREAS CRITICAS", "<b><b>CODIGO:</b> ${CODZONA}<br><b>Nombre:</b> ${DZONA}")),
                    id:"Acrit"
                });  
                var fc_appe = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer/7", {
                    mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"], visible: false, showLabels: true,
                    infoTemplate: new esri.InfoTemplate(getInfotemplate("ZEPAS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")),
                    id:"Appe"
                });  
                //fc_cotos.visible = false;
                //fc_montes.visible = false;
                //fc_vvpp.visible = false;
                //fc_humedales.visible = false;
                //fc_lics.visible = false;
                //fc_zepas.visible = false;
                //fc_ligs.visible = false;
                //fc_enp.visible = false;
                //fc_porn.visible = false;
                //fc_acrit.visible = false;
                //fc_appe.visible = false;
                //fc_cotos.id = "Cotos";
                //fc_montes.id = "Montes";
                //fc_vvpp.id = "Vvpp";
                //fc_humedales.id = "Humedales";
                //fc_lics.id = "Lics";
                //fc_zepas.id = "Zepas";
                //fc_ligs.id = "Ligs";
                //fc_enp.id = "Enp";
                //fc_porn.id = "Porn";
                //fc_acrit.id = "Acrit";
                //fc_appe.id = "Appe";
                //fc_cotos.infoTemplate = new esri.InfoTemplate(getInfotemplate("Terrenos Cinegéticos", "<b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}"));
                //fc_montes.infoTemplate = new esri.InfoTemplate(getInfotemplate("Montes", "<b>Matricula:</b> ${MATRICULA} <br><b>Nombre:</b> ${DENOMINACION} <br><b>Titular:</b> ${TITULAR} <br><b>Tipo:</b> ${TIPO}"));               
                //fc_vvpp.infoTemplate = new esri.InfoTemplate(getInfotemplate("Vías Pecuarias", "<b>MUNICIPIO:</b> ${MUNICIPIO}<br><b>NOMBRE_VIA:</b> ${NOMBRE_VIA}<br><b>Tipo:</b> ${DTIPVIA}"));
                //fc_humedales.infoTemplate = new esri.InfoTemplate(getInfotemplate("HUMEDALES", "<b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}"));
                //fc_lics.infoTemplate = new esri.InfoTemplate(getInfotemplate("LICS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}"));
                //fc_zepas.infoTemplate = new esri.InfoTemplate(getInfotemplate("ZEPAS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}"));
                //fc_ligs.infoTemplate = new esri.InfoTemplate(getInfotemplate("LIG", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}"));
                //fc_enp.infoTemplate = new esri.InfoTemplate(getInfotemplate("ENP", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}"));
                //fc_porn.infoTemplate = new esri.InfoTemplate(getInfotemplate("PORN", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}"));
                //fc_acrit.infoTemplate = new esri.InfoTemplate(getInfotemplate("AREAS CRITICAS", "<b><b>CODIGO:</b> ${CODZONA}<br><b>Nombre:</b> ${DZONA}"));
                //fc_appe.infoTemplate = new esri.InfoTemplate(getInfotemplate("APPE", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}"));
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

                //var dynamicMSLayerMontes = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_CMA/MapServer", {
                //    id: "Montes",
                //    outFields: ["*"]
                //    //,opacity: 0.9
                //});
                //dynamicMSLayerMontes.setVisibility(false);
                //dynamicMSLayerMontes.setInfoTemplates({
                //    //0: { infoTemplate:   new esri.InfoTemplate("Piquetes de deslinde", "${*}") },
                //    //1: { infoTemplate:   new esri.InfoTemplate("Mojones de montes", "${*}") },
                //    //2: { infoTemplate:   new esri.InfoTemplate("Consorcios de repoblación", "${*}") },
                //    //3: { infoTemplate:   new esri.InfoTemplate("Consorcios de repoblación", "${*}") },
                //    //4: { infoTemplate: new esri.InfoTemplate("Montes", "Matricula: ${MATRICULA}<br>Nombre: ${NOMBRE}<br>Titular: ${TITULAR}<br>Tipo: ${DTIPO}") },
                //    //5: { infoTemplate: new esri.InfoTemplate("Montes Gen", "Matricula: ${MATRICULA}<br>Nombre: ${DENOMINACION}<br>Titular: ${TITULAR}<br>Tipo: ${TIPO}") }
                //    4: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Montes", "<b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}")) },
                //    5: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Montes Gen", "<b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${DENOMINACION}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${TIPO}")) },
                //    6: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Vías Pecuarias", "<b>Municipio:</b> ${MUNICIPIO}<br><b>Nombre:</b> ${NOMBRE_VIA}<br><b>Tipo:</b> ${DTIPVIA}")) }
                //});
                //dynamicMSLayerMontes.setImageFormat("png32", true);
                //var dynamicMSLayerCotos = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Cotos_Caza/MapServer", {
                //    id: "Cotos",
                //    outFields: ["*"]
                //    //,opacity: 0.7
                //});
                //dynamicMSLayerCotos.setVisibility(false);
                //dynamicMSLayerCotos.setInfoTemplates({
                //    1: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Terrenos Cinegéticos", "<b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}")) },
                //    2: { infoTemplate: new esri.InfoTemplate(getInfotemplate("Terrenos Cinegéticos", "<b>Matricula:</b> ${MATRICULA}<br><b>Nombre:</b> ${NOMBRE}<br><b>Titular:</b> ${TITULAR}<br><b>Tipo:</b> ${DTIPO}")) }
                //});
                //dynamicMSLayerCotos.setImageFormat("png32", true);

                var dynamicMSLayerLimites = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer", {
                    id: "Limites",
                    outFields: ["*"]
                });
                dynamicMSLayerLimites.setImageFormat("png32", true);

                //var dynamicMSLayerFPA = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_FPA/MapServer", {
                //    id: "Figuras",
                //    outFields: ["*"]
                //    //,opacity: 0.7
                //});
                //dynamicMSLayerFPA.setInfoTemplates({
                //    0: { infoTemplate: new esri.InfoTemplate(getInfotemplate("HUMEDALES", "<b>CODIGO:</b> ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
                //    1: { infoTemplate: new esri.InfoTemplate(getInfotemplate("LICS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
                //    2: { infoTemplate: new esri.InfoTemplate(getInfotemplate("ZEPAS", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
                //    3: { infoTemplate: new esri.InfoTemplate(getInfotemplate("LIG", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
                //    4: { infoTemplate: new esri.InfoTemplate(getInfotemplate("ENP", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
                //    5: { infoTemplate: new esri.InfoTemplate(getInfotemplate("PORN", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
                //    6: { infoTemplate: new esri.InfoTemplate(getInfotemplate("AREAS CRITICAS", "<b><b>CODIGO:</b> ${CODZONA}<br><b>Nombre:</b> ${DZONA}")) },
                //    7: { infoTemplate: new esri.InfoTemplate(getInfotemplate("APPE", "<b>CODIGO: ${CODIGO}<br><b>Nombre:</b> ${DESCRIPCIO}")) },
                //});
                //dynamicMSLayerFPA.setVisibleLayers([]);
                //dynamicMSLayerFPA.setImageFormat("png32", true);
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


                //map.addLayers([wmsLayeriGN, dynamicMSLayerMontes, dynamicMSLayerCotos, dynamicMSLayerFPA, dynamicMSLayerLimites, wmsSigpac, layerCat]);
                map.addLayers([wmsLayeriGN, fc_montes,fc_vvpp, fc_cotos, fc_humedales, fc_lics, fc_zepas, fc_ligs, fc_enp, fc_porn, fc_acrit, fc_acrit, dynamicMSLayerLimites, wmsSigpac, layerCat]);

            });
    }
})();