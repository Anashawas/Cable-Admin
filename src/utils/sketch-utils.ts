export const getSketchViewModel = ({ mapView: _mapView, graphicsLayer }: { mapView: any; graphicsLayer: any }) => {
  return {
    layer: graphicsLayer,
    create: () => {},
    cancel: () => {},
    destroy: () => {}
  };
};