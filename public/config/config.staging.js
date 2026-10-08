window.env = {
  host: {
    virtualPath: "",
  },

  // Staging = the dev deployment (dev.cable-app.com is the API's "Staging" environment).
  server: {
    url: "https://dev.cable-app.com/",
  },
  // Cable Connect: the OCPP host chargers point at (credentials sheet fallback; the API's own value wins).
  ocpp: {
    url: "wss://ocpp-dev.cable-app.com",
  },
};
