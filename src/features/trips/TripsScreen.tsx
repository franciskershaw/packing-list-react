import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { DESKTOP_QUERY, useMediaQuery } from "../../lib/useMediaQuery";
import { NewTripModal } from "./components/NewTripModal";
import { TripAddItemsModal } from "./components/TripAddItemsModal";
import { TripsDesktop } from "./components/TripsDesktop";
import { TripsMobile } from "./components/TripsMobile";
import { useTripsScreen } from "./useTripsScreen";

export function TripsScreen() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const screen = useTripsScreen();
  useDocumentTitle(screen.selectedTrip?.name ?? "Trips");

  return (
    <>
      {isDesktop ? <TripsDesktop {...screen} /> : <TripsMobile {...screen} />}

      {screen.isNewTripOpen && (
        <NewTripModal
          preselectedTemplateId={screen.preselectedTemplateId}
          onClose={screen.closeNewTrip}
        />
      )}

      {screen.isAddItemsOpen && screen.selectedTrip && (
        <TripAddItemsModal
          trip={screen.selectedTrip}
          onClose={screen.closeAddItems}
        />
      )}
    </>
  );
}
