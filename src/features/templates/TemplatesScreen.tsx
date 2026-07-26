import { DESKTOP_QUERY, useMediaQuery } from "../../lib/useMediaQuery";
import { TemplateAddItemsModal } from "./TemplateAddItemsModal";
import { TemplatesDesktop } from "./TemplatesDesktop";
import { TemplatesMobile } from "./TemplatesMobile";
import { useTemplatesScreen } from "./useTemplatesScreen";

export function TemplatesScreen() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const screen = useTemplatesScreen();

  return (
    <>
      {isDesktop ? (
        <TemplatesDesktop {...screen} />
      ) : (
        <TemplatesMobile {...screen} />
      )}
      {screen.isAddItemsOpen && screen.selectedTemplate && (
        <TemplateAddItemsModal
          template={screen.selectedTemplate}
          onClose={screen.closeAddItems}
        />
      )}
    </>
  );
}
