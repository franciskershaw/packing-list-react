import { DESKTOP_QUERY, useMediaQuery } from "../../lib/useMediaQuery";
import { TemplatesDesktop } from "./TemplatesDesktop";
import { TemplatesMobile } from "./TemplatesMobile";
import { useTemplatesScreen } from "./useTemplatesScreen";

export function TemplatesScreen() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const screen = useTemplatesScreen();

  return isDesktop ? (
    <TemplatesDesktop {...screen} />
  ) : (
    <TemplatesMobile {...screen} />
  );
}
