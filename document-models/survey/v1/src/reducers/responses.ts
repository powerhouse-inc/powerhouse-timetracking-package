import type { SurveyResponsesOperations } from "document-models/survey/v1";
import {
  ResponseNotFoundError,
  SurveyNotOpenError,
  UnknownQuestionError,
} from "../../gen/responses/error.js";

export const surveyResponsesOperations: SurveyResponsesOperations = {
  addResponseOperation(state, action) {
    if (state.status !== "OPEN") {
      throw new SurveyNotOpenError("Survey is not accepting responses");
    }
    const known = new Set(state.questions.map((q) => q.id));
    for (const answer of action.input.answers) {
      if (!known.has(answer.questionId)) {
        throw new UnknownQuestionError(
          `Question ${answer.questionId} not found`,
        );
      }
    }
    state.responses.push({
      id: action.input.id,
      submittedAt: action.input.submittedAt,
      answers: action.input.answers.map((answer) => ({
        questionId: answer.questionId,
        text: answer.text || null,
        optionIds: answer.optionIds ?? [],
        rating: answer.rating ?? null,
        rows: (answer.rows ?? []).map((row) => ({
          cells: row.cells.map((cell) => ({
            columnId: cell.columnId,
            text: cell.text || null,
            optionId: cell.optionId || null,
          })),
        })),
      })),
    });
  },
  deleteResponseOperation(state, action) {
    const index = state.responses.findIndex((r) => r.id === action.input.id);
    if (index === -1) {
      throw new ResponseNotFoundError(`Response ${action.input.id} not found`);
    }
    state.responses.splice(index, 1);
  },
};
