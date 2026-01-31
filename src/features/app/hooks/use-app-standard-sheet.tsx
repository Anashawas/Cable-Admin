import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMapFeaturesStore, useMapViewStore, useLayoutStore } from "src/stores";

import { APP_STANDARD_SHEET_TYPE } from "@/constants";

const useAppStandardSheet = () => {
	const { t } = useTranslation();

	const [standardSheet, setStandardSheet] = useState<{ [key: string]: any }>({});

	const identifiedMapFeature = useMapFeaturesStore((state) => (state as any).identifiedMapFeature);
	const setIdentifiedMapFeature = useMapFeaturesStore((state) => (state as any).setIdentifiedMapFeature);
	
	const mapView = useMapViewStore((state) => state.mapView);
	const smallScreen = useLayoutStore((state) => state.smallScreen);

	const clearPreviousSelections = useCallback(() => {
		setStandardSheet((standardSheet) => ({
			...standardSheet,
			sheet: null,
			open: false,
		}));
	}, []);

	useEffect(
		() => {
			clearPreviousSelections();

			if (identifiedMapFeature?.item) {
				setStandardSheet({
					open: true,
					type: APP_STANDARD_SHEET_TYPE.FEATURE_RESULTS,
					sheet: null,
					...(smallScreen && { height: '60vh' }),
					onClose: (_: any) => {
						if (mapView?.graphics) {
							mapView.graphics.removeAll();
						}
						setIdentifiedMapFeature(null);
					},
				});
			} else {
				setStandardSheet((standardSheet) => ({
					...standardSheet,
					sheet: null,
					open: false,
				}));
			}
		},
		[
			clearPreviousSelections,
			identifiedMapFeature,
			setIdentifiedMapFeature,
			t,
		]
	);

	return { standardSheet };
};

export default useAppStandardSheet;
