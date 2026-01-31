import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Box, Portal, useMediaQuery } from "@mui/material";

import ProtectedRoute from "../features/app/components/AppProtectedRoute";
import useLayoutStore from "../stores/layout-store";
import useLanguageStore from "../stores/language-store";
import useAuthenticationStore from "../stores/auth-store";
import AppSnackbar from "../features/app/components/AppSnackbar";
import SuspenseFallback from "../components/SuspenseFallback";
import { LANGUAGE } from "../constants/language-constants";

const Login = lazy(() => import("../features/authentication/components/Login"));
const App = lazy(() => import("../features/app/components/App"));
const AppLayout = lazy(() => import("../features/app/components/AppLayout"));
const Dashboard = lazy(() => import("../features/dashboard/components/Dashboard"));
const ReservationsScreen = lazy(() => import("../features/reservations/components/ReservationsScreen"));
const RefundsScreen = lazy(() => import("../features/refunds/components/RefundsScreen"));
const UsersScreen = lazy(() => import("../features/users/components/UsersScreen"));
const RolesScreen = lazy(() => import("../features/roles/components/RolesScreen"));
const CampingSeasonsScreen = lazy(() => import("../features/camping-seasons/components/CampingSeasonsScreen"));
const CampingAreasScreen = lazy(() => import("../features/camping-areas/components/CampingAreasScreen"));
const NotFound = lazy(() => import("../components/NotFound"));

function AppContainer() {
  const smallScreen = useMediaQuery(
    (theme: any) => theme.breakpoints.down("md"),
    {
      noSsr: true,
    }
  );

  const toggleSmallScreen = useLayoutStore((state) => state.toggleSmallScreen);
  const user = useAuthenticationStore((state) => state.user);
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    toggleSmallScreen(smallScreen);
  }, [toggleSmallScreen, smallScreen]);

  useEffect(() => {
    document.body.setAttribute("dir", language === LANGUAGE.AR ? "rtl" : "ltr");
  }, [language]);

  return (
    <Box height="100vh">
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservations"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <ReservationsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/refunds"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <RefundsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <UsersScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <RolesScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/camping-seasons"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <CampingSeasonsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/camping-areas"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <CampingAreasScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <App />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Portal>
          <AppSnackbar />
        </Portal>
      </Suspense>
    </Box>
  );
}

export default AppContainer;
