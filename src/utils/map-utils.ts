import Map from "@arcgis/core/Map";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import Basemap from "@arcgis/core/Basemap";
import TileLayer from "@arcgis/core/layers/TileLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import PictureFillSymbol from "@arcgis/core/symbols/PictureFillSymbol";
import { blue } from "@mui/material/colors";
import { alpha } from "@mui/material";

const DEFAULT_POINT_Symbol_PATH =
    "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

// Create SVG pattern for diagonal hatching
const createDiagonalHatchPattern = (backgroundColor: number[], lineColor: number[], lineWidth: number = 2) => {
    const bgColor = `rgba(${backgroundColor.join(',')})`;
    const strokeColor = `rgba(${lineColor.join(',')})`;
    
    const svgPattern = `
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="20" height="20">
                    <rect width="20" height="20" fill="${bgColor}"/>
                    <line x1="0" y1="0" x2="20" y2="20" stroke="${strokeColor}" stroke-width="${lineWidth}"/>
                    <line x1="-5" y1="5" x2="5" y2="15" stroke="${strokeColor}" stroke-width="${lineWidth}"/>
                    <line x1="15" y1="-5" x2="25" y2="5" stroke="${strokeColor}" stroke-width="${lineWidth}"/>
                    <line x1="5" y1="25" x2="15" y2="35" stroke="${strokeColor}" stroke-width="${lineWidth}"/>
                    <line x1="-5" y1="15" x2="5" y2="25" stroke="${strokeColor}" stroke-width="${lineWidth}"/>
                </pattern>
            </defs>
            <rect width="20" height="20" fill="url(#diagonalHatch)"/>
        </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgPattern)}`;
};

export const isTouchDevice = (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getBasemapGalleryViewModel = ({ basemapsList }: { basemapsList: any[] }) => {
    // This is a placeholder implementation - you may need to adjust based on your actual ArcGIS setup
    return {
        items: basemapsList.map((basemap: any) => ({ basemap })),
        activeBasemap: basemapsList[0],
        destroy: () => {}
    };
};

const createLayer = ({ id, type, title, url, layers, customRenderer }: { id?: string, type: string, title: string, url: string, layers?: any, customRenderer?: any }) => {
    switch (type.toUpperCase()) {
        case "TILE":
            return new TileLayer({ title, url });
        case "VECTOR-TILE":
            return new VectorTileLayer({ title, url });
        case "MAP-IMAGE":
            return new MapImageLayer({ title, url });
        case "FEATURE-LAYER":
            const featureLayerProps: any = { 
                id: id || undefined, 
                title, 
                url, 
                outFields: ["*"] 
            };
            
            // Apply custom renderer if provided
            if (customRenderer) {
                let symbol;
                
                if (customRenderer.symbol.style === 'diagonal-hatch') {
                    // Use custom SVG pattern for better visibility
                    const patternUrl = createDiagonalHatchPattern(
                        customRenderer.symbol.color.slice(0, 3), // RGB values
                        [139, 69, 19], // Brown color for lines
                        2 // Line width
                    );
                    
                    symbol = new PictureFillSymbol({
                        url: patternUrl,
                        width: 20,
                        height: 20,
                        outline: new SimpleLineSymbol({
                            color: customRenderer.symbol.outline.color,
                            width: customRenderer.symbol.outline.width
                        })
                    });
                } else {
                    // Use standard SimpleFillSymbol
                    symbol = new SimpleFillSymbol({
                        color: customRenderer.symbol.color,
                        style: customRenderer.symbol.style,
                        outline: new SimpleLineSymbol({
                            color: customRenderer.symbol.outline.color,
                            width: customRenderer.symbol.outline.width
                        })
                    });
                }
                
                featureLayerProps.renderer = new SimpleRenderer({
                    symbol: symbol
                });
            }
            
            return new FeatureLayer(featureLayerProps);
        case "GROUP-LAYER":
            return new GroupLayer({ title, layers });
        default:
            break;
    }
};

export const getDefaultSymbol = (featureType: string) => {
    let symbol = null;

    if (featureType === "polygon") {
        symbol = {
            type: "simple-fill",
            color: alpha(blue["A100"], 0.3),
            outline: {
                color: blue["800"],
                width: 1,
            },
        };
    } else if (featureType === "point") {
        symbol = {
            type: "simple-marker",
            outline: null,
            size: 30,
            yoffset: 16,
            color: blue[600],
            path: DEFAULT_POINT_Symbol_PATH,
        };
    }

    return symbol;
};

export const createMap = ({ basemapId, baseLayers = [], operationalLayers = [], referenceLayers = [], onLayerError, onAllLayersLoaded, onAllLayerLoadingSettled }: { basemapId?: string, baseLayers?: any[], operationalLayers?: any[], referenceLayers?: any[], onLayerError?: (title: string) => void, onAllLayersLoaded?: () => void, onAllLayerLoadingSettled?: () => void }) => {
	const layerLoadedPromises: Promise<any>[] = [];

    const esriMap = new Map({
        basemap: new Basemap({
            id: basemapId || "topo-vector",
            baseLayers: baseLayers.map((baseLayer) => {
                const layer = createLayer({
                    id: baseLayer.id,
                    type: baseLayer.type,
                    title: baseLayer.title,
                    url: baseLayer.url,
                });
                const loadedPromise = layer?.when(
                    (_: any) => {
                        return _;
                    },
                    (_: any) => onLayerError && onLayerError(layer?.title || "")
                );

                loadedPromise && layerLoadedPromises.push(loadedPromise);
                return layer;
            }).filter((layer): layer is NonNullable<typeof layer> => layer !== undefined),
            referenceLayers: referenceLayers
                .map((referenceLayer) => {
                    const layer = createLayer({
                        id: referenceLayer.id,
                        type: referenceLayer.type,
                        title: referenceLayer.title,
                        url: referenceLayer.url,
                    });
                    const loadedPromise = layer?.when(
                        (_: any) => {
                            return _;
                        },
                        (_: any) => onLayerError && onLayerError(layer?.title || "")
                    );

                    loadedPromise && layerLoadedPromises.push(loadedPromise);
                    return layer;
                })
                .filter((layer) => layer !== undefined),
        }),
    });

    esriMap.addMany(
        operationalLayers
            .filter(i => i.type.toUpperCase() !== "FEATURE-SERVER")
            .map((operationalLayer) => {
                const layer = createLayer({
                    id: operationalLayer.id,
                    type: operationalLayer.type,
                    title: operationalLayer.title,
                    url: operationalLayer.url,
                    customRenderer: operationalLayer.customRenderer,
                });
                const loadedPromise = layer?.when(
                    (_: any) => {
                        return _;
                    },
                    (_: any) => onLayerError && onLayerError(typeof layer?.title === "string" ? layer.title : "")
                );

                loadedPromise && layerLoadedPromises.push(loadedPromise);
                return layer;
            })
            .filter((layer) => layer !== undefined),
        Number.MAX_VALUE
    );

    Promise.allSettled(layerLoadedPromises)
        .then((promises) => {
            const allLayersLoaded = promises
                .map((promise: any) => promise.value?.loaded)
                .every((loaded) => loaded);

            if (allLayersLoaded) {
                onAllLayersLoaded && onAllLayersLoaded();
            }
        })
        .catch(() => {
            console.log("loading error");
        })
        .finally(() => onAllLayerLoadingSettled && onAllLayerLoadingSettled());

    return esriMap;
};

export const reloadMap = ({ map, onLayerError, onAllLayersLoaded, onAllLayerLoadingSettled }: {
    map: any;
    onLayerError?: (title: string) => void;
    onAllLayersLoaded?: () => void;
    onAllLayerLoadingSettled?: () => void;
}) => {
    const layerLoadedPromises: Promise<any>[] = [];

    const baseLayers =
        map.basemap.baseLayers?.map((layerItem: any) => {
            const layer = createLayer({
                id: layerItem.id,
                type: layerItem.type,
                title: layerItem.title,
                url: layerItem.url,
            });
            const loadedPromise = layer?.when(
                (_: any) => {
                    return _;
                },
                (_: any) => onLayerError && onLayerError(layer?.title || "")
            );

            loadedPromise && layerLoadedPromises.push(loadedPromise);
            return layer;
        }) ?? [];

    const referenceLayers =
        map.basemap.referenceLayers?.map((layerItem: any) => {
            const layer = createLayer({
                id: layerItem.id,
                type: layerItem.type,
                title: layerItem.title,
                url: layerItem.url,
            });
            const loadedPromise = layer?.when(
                (_: any) => {
                    return _;
                },
                (_: any) => onLayerError && onLayerError(layer?.title || "")
            );

            loadedPromise && layerLoadedPromises.push(loadedPromise);
            return layer;
        }) ?? [];

    const operationalLayers = map.layers
        .filter(
            (operationalLayer: any) =>
                operationalLayer.listMode === "show" &&
                operationalLayer.type !== "graphics" &&
                operationalLayer.type !== "route" &&
                !operationalLayer.source
        )
        .map((operationalLayer: any) => {
            const layer = createLayer({
                id: operationalLayer.id,
                type: operationalLayer.type,
                title: operationalLayer.title,
                url: operationalLayer.url,
            });
            const loadedPromise = layer?.when(
                (_: any) => {
                    return _;
                },
                (_: any) => onLayerError && onLayerError(layer?.title || "")
            );

            loadedPromise && layerLoadedPromises.push(loadedPromise);
            return layer;
        });

    const graphicsLayers = map.layers.filter((layer: any) => layer.type === "graphics");
    const routeLayers = map.layers.filter((layer: any) => layer.type === "route");
    const featureLayers = map.layers.filter((operationalLayer: any) => operationalLayer.source);

    const id = map.basemap.id;

    map.layers.removeAll();

    map.basemap = new Basemap({
        id: id,
        baseLayers: baseLayers,
        referenceLayers: referenceLayers,
    });
    map.layers.addMany([...operationalLayers, ...graphicsLayers, ...routeLayers, ...featureLayers]);

    Promise.allSettled(layerLoadedPromises)
        .then((promises) => {
            const allLayersLoaded = promises
                .map((promise: any) => promise.value?.loaded)
                .every((loaded) => loaded);

            if (allLayersLoaded) {
                onAllLayersLoaded && onAllLayersLoaded();
            }
        })
        .finally(() => onAllLayerLoadingSettled && onAllLayerLoadingSettled());
};

export const createMapView = ({
	container,
	map,
	properties
}: {
	container: HTMLElement;
	map: Map;
	properties?: any
}) => {
	return new MapView({
		container,
		map,
		center: properties?.center || [-95.7129, 37.0902],
		zoom: properties?.zoom || 4,
		ui: {
			components: [] // Disable all default UI components to avoid i18n errors
		},
		...properties,
	});
};

export const createWebMap = ({ portalUrl, webMapId }: { portalUrl: string; webMapId: string }) => {
	return new WebMap({
		portalItem: {
			id: webMapId,
			portal: {
				url: portalUrl
			}
		}
	});
};

export { createLayer };