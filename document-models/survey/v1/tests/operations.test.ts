import {
  addQuestion,
  addResponse,
  addSection,
  closeSurvey,
  deleteQuestion,
  deleteResponse,
  deleteSection,
  moveQuestion,
  publishSurvey,
  regenerateShareToken,
  reopenSurvey,
  reorderQuestions,
  reorderSections,
  reducer,
  setDescription,
  setRecipient,
  setSurveyKind,
  setTitle,
  updateQuestion,
  updateSection,
  utils,
} from "document-models/survey/v1";
import type { SurveyDocument } from "document-models/survey/v1";
import { describe, expect, it } from "vitest";

// Fixed OID-shaped ids so scenarios can cross-reference sections/questions.
const S1 = "aaaaaaaa-0000-0000-0000-000000000001";
const S2 = "aaaaaaaa-0000-0000-0000-000000000002";
const Q_TEXT = "bbbbbbbb-0000-0000-0000-000000000001";
const Q_LONG = "bbbbbbbb-0000-0000-0000-000000000002";
const Q_SINGLE = "bbbbbbbb-0000-0000-0000-000000000003";
const Q_MULTI = "bbbbbbbb-0000-0000-0000-000000000004";
const Q_RATING = "bbbbbbbb-0000-0000-0000-000000000005";
const Q_GRID = "bbbbbbbb-0000-0000-0000-000000000006";
const O1 = "cccccccc-0000-0000-0000-000000000001";
const O2 = "cccccccc-0000-0000-0000-000000000002";
const COL_TEXT = "dddddddd-0000-0000-0000-000000000001";
const COL_SELECT = "dddddddd-0000-0000-0000-000000000002";
const R1 = "eeeeeeee-0000-0000-0000-000000000001";
const MISSING = "ffffffff-0000-0000-0000-000000000000";

function lastError(doc: SurveyDocument): string | undefined {
  const op = doc.operations.global.at(-1);
  return op?.error ?? undefined;
}

/**
 * One end-to-end flow that builds a full survey (every question type), reorders,
 * publishes, collects a response, then closes/reopens — the way a real consumer
 * drives the reducer.
 */
function buildFullSurvey(): SurveyDocument {
  let doc = utils.createDocument();
  doc = reducer(doc, setTitle({ title: "Discovery Questionnaire" }));
  doc = reducer(doc, setDescription({ description: "A brief questionnaire." }));
  doc = reducer(
    doc,
    setRecipient({ clientId: "client-1", clientName: "Niko d.o.o." }),
  );
  doc = reducer(
    doc,
    addSection({ id: S1, title: "Core", description: "≈5 min" }),
  );
  doc = reducer(doc, addSection({ id: S2, title: "Optional depth" }));

  doc = reducer(
    doc,
    addQuestion({
      id: Q_TEXT,
      sectionId: S1,
      type: "SHORT_TEXT",
      title: "Which tools don't talk to each other?",
    }),
  );
  doc = reducer(
    doc,
    addQuestion({
      id: Q_LONG,
      sectionId: S1,
      type: "LONG_TEXT",
      title: "Biggest frustration",
      helpText: "A real recent example beats a category.",
      required: true,
    }),
  );
  doc = reducer(
    doc,
    addQuestion({
      id: Q_SINGLE,
      sectionId: S1,
      type: "SINGLE_SELECT",
      title: "Severity",
      required: false,
      options: [
        { id: O1, label: "Low" },
        { id: O2, label: "High" },
      ],
    }),
  );
  doc = reducer(
    doc,
    addQuestion({
      id: Q_MULTI,
      sectionId: S2,
      type: "MULTI_SELECT",
      title: "Which apply?",
      options: [{ id: O1, label: "Status visibility" }],
    }),
  );
  doc = reducer(
    doc,
    addQuestion({
      id: Q_RATING,
      sectionId: S2,
      type: "RATING",
      title: "How painful?",
      ratingScale: { min: 1, max: 5, minLabel: "Fine", maxLabel: "Awful" },
    }),
  );
  doc = reducer(
    doc,
    addQuestion({
      id: Q_GRID,
      sectionId: S2,
      type: "GRID",
      title: "Top tools per department",
      columns: [
        { id: COL_TEXT, label: "Department", type: "TEXT" },
        {
          id: COL_SELECT,
          label: "Criticality",
          type: "SELECT",
          options: [{ id: O1, label: "High" }],
        },
      ],
    }),
  );
  return doc;
}

describe("definition operations", () => {
  it("builds a complete survey with every question type", () => {
    const doc = buildFullSurvey();
    expect(doc.state.global.title).toBe("Discovery Questionnaire");
    expect(doc.state.global.description).toBe("A brief questionnaire.");
    expect(doc.state.global.clientId).toBe("client-1");
    expect(doc.state.global.clientName).toBe("Niko d.o.o.");
    expect(doc.state.global.sections).toHaveLength(2);
    expect(doc.state.global.questions).toHaveLength(6);

    const rating = doc.state.global.questions.find((q) => q.id === Q_RATING);
    expect(rating?.ratingScale).toEqual({
      min: 1,
      max: 5,
      minLabel: "Fine",
      maxLabel: "Awful",
    });
    const grid = doc.state.global.questions.find((q) => q.id === Q_GRID);
    expect(grid?.columns).toHaveLength(2);
    expect(grid?.columns[0].options).toEqual([]);
    expect(grid?.columns[1].options).toEqual([{ id: O1, label: "High" }]);
    const short = doc.state.global.questions.find((q) => q.id === Q_TEXT);
    expect(short?.required).toBe(false);
    expect(short?.helpText).toBeNull();
    expect(short?.ratingScale).toBeNull();
  });

  it("clears optional fields when omitted", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, setDescription({ description: null }));
    doc = reducer(doc, setRecipient({}));
    expect(doc.state.global.description).toBeNull();
    expect(doc.state.global.clientId).toBeNull();
    expect(doc.state.global.clientName).toBeNull();
  });

  it("adds a rating question without end labels", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addSection({ id: S1, title: "Core" }));
    doc = reducer(
      doc,
      addQuestion({
        id: Q_RATING,
        sectionId: S1,
        type: "RATING",
        title: "Score",
        ratingScale: { min: 0, max: 10 },
      }),
    );
    const q = doc.state.global.questions[0];
    expect(q.ratingScale).toEqual({
      min: 0,
      max: 10,
      minLabel: null,
      maxLabel: null,
    });
  });

  it("marks a survey as a template", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, setSurveyKind({ kind: "TEMPLATE" }));
    expect(doc.state.global.kind).toBe("TEMPLATE");
  });

  it("updates a section (with and without changes) and rejects unknown sections", () => {
    let doc = buildFullSurvey();
    doc = reducer(
      doc,
      updateSection({ id: S1, title: "Core A", description: "x" }),
    );
    expect(doc.state.global.sections[0].title).toBe("Core A");
    expect(doc.state.global.sections[0].description).toBe("x");

    // empty string clears the description; missing title leaves it untouched
    doc = reducer(doc, updateSection({ id: S1, description: "" }));
    expect(doc.state.global.sections[0].title).toBe("Core A");
    expect(doc.state.global.sections[0].description).toBeNull();

    // no-op update (both branches false)
    doc = reducer(doc, updateSection({ id: S1 }));
    expect(doc.state.global.sections[0].title).toBe("Core A");

    doc = reducer(doc, updateSection({ id: MISSING, title: "nope" }));
    expect(lastError(doc)).toContain("not found");
    expect(doc.state.global.sections).toHaveLength(2);
  });

  it("deletes a section and cascades its questions; rejects unknown", () => {
    let doc = buildFullSurvey();
    doc = reducer(doc, deleteSection({ id: S1 }));
    expect(doc.state.global.sections).toHaveLength(1);
    // Q_TEXT/Q_LONG/Q_SINGLE were in S1 and must be gone
    expect(doc.state.global.questions.map((q) => q.id)).toEqual([
      Q_MULTI,
      Q_RATING,
      Q_GRID,
    ]);

    doc = reducer(doc, deleteSection({ id: MISSING }));
    expect(lastError(doc)).toContain("not found");
  });

  it("reorders sections (partial order keeps the rest) and rejects unknown", () => {
    let doc = buildFullSurvey();
    doc = reducer(doc, reorderSections({ order: [S2] }));
    expect(doc.state.global.sections.map((s) => s.id)).toEqual([S2, S1]);

    doc = reducer(doc, reorderSections({ order: [MISSING] }));
    expect(lastError(doc)).toContain("not found");
  });

  it("rejects adding a question to an unknown section", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addQuestion({
        id: Q_TEXT,
        sectionId: MISSING,
        type: "SHORT_TEXT",
        title: "x",
      }),
    );
    expect(lastError(doc)).toContain("not found");
    expect(doc.state.global.questions).toHaveLength(0);
  });

  it("updates a question fully and minimally; rejects unknown", () => {
    let doc = buildFullSurvey();
    doc = reducer(
      doc,
      updateQuestion({
        id: Q_TEXT,
        type: "SINGLE_SELECT",
        title: "Pick one",
        helpText: "help",
        required: true,
        options: [{ id: O1, label: "A" }],
        ratingScale: { min: 1, max: 3 },
        columns: [
          {
            id: COL_SELECT,
            label: "Col",
            type: "SELECT",
            options: [{ id: O2, label: "B" }],
          },
          { id: COL_TEXT, label: "Plain", type: "TEXT" },
        ],
      }),
    );
    let q = doc.state.global.questions.find((x) => x.id === Q_TEXT)!;
    expect(q.columns[0].options).toEqual([{ id: O2, label: "B" }]);
    expect(q.type).toBe("SINGLE_SELECT");
    expect(q.required).toBe(true);
    expect(q.options).toEqual([{ id: O1, label: "A" }]);
    expect(q.ratingScale).toEqual({
      min: 1,
      max: 3,
      minLabel: null,
      maxLabel: null,
    });
    expect(q.columns).toHaveLength(2);
    expect(q.columns[1].options).toEqual([]);

    doc = reducer(
      doc,
      updateQuestion({ id: Q_TEXT, type: "SHORT_TEXT", title: "Back to text" }),
    );
    q = doc.state.global.questions.find((x) => x.id === Q_TEXT)!;
    expect(q.options).toEqual([]);
    expect(q.ratingScale).toBeNull();
    expect(q.columns).toEqual([]);
    expect(q.required).toBe(false);
    expect(q.helpText).toBeNull();

    doc = reducer(
      doc,
      updateQuestion({ id: MISSING, type: "SHORT_TEXT", title: "no" }),
    );
    expect(lastError(doc)).toContain("not found");
  });

  it("deletes a question; rejects unknown", () => {
    let doc = buildFullSurvey();
    doc = reducer(doc, deleteQuestion({ id: Q_TEXT }));
    expect(
      doc.state.global.questions.find((q) => q.id === Q_TEXT),
    ).toBeUndefined();

    doc = reducer(doc, deleteQuestion({ id: MISSING }));
    expect(lastError(doc)).toContain("not found");
  });

  it("moves a question to another section; rejects unknown question and section", () => {
    let doc = buildFullSurvey();
    doc = reducer(doc, moveQuestion({ id: Q_TEXT, sectionId: S2 }));
    expect(
      doc.state.global.questions.find((q) => q.id === Q_TEXT)?.sectionId,
    ).toBe(S2);

    doc = reducer(doc, moveQuestion({ id: MISSING, sectionId: S2 }));
    expect(lastError(doc)).toContain("not found");

    doc = reducer(doc, moveQuestion({ id: Q_TEXT, sectionId: MISSING }));
    expect(lastError(doc)).toContain("not found");
  });

  it("reorders questions (partial order keeps the rest) and rejects unknown", () => {
    let doc = buildFullSurvey();
    doc = reducer(doc, reorderQuestions({ order: [Q_GRID, Q_RATING] }));
    expect(doc.state.global.questions.slice(0, 2).map((q) => q.id)).toEqual([
      Q_GRID,
      Q_RATING,
    ]);

    doc = reducer(doc, reorderQuestions({ order: [MISSING] }));
    expect(lastError(doc)).toContain("not found");
  });
});

describe("publishing operations", () => {
  it("publishes, closes, reopens and rotates the token", () => {
    let doc = buildFullSurvey();
    doc = reducer(
      doc,
      publishSurvey({
        shareToken: "tok-1",
        publishedAt: "2026-07-17T00:00:00.000Z",
      }),
    );
    expect(doc.state.global.status).toBe("OPEN");
    expect(doc.state.global.shareToken).toBe("tok-1");
    expect(doc.state.global.publishedAt).toBe("2026-07-17T00:00:00.000Z");
    expect(doc.state.global.closedAt).toBeNull();

    doc = reducer(doc, closeSurvey({ closedAt: "2026-07-18T00:00:00.000Z" }));
    expect(doc.state.global.status).toBe("CLOSED");
    expect(doc.state.global.closedAt).toBe("2026-07-18T00:00:00.000Z");

    doc = reducer(doc, reopenSurvey({}));
    expect(doc.state.global.status).toBe("OPEN");
    expect(doc.state.global.closedAt).toBeNull();

    doc = reducer(doc, regenerateShareToken({ shareToken: "tok-2" }));
    expect(doc.state.global.shareToken).toBe("tok-2");
  });

  it("refuses to publish or reopen a template", () => {
    let doc = buildFullSurvey();
    doc = reducer(doc, setSurveyKind({ kind: "TEMPLATE" }));

    doc = reducer(
      doc,
      publishSurvey({
        shareToken: "t",
        publishedAt: "2026-07-17T00:00:00.000Z",
      }),
    );
    expect(lastError(doc)).toContain("Templates cannot be published");
    expect(doc.state.global.status).toBe("DRAFT");

    doc = reducer(doc, reopenSurvey({}));
    expect(lastError(doc)).toContain("Templates cannot be published");
    expect(doc.state.global.status).toBe("DRAFT");
  });
});

describe("responses operations", () => {
  function openSurvey(): SurveyDocument {
    let doc = buildFullSurvey();
    doc = reducer(
      doc,
      publishSurvey({
        shareToken: "tok",
        publishedAt: "2026-07-17T00:00:00.000Z",
      }),
    );
    return doc;
  }

  it("accepts a response covering every answer shape", () => {
    let doc = openSurvey();
    doc = reducer(
      doc,
      addResponse({
        id: R1,
        submittedAt: "2026-07-17T10:00:00.000Z",
        answers: [
          { questionId: Q_TEXT, text: "Infor and Excel" },
          { questionId: Q_SINGLE, optionIds: [O2] },
          { questionId: Q_RATING, rating: 4 },
          {
            questionId: Q_GRID,
            rows: [
              {
                cells: [
                  { columnId: COL_TEXT, text: "Admin" },
                  { columnId: COL_SELECT, optionId: O1 },
                ],
              },
            ],
          },
          { questionId: Q_LONG },
        ],
      }),
    );
    expect(doc.state.global.responses).toHaveLength(1);
    const answers = doc.state.global.responses[0].answers;
    expect(answers[0].text).toBe("Infor and Excel");
    expect(answers[0].optionIds).toEqual([]);
    expect(answers[0].rating).toBeNull();
    expect(answers[0].rows).toEqual([]);
    expect(answers[1].optionIds).toEqual([O2]);
    expect(answers[2].rating).toBe(4);
    expect(answers[3].rows[0].cells[0].text).toBe("Admin");
    expect(answers[3].rows[0].cells[0].optionId).toBeNull();
    expect(answers[3].rows[0].cells[1].optionId).toBe(O1);
    expect(answers[3].rows[0].cells[1].text).toBeNull();
    // minimal answer (no text/option/rating/rows)
    expect(answers[4].text).toBeNull();
  });

  it("rejects responses when the survey is not open", () => {
    let doc = buildFullSurvey(); // still DRAFT
    doc = reducer(
      doc,
      addResponse({
        id: R1,
        submittedAt: "2026-07-17T10:00:00.000Z",
        answers: [],
      }),
    );
    expect(lastError(doc)).toContain("not accepting responses");
    expect(doc.state.global.responses).toHaveLength(0);
  });

  it("rejects a response referencing an unknown question", () => {
    let doc = openSurvey();
    doc = reducer(
      doc,
      addResponse({
        id: R1,
        submittedAt: "2026-07-17T10:00:00.000Z",
        answers: [{ questionId: MISSING, text: "x" }],
      }),
    );
    expect(lastError(doc)).toContain("not found");
    expect(doc.state.global.responses).toHaveLength(0);
  });

  it("deletes a response; rejects unknown", () => {
    let doc = openSurvey();
    doc = reducer(
      doc,
      addResponse({
        id: R1,
        submittedAt: "2026-07-17T10:00:00.000Z",
        answers: [{ questionId: Q_TEXT, text: "hi" }],
      }),
    );
    doc = reducer(doc, deleteResponse({ id: R1 }));
    expect(doc.state.global.responses).toHaveLength(0);

    doc = reducer(doc, deleteResponse({ id: MISSING }));
    expect(lastError(doc)).toContain("not found");
  });
});
