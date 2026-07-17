import type { SurveyDefinitionOperations } from "document-models/survey/v1";
import {
  QuestionNotFoundError,
  SectionNotFoundError,
} from "../../gen/definition/error.js";

export const surveyDefinitionOperations: SurveyDefinitionOperations = {
  setTitleOperation(state, action) {
    state.title = action.input.title;
  },
  setDescriptionOperation(state, action) {
    state.description = action.input.description || null;
  },
  setSurveyKindOperation(state, action) {
    state.kind = action.input.kind;
  },
  setRecipientOperation(state, action) {
    state.clientId = action.input.clientId || null;
    state.clientName = action.input.clientName || null;
  },
  addSectionOperation(state, action) {
    state.sections.push({
      id: action.input.id,
      title: action.input.title,
      description: action.input.description || null,
    });
  },
  updateSectionOperation(state, action) {
    const section = state.sections.find((s) => s.id === action.input.id);
    if (!section) {
      throw new SectionNotFoundError(`Section ${action.input.id} not found`);
    }
    if (action.input.title) {
      section.title = action.input.title;
    }
    if (typeof action.input.description === "string") {
      section.description = action.input.description || null;
    }
  },
  deleteSectionOperation(state, action) {
    const index = state.sections.findIndex((s) => s.id === action.input.id);
    if (index === -1) {
      throw new SectionNotFoundError(`Section ${action.input.id} not found`);
    }
    state.sections.splice(index, 1);
    state.questions = state.questions.filter(
      (q) => q.sectionId !== action.input.id,
    );
  },
  reorderSectionsOperation(state, action) {
    const byId = new Map(state.sections.map((s) => [s.id, s]));
    const reordered = [];
    for (const id of action.input.order) {
      const section = byId.get(id);
      if (!section) {
        throw new SectionNotFoundError(`Section ${id} not found`);
      }
      reordered.push(section);
      byId.delete(id);
    }
    for (const section of byId.values()) {
      reordered.push(section);
    }
    state.sections = reordered;
  },
  addQuestionOperation(state, action) {
    if (!state.sections.some((s) => s.id === action.input.sectionId)) {
      throw new SectionNotFoundError(
        `Section ${action.input.sectionId} not found`,
      );
    }
    state.questions.push({
      id: action.input.id,
      sectionId: action.input.sectionId,
      type: action.input.type,
      title: action.input.title,
      helpText: action.input.helpText || null,
      required: action.input.required ?? false,
      options: (action.input.options ?? []).map((o) => ({
        id: o.id,
        label: o.label,
      })),
      ratingScale: action.input.ratingScale
        ? {
            min: action.input.ratingScale.min,
            max: action.input.ratingScale.max,
            minLabel: action.input.ratingScale.minLabel || null,
            maxLabel: action.input.ratingScale.maxLabel || null,
          }
        : null,
      columns: (action.input.columns ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        type: c.type,
        options: (c.options ?? []).map((o) => ({ id: o.id, label: o.label })),
      })),
    });
  },
  updateQuestionOperation(state, action) {
    const question = state.questions.find((q) => q.id === action.input.id);
    if (!question) {
      throw new QuestionNotFoundError(`Question ${action.input.id} not found`);
    }
    question.type = action.input.type;
    question.title = action.input.title;
    question.helpText = action.input.helpText || null;
    question.required = action.input.required ?? false;
    question.options = (action.input.options ?? []).map((o) => ({
      id: o.id,
      label: o.label,
    }));
    question.ratingScale = action.input.ratingScale
      ? {
          min: action.input.ratingScale.min,
          max: action.input.ratingScale.max,
          minLabel: action.input.ratingScale.minLabel || null,
          maxLabel: action.input.ratingScale.maxLabel || null,
        }
      : null;
    question.columns = (action.input.columns ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      type: c.type,
      options: (c.options ?? []).map((o) => ({ id: o.id, label: o.label })),
    }));
  },
  deleteQuestionOperation(state, action) {
    const index = state.questions.findIndex((q) => q.id === action.input.id);
    if (index === -1) {
      throw new QuestionNotFoundError(`Question ${action.input.id} not found`);
    }
    state.questions.splice(index, 1);
  },
  moveQuestionOperation(state, action) {
    const question = state.questions.find((q) => q.id === action.input.id);
    if (!question) {
      throw new QuestionNotFoundError(`Question ${action.input.id} not found`);
    }
    if (!state.sections.some((s) => s.id === action.input.sectionId)) {
      throw new SectionNotFoundError(
        `Section ${action.input.sectionId} not found`,
      );
    }
    question.sectionId = action.input.sectionId;
  },
  reorderQuestionsOperation(state, action) {
    const byId = new Map(state.questions.map((q) => [q.id, q]));
    const reordered = [];
    for (const id of action.input.order) {
      const question = byId.get(id);
      if (!question) {
        throw new QuestionNotFoundError(`Question ${id} not found`);
      }
      reordered.push(question);
      byId.delete(id);
    }
    for (const question of byId.values()) {
      reordered.push(question);
    }
    state.questions = reordered;
  },
};
