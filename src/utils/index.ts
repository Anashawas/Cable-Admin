export * from "./map-utils";

export const getDefaultSymbol = (_geometryType: string) => {
  return {
    type: "simple-marker" as const,
    color: [226, 119, 40],
    outline: {
      color: [255, 255, 255],
      width: 2
    }
  };
};

export const getMessageFromApiError = (error: any) => {
  return error?.message || "An error occurred";
};