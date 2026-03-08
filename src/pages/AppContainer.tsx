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
const DashboardScreen = lazy(() => import("../features/dashboard/components/DashboardScreen"));
const UserListScreen = lazy(() => import("../features/users/components/UserListScreen"));
const UserAnalyticsScreen = lazy(() => import("../features/users/components/UserAnalyticsScreen"));
const EditUserScreen = lazy(() => import("../features/users/components/EditUserScreen"));
const ChargeManagementScreen = lazy(() => import("../features/charge-management/components/ChargeManagementScreen"));
const StationFormScreen = lazy(() => import("../features/charge-management/components/StationFormScreen"));
const StationMediaScreen = lazy(() => import("../features/charge-management/components/StationMediaScreen"));
const StationsRequestScreen = lazy(() => import("../features/charge-management/components/StationsRequestScreen"));
const StationStatisticsScreen = lazy(() => import("../features/charge-management/components/StationStatisticsScreen"));
const ComplaintsScreen = lazy(() => import("../features/complaints/components/ComplaintsScreen"));
const BannersScreen = lazy(() => import("../features/system/components/BannersScreen"));
const AppVersionsScreen = lazy(() => import("../features/system/components/AppVersionsScreen"));
const CarDatabaseScreen = lazy(() => import("../features/system/components/CarDatabaseScreen"));
const SendNotificationScreen = lazy(() => import("../features/notifications/components/SendNotificationScreen"));
const EmergencyServicesScreen = lazy(() => import("../features/system/components/EmergencyServicesScreen"));
const ServiceCategoriesScreen = lazy(() => import("../features/service-providers/components/ServiceCategoriesScreen"));
const ServiceProvidersScreen = lazy(() => import("../features/service-providers/components/ServiceProvidersScreen"));
const ConversionRatesScreen = lazy(() => import("../features/offers/components/ConversionRatesScreen"));
const PendingOffersScreen = lazy(() => import("../features/offers/components/PendingOffersScreen"));
const ActiveOffersScreen = lazy(() => import("../features/offers/components/ActiveOffersScreen"));
const TransactionsScreen = lazy(() => import("../features/offers/components/TransactionsScreen"));
const SettlementsScreen = lazy(() => import("../features/offers/components/SettlementsScreen"));
const PartnersScreen = lazy(() => import("../features/partners/components/PartnersScreen"));
const LoyaltyManagementScreen = lazy(() => import("../features/loyalty/components/LoyaltyManagementScreen"));
const RedemptionsScreen = lazy(() => import("../features/loyalty/components/RedemptionsScreen"));
const PointAdjustmentsScreen = lazy(() => import("../features/loyalty/components/PointAdjustmentsScreen"));
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
                  <DashboardScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/charge-management"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <ChargeManagementScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/charge-management/add"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <StationFormScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/charge-management/edit/:id"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <StationFormScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/charge-management/:id/media"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <StationMediaScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stations-request"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <StationsRequestScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/station-statistics"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <StationStatisticsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <ComplaintsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <UserListScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-analytics"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <UserAnalyticsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <EditUserScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/car-management"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <CarDatabaseScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/banners"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <BannersScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app-versions"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <AppVersionsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/send-notification"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <SendNotificationScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-services"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <EmergencyServicesScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-categories"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <ServiceCategoriesScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-providers"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <ServiceProvidersScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/conversion-rates"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <ConversionRatesScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending-offers"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <PendingOffersScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/active-offers"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <ActiveOffersScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <TransactionsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settlements"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <SettlementsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/partners"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <PartnersScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty-management"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <LoyaltyManagementScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/redemptions"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <RedemptionsScreen />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/point-adjustments"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <AppLayout>
                  <PointAdjustmentsScreen />
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
