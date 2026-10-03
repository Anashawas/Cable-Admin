window.env = {
  host: {
    virtualPath: "/admin",
  },

  // Relative: the SPA is served by the same WebApi that serves /api/..., so
  // this resolves against whatever origin it's embedded under (dev or prod)
  // without needing environment-specific rebuilds.
  server: {
    url: "/",
  },
};
