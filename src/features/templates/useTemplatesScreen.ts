import type { Template } from "../../api/templates";

export interface UseTemplatesScreenResult {
  templates: Template[];
  isLoading: boolean;
  selectedTemplateId: string | undefined;
  selectedTemplate: Template | undefined;
  isSelectedLoading: boolean;
  selectTemplate: (id: string) => void;
  goToList: () => void;
  createTemplate: () => void;
  deleteTemplate: (id: string, name: string) => void;
}

export function useTemplatesScreen(): UseTemplatesScreenResult {
  throw new Error("useTemplatesScreen not implemented yet");
}
