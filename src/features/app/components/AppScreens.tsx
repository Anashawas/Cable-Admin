import { Suspense, memo } from "react";
import EmptyAppScreens from "./EmptyAppScreens";
import SuspenseFallback from "@/components/SuspenseFallback";

const AppScreens = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <EmptyAppScreens />
    </Suspense>
  );
};

export default memo(AppScreens);
