import { useNavigate } from "react-router-dom";

import { useCreateTrip } from "../../api/trips";
import { Modal } from "../../components/ui/Modal";
import { DESKTOP_QUERY, useMediaQuery } from "../../lib/useMediaQuery";
import { TripsDesktop } from "./components/TripsDesktop";
import { TripsMobile } from "./components/TripsMobile";
import { useTripsScreen } from "./useTripsScreen";

export function TripsScreen() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const screen = useTripsScreen();
  const navigate = useNavigate();
  const createTripMutation = useCreateTrip();

  return (
    <>
      {isDesktop ? <TripsDesktop {...screen} /> : <TripsMobile {...screen} />}

      {/* Placeholder content for PACKFE-005 Piece 3 — proves the
          open/create/navigate loop end-to-end. Piece 7 replaces this
          wholesale with the real NewTripModal. */}
      {screen.isNewTripOpen && (
        <Modal
          title="New trip"
          desktopWidth="lg:w-[420px]"
          onClose={screen.closeNewTrip}
        >
          <button
            onClick={() =>
              createTripMutation.mutate(
                { name: "Untitled trip" },
                {
                  onSuccess: (trip) => {
                    screen.closeNewTrip();
                    navigate(`/trips/${trip.id}`);
                  },
                },
              )
            }
          >
            Create untitled trip
          </button>
        </Modal>
      )}

      {/* Placeholder content for PACKFE-005 Piece 3 — Piece 5 replaces
          this wholesale with the real TripAddItemsModal. */}
      {screen.isAddItemsOpen && screen.selectedTrip && (
        <Modal
          title="Add items"
          desktopWidth="lg:w-[420px]"
          onClose={screen.closeAddItems}
        >
          <p>Coming in Piece 5.</p>
        </Modal>
      )}
    </>
  );
}
