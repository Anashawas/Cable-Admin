window.env = {
  host: {
    virtualPath: "/km/camping-v2/admin",
    licensePath:
      "https://dev.openware.com.kw/km/camping-v2/client/print/reservation/",
    invoicePath:
      "https://dev.openware.com.kw/km/camping-v2/client/print/invoice/",
  },
  esriJSAPI: {
    assetsPath: "esri/arcgis-js-api/assets",
    fontsUrl: "esri/arcgis-js-api/fonts",
    geometryServiceUrl:
      "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/Utilities/Geometry/GeometryServer/project",
    proxyRules: [
      {
        urlPrefix:
          "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services",
        proxyUrl: "https://gis.moi.gov.kw/proxy/proxy.ashx",
      },
    ],
  },
  server: {
    url: "https://dev.openware.com.kw/KM/Camping-V2/Server/",
  },
  search: {
    geocoderServiceUrl:
      "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/Hosted/PACIGeocoder/FeatureServer/0",
    addresseSeviceUrl:
      "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/PACIAddressSearch/MapServer",
    coordinatesSearcgTolerance: 150, //meters
  },
  map: {
    // WebMap configuration
    portalUrl: "https://gis.openware.com.kw/stgportal", // ArcGIS Portal URL
    webMapId: "b58c778c2930452c803a9fde13746b55", // WebMap ID from your ArcGIS Portal
  },
  mapView: {
    properties: {
      zoom: 9,
      // scale: 200000,
      center: [47.4818, 29.3117],
      constraints: {
        // minScale: 2000000,
        // maxScale: 4513,
        rotationEnabled: true,
      },
    },
  },
  print: {
    url: "https://gis.moi.gov.kw/server/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
    //url: "https://dev.openware.com.kw/server/rest/services/MOIGISV2/ExportMoiMaps/GPServer/Export%20Web%20Map",
    // url: "https://dev.openware.com.kw/server/rest/services/MOIGISV2/ExportWebMap/GPServer/Export%20Web%20Map",
  },
  directions: {
    url: "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/Routing/NetworkAnalysis/NAServer/Route",
    //  url: "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/PACI_NetworkAnalysis/NAServer/Route",
    // url: "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/PACI_NetworkAnalysis/NAServer/Route",
  },
  identify: {
    url: "https://kuwaitportal.paci.gov.kw/arcgisportal/rest/services/PACIAddressSearch/MapServer",
    layerIds: [0, 1, 2, 3, 4, 5],
  },
  campingAreas: {
    gisUrl:
      "https://giss.baladia.gov.kw/portal/apps/webappviewer/index.html?id=51e04bfa8de04265aedea85fa791ee6a",
  },
};
