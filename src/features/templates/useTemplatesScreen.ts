import { useState } from "react";
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
  isAddItemsOpen: boolean;
  openAddItems: () => void;
  closeAddItems: () => void;
  /** The id of the template `createTemplate` just navigated to, if any —
   * lets the title field autofocus/select-all only right after creation,
   * not on every ordinary selection. Cleared on the next explicit
   * navigation (selectTemplate/goToList). */
  justCreatedTemplateId: string | null;
}

export function useTemplatesScreen(): UseTemplatesScreenResult {
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();

  const templates = useTemplates();
  const selected = useTemplate(templateId);
  const createTemplateMutation = useCreateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [justCreatedTemplateId, setJustCreatedTemplateId] = useState<
    string | null
  >(null);

  return {
    templates: templates.data ?? [],
    isLoading: templates.isLoading,
    selectedTemplateId: templateId,
    selectedTemplate: selected.data,
    isSelectedLoading: selected.isLoading,
    selectTemplate: (id) => {
      setJustCreatedTemplateId(null);
      navigate(`/templates/${id}`);
    },
    goToList: () => {
      setJustCreatedTemplateId(null);
      navigate("/templates");
    },
    createTemplate: () => {
      createTemplateMutation.mutate(
        { name: nextUntitledName(templates.data ?? []) },
        {
          onSuccess: (template) => {
            setJustCreatedTemplateId(template.id);
            navigate(`/templates/${template.id}`);
          },
        },
      );
    },
    deleteTemplate: (id, name) => {
      deleteTemplateMutation.mutate(
        { id, name },
        { onSuccess: () => navigate("/templates") },
      );
    },
    isAddItemsOpen,
    openAddItems: () => setIsAddItemsOpen(true),
    closeAddItems: () => setIsAddItemsOpen(false),
    justCreatedTemplateId,
  };
}
