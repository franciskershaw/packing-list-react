import { useEffect } from "react";

const SITE_NAME = "Pack it!";

export function useDocumentTitle(pageTitle: string) {
  useEffect(() => {
    document.title = `${pageTitle} | ${SITE_NAME}`;
  }, [pageTitle]);
}
