import { memo, useEffect, useRef } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import { createWebMap } from "../../../utils/map-utils";
import { ReservationResponse } from "../types/api";
import "@arcgis/core/assets/esri/themes/light/main.css";

interface ReservationMapProps {
  reservation: ReservationResponse | null;
}

const ReservationMap = ({ reservation }: ReservationMapProps) => {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapViewRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !reservation?.shape) return;

    // Get WebMap configuration from window.env
    const mapConfig = window.env?.map;
    if (!mapConfig?.portalUrl || !mapConfig?.webMapId) return;

    // Create WebMap instance
    const webMap = createWebMap({
      portalUrl: mapConfig.portalUrl,
      webMapId: mapConfig.webMapId,
    });

    // Create map view
    const view = new MapView({
      container: mapContainerRef.current,
      map: webMap,
      zoom: 15,
      ui: {
        components: ["zoom"], // Only show zoom control
      },
    });

    mapViewRef.current = view;

    // Wait for the WebMap to load before adding graphics
    webMap.when(() => {
      // Create point from reservation shape
      const point = new Point({
        x: reservation.shape.x,
        y: reservation.shape.y,
        spatialReference: { wkid: reservation.shape.spatialReference },
      });

      // Create marker symbol
      const markerSymbol = new SimpleMarkerSymbol({
        color: [226, 119, 40], // Orange color for visibility
        size: 12,
        outline: {
          color: [255, 255, 255], // White outline
          width: 2,
        },
      });

      // Create graphic
      const pointGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
      });

      // Add graphic to view
      view.graphics.add(pointGraphic);

      // Center on the point
      view.when(() => {
        view.goTo({
          target: point,
          zoom: 15,
        });
      });
    });

    // Cleanup function
    return () => {
      if (mapViewRef.current) {
        mapViewRef.current.destroy();
        mapViewRef.current = null;
      }
    };
  }, [reservation]);

  if (!reservation?.shape) {
    return (
      <Card sx={{ boxShadow: 1, borderRadius: 1, height: "550px" }}>
        <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 2 }}
          >
            {t("reservations@details.map")}
          </Typography>
          <Box
            sx={{
              flex: 1,
              bgcolor: "action.hover",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("reservations@details.mapPlaceholder")}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ boxShadow: 1, borderRadius: 1, height: "550px" }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("reservations@details.map")}
        </Typography>
        <Box
          ref={mapContainerRef}
          sx={{
            flex: 1,
            borderRadius: 1,
            overflow: "hidden",
            "& .esri-view": {
              height: "100%",
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default memo(ReservationMap);
