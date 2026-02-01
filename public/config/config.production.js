window.env = {
  host: {
	virtualPath: "/admin",
	licensePath:
	  "https://mokhiam.baladia.gov.kw/print/reservation/", // TO BE ADDED
	invoicePath:
	  "https://mokhiam.baladia.gov.kw/print/invoice/", // TO BE ADDED
  },
  esriJSAPI: {
	assetsPath: "esri/arcgis-js-api/assets",
	fontsUrl: "esri/arcgis-js-api/fonts",
	geometryServiceUrl:
	  "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/Utilities/Geometry/GeometryServer/project",
	proxyRules: [
	],
  },
  server: {
	url: "https://cable-app.com/",
  },
  search: {
	geocoderServiceUrl:
	  "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/Hosted/PACIGeocoder/FeatureServer/0",
	addresseSeviceUrl:
	  "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/PACIAddressSearch/MapServer",
	coordinatesSearcgTolerance: 150, //meters
  },
  map: {
    portalUrl: "https://kmun.maps.arcgis.com", // TO BE ADDED
    webMapId: "edd6617394764331a2100b9ed2eabd73", // TO BE ADDED
    campingSeasonLocationLayerUrl:
      "https://giss.baladia.gov.kw/server/rest/services/Camping/CampingLocations/MapServer/0", // FeatureLayer URL for caching and queries
    campingAreasLayerTitle: "CampingLocations", // Layer title/id in WebMap for hitTest fallback
  },
  mapView: {
	properties: {
	  zoom: 9,
	  center: [47.4818, 29.3117],
	  constraints: {
		rotationEnabled: true,
	  },
	},
  },
  print: {
	url: "https://gis.moi.gov.kw/server/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
  },
  directions: {
	url: "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/Routing/NetworkAnalysis/NAServer/Route",
  },
  identify: {
	url: "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/PACIAddressSearch/MapServer",
	layerIds: [0, 1, 2, 3, 4, 5],
  },
  campingAreas: {
	gisUrl:
	  "https://gis.openware.com.kw/portal/apps/experiencebuilder/experience/?id=8fe75a3b702f4a589df5121ab42be779", // TO BE ADDED
  },
};
