import type { SurveyPublishingOperations } from "document-models/survey/v1";
import { CannotPublishTemplateError } from "../../gen/publishing/error.js";

export const surveyPublishingOperations: SurveyPublishingOperations = {
  publishSurveyOperation(state, action) {
    if (state.kind === "TEMPLATE") {
      throw new CannotPublishTemplateError("Templates cannot be published");
    }
    state.status = "OPEN";
    state.shareToken = action.input.shareToken;
    state.publishedAt = action.input.publishedAt;
    state.closedAt = null;
  },
  closeSurveyOperation(state, action) {
    state.status = "CLOSED";
    state.closedAt = action.input.closedAt;
  },
  reopenSurveyOperation(state, action) {
    if (state.kind === "TEMPLATE") {
      throw new CannotPublishTemplateError("Templates cannot be published");
    }
    state.status = "OPEN";
    state.closedAt = null;
  },
  regenerateShareTokenOperation(state, action) {
    state.shareToken = action.input.shareToken;
  },
};
