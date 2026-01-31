import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import ReactDOM from "react-dom/client";
import * as urlUtils from "@arcgis/core/core/urlUtils";
import AppContainer from "./pages/AppContainer";
import AppThemeProvider from "./providers/AppThemeProvider";
import "./index.css";
import AppQueryProvider from "./providers/AppQueryProvider";
import AppError from "./features/app/components/AppError";
import "./lib/i18n";

declare global {
  interface Window {
    env?: any;
  }
}
// Suppress ArcGIS sublayer visibility errors globally
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// eslint-disable-next-line no-console
console.error = (...args) => {
  const firstArg = args[0];
  // Check if it's an ArcGIS sublayer error object or message
  if (firstArg && (
    firstArg.name === 'sublayer:locked' ||
    (typeof firstArg === 'string' && firstArg.includes('sublayer:locked')) ||
    (typeof firstArg === 'string' && firstArg.includes("Property 'visible' can't be changed on Sublayer")) ||
    (firstArg.message && firstArg.message.includes("Property 'visible' can't be changed on Sublayer")) ||
    (firstArg.toString && firstArg.toString().includes('sublayer:locked'))
  )) {
    return; // Suppress these specific ArcGIS errors
  }
  originalConsoleError.apply(console, args);
};

// Also override console.warn and console.log as ArcGIS might use those too
// eslint-disable-next-line no-console
console.warn = (...args) => {
  const firstArg = args[0];
  if (firstArg && (
    firstArg.name === 'sublayer:locked' ||
    (typeof firstArg === 'string' && firstArg.includes('sublayer:locked')) ||
    (typeof firstArg === 'string' && firstArg.includes("Property 'visible' can't be changed on Sublayer"))
  )) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// eslint-disable-next-line no-console
console.log = (...args) => {
  const firstArg = args[0];
  if (firstArg && (
    firstArg.name === 'sublayer:locked' ||
    (typeof firstArg === 'string' && firstArg.includes('sublayer:locked')) ||
    (typeof firstArg === 'string' && firstArg.includes("Property 'visible' can't be changed on Sublayer"))
  )) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

if (window.env?.debug === false) {
  const noop = () => {};
  // eslint-disable-next-line no-console
  console.error = noop;
  // eslint-disable-next-line no-console
  console.warn = noop;
  // eslint-disable-next-line no-console
  console.log = noop;
} else {
  // In debug mode, use original console.log to show env
  originalConsoleLog(window.env);
}

window.env?.esriJSAPI?.proxyRules?.map((rule: any) =>
  urlUtils.addProxyRule({ ...rule })
);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={window.env?.host?.virtualPath || ""}>
    <ErrorBoundary FallbackComponent={AppError}>
      <AppQueryProvider>
        <AppThemeProvider>
          <AppContainer />
        </AppThemeProvider>
      </AppQueryProvider>
    </ErrorBoundary>
  </BrowserRouter>
);
