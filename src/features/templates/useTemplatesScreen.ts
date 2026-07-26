import { useNavigate, useParams } from "react-router-dom";

import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplate,
  useTemplates,
} from "../../api/templates";
import type { Template } from "../../api/templates";

const UNTITLED_TEMPLATE_NAME = "Untitled template";

// The backend rejects duplicate names per user, so a second "+ New" would
// 409 without this.
function nextUntitledName(existing: Template[]): string {
  const taken = new Set(existing.map((template) => template.name));
  if (!taken.has(UNTITLED_TEMPLATE_NAME)) {
    return UNTITLED_TEMPLATE_NAME;
  }
  let suffix = 2;
  while (taken.has(`${UNTITLED_TEMPLATE_NAME} ${suffix}`)) {
    suffix++;
  }
  return `${UNTITLED_TEMPLATE_NAME} ${suffix}`;
}

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
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();

  const templates = useTemplates();
  const selected = useTemplate(templateId);
  const createTemplateMutation = useCreateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();

  return {
    templates: templates.data ?? [],
    isLoading: templates.isLoading,
    selectedTemplateId: templateId,
    selectedTemplate: selected.data,
    isSelectedLoading: selected.isLoading,
    selectTemplate: (id) => navigate(`/templates/${id}`),
    goToList: () => navigate("/templates"),
    createTemplate: () => {
      createTemplateMutation.mutate(
        { name: nextUntitledName(templates.data ?? []) },
        { onSuccess: (template) => navigate(`/templates/${template.id}`) },
      );
    },
    deleteTemplate: (id, name) => {
      deleteTemplateMutation.mutate(
        { id, name },
        { onSuccess: () => navigate("/templates") },
      );
    },
  };
}
