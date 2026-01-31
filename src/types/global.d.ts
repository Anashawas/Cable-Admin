declare global {
	interface Window {
		env?: {
			host: {
				virtualPath: string;
			};
			map: {
				basemaps: Array<{ id: string; [key: string]: any }>;
			};
			identify: {
				url: string;
				layerIds: number[];
			};
			esriJSAPI: {
				assetsPath: string;
				fontsUrl: string;
				geometryServiceUrl: string;
				proxyRules: Array<{
					urlPrefix: string;
					proxyUrl: string;
				}>;
			};
		};
	}
}

export {};