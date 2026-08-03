/**
 * Reducer coverage for the Content model.
 *
 * One end-to-end scenario drives the full stage machine the way a real consumer
 * would; the remaining tests exercise the falsy/optional branches and every
 * error code. Errors are asserted via the recorded `operation.error` string
 * (never `.toThrow()`), since a throwing reducer still records the operation.
 */
import {
  addAssetLink,
  advanceStage,
  assignOwner,
  kill,
  park,
  publish,
  reducer,
  removeAssetLink,
  resume,
  setBrief,
  setCampaign,
  setChannels,
  setDraftUrl,
  setFormat,
  setTargetDate,
  setTitle,
  updateAssetLink,
  utils,
} from "document-models/content/v1";
import type { ContentDocument } from "document-models/content/v1";
import { describe, expect, it } from "vitest";

const L1 = "aaaaaaaa-0000-0000-0000-000000000001";
const L2 = "aaaaaaaa-0000-0000-0000-000000000002";
const MISSING = "ffffffff-0000-0000-0000-000000000000";
const TS = "2026-08-03T10:00:00.000Z";

let evCounter = 0;
function ev(): string {
  evCounter += 1;
  return "eeeeeeee-0000-0000-0000-" + String(evCounter).padStart(12, "0");
}

function lastError(doc: ContentDocument): string | undefined {
  return doc.operations.global.at(-1)?.error ?? undefined;
}

describe("Content — full lifecycle scenario", () => {
  it("drives an item from IDEA through PUBLISHED to REPURPOSE", () => {
    let doc = utils.createDocument();

    // definition — every setter with a real value
    doc = reducer(doc, setTitle({ title: "LinkedIn thought-leadership post" }));
    doc = reducer(doc, setBrief({ brief: "A short POV on lead-gen ops." }));
    doc = reducer(doc, setFormat({ format: "ARTICLE" }));
    doc = reducer(doc, setChannels({ channels: ["LINKEDIN", "WEB"] }));
    doc = reducer(
      doc,
      setTargetDate({ targetDate: "2026-09-01T00:00:00.000Z" }),
    );
    doc = reducer(doc, setDraftUrl({ draftUrl: "https://drafts.example/1" }));
    doc = reducer(
      doc,
      setCampaign({ campaignId: "campaign-123", campaignName: "Q3 GTM" }),
    );
    doc = reducer(
      doc,
      addAssetLink({
        id: L1,
        label: "Hero image",
        url: "https://cdn.example/a.png",
      }),
    );
    doc = reducer(
      doc,
      addAssetLink({ id: L2, url: "https://cdn.example/b.png" }),
    );
    doc = reducer(
      doc,
      updateAssetLink({
        id: L1,
        label: "Updated hero",
        url: "https://cdn.example/a2.png",
      }),
    );

    expect(doc.state.global.title).toBe("LinkedIn thought-leadership post");
    expect(doc.state.global.format).toBe("ARTICLE");
    expect(doc.state.global.channels).toStrictEqual(["LINKEDIN", "WEB"]);
    expect(doc.state.global.campaignName).toBe("Q3 GTM");
    expect(doc.state.global.assetLinks).toHaveLength(2);
    expect(doc.state.global.assetLinks[0].label).toBe("Updated hero");
    expect(doc.state.global.assetLinks[1].label).toBeNull();

    // lifecycle
    doc = reducer(doc, assignOwner({ owner: "Nik", timestamp: TS }));
    doc = reducer(
      doc,
      advanceStage({
        eventId: ev(),
        toStage: "DRAFTING",
        actor: "Nik",
        timestamp: TS,
        note: "starting",
      }),
    );
    // no actor / note -> the `|| null` false branches
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "REVIEW", timestamp: TS }),
    );
    // send-back
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "DRAFTING", timestamp: TS }),
    );
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "REVIEW", timestamp: TS }),
    );
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "SCHEDULED", timestamp: TS }),
    );
    doc = reducer(
      doc,
      publish({
        eventId: ev(),
        publishedUrl: "https://live.example/post",
        publishedDate: "2026-09-02T00:00:00.000Z",
        actor: "Nik",
        timestamp: TS,
        note: "shipped",
      }),
    );
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "REPURPOSE", timestamp: TS }),
    );
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "DRAFTING", timestamp: TS }),
    );

    expect(doc.state.global.currentStage).toBe("DRAFTING");
    expect(doc.state.global.status).toBe("ACTIVE");
    expect(doc.state.global.owner).toBe("Nik");
    expect(doc.state.global.publishedUrl).toBe("https://live.example/post");
    expect(doc.state.global.publishedDate).toBe("2026-09-02T00:00:00.000Z");
    // advance x7 + publish x1 = 8 history events (assignOwner is not history)
    expect(doc.state.global.history).toHaveLength(8);
    expect(doc.state.global.history[0]).toMatchObject({
      fromStage: "IDEA",
      toStage: "DRAFTING",
      actor: "Nik",
      note: "starting",
    });
    expect(doc.state.global.history[1].actor).toBeNull();
    expect(doc.state.global.history[1].note).toBeNull();
  });
});

describe("Content — optional / falsy branches", () => {
  it("clears optional fields with empty or falsy inputs", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, setBrief({ brief: null }));
    doc = reducer(doc, setTargetDate({}));
    doc = reducer(doc, setDraftUrl({}));
    doc = reducer(doc, setCampaign({}));

    expect(doc.state.global.brief).toBeNull();
    expect(doc.state.global.targetDate).toBeNull();
    expect(doc.state.global.draftUrl).toBeNull();
    expect(doc.state.global.campaignId).toBeNull();
    expect(doc.state.global.campaignName).toBeNull();
  });

  it("updates and removes asset links across all update branches", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addAssetLink({ id: L1, label: "one", url: "https://x/1" }),
    );

    // label present but null -> `?? null`
    doc = reducer(doc, updateAssetLink({ id: L1, label: null }));
    expect(doc.state.global.assetLinks[0].label).toBeNull();

    // label key omitted (undefined) + url present
    doc = reducer(doc, updateAssetLink({ id: L1, url: "https://x/2" }));
    expect(doc.state.global.assetLinks[0].url).toBe("https://x/2");

    // neither label nor url -> both conditionals skip
    doc = reducer(doc, updateAssetLink({ id: L1 }));
    expect(doc.state.global.assetLinks[0].url).toBe("https://x/2");

    doc = reducer(doc, removeAssetLink({ id: L1 }));
    expect(doc.state.global.assetLinks).toHaveLength(0);
  });

  it("adds uploaded-attachment assets (with full metadata and with none)", () => {
    let doc = utils.createDocument();
    // full metadata, no external url
    doc = reducer(
      doc,
      addAssetLink({
        id: L1,
        label: "Hero",
        attachmentRef: "attachment://v1:abc123",
        fileName: "hero.png",
        mimeType: "image/png",
        sizeBytes: 2048,
      }),
    );
    // attachment ref only -> fileName/mimeType/sizeBytes fall back to null
    doc = reducer(
      doc,
      addAssetLink({ id: L2, attachmentRef: "attachment://v1:def456" }),
    );

    expect(doc.state.global.assetLinks).toHaveLength(2);
    expect(doc.state.global.assetLinks[0]).toMatchObject({
      attachmentRef: "attachment://v1:abc123",
      fileName: "hero.png",
      mimeType: "image/png",
      sizeBytes: 2048,
      url: null,
    });
    expect(doc.state.global.assetLinks[1]).toMatchObject({
      attachmentRef: "attachment://v1:def456",
      fileName: null,
      mimeType: null,
      sizeBytes: null,
      url: null,
    });
  });

  it("parks with an actor then resumes (with and without an actor)", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, assignOwner({ owner: "Nik", timestamp: TS }));
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "DRAFTING", timestamp: TS }),
    );

    doc = reducer(
      doc,
      park({ eventId: ev(), reason: "on hold", actor: "Nik", timestamp: TS }),
    );
    expect(doc.state.global.status).toBe("PARKED");
    expect(doc.state.global.dispositionReason).toBe("on hold");

    doc = reducer(doc, resume({ eventId: ev(), actor: "Nik", timestamp: TS }));
    expect(doc.state.global.status).toBe("ACTIVE");
    expect(doc.state.global.dispositionReason).toBeNull();

    // resume again with no actor -> actor `|| null` false branch (harmless no-op)
    doc = reducer(doc, resume({ eventId: ev(), timestamp: TS }));
    expect(doc.state.global.status).toBe("ACTIVE");
    expect(doc.state.global.history.at(-1)?.actor).toBeNull();
  });

  it("publishes without an actor or note", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, assignOwner({ owner: "Nik", timestamp: TS }));
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "DRAFTING", timestamp: TS }),
    );
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "REVIEW", timestamp: TS }),
    );
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "SCHEDULED", timestamp: TS }),
    );
    doc = reducer(
      doc,
      publish({
        eventId: ev(),
        publishedUrl: "https://x/p",
        publishedDate: "2026-09-02T00:00:00.000Z",
        timestamp: TS,
      }),
    );
    expect(doc.state.global.currentStage).toBe("PUBLISHED");
    expect(doc.state.global.history.at(-1)?.actor).toBeNull();
    expect(doc.state.global.history.at(-1)?.note).toBeNull();
  });

  it("kills without an actor", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      kill({ eventId: ev(), reason: "duplicate", timestamp: TS }),
    );
    expect(doc.state.global.status).toBe("KILLED");
    expect(doc.state.global.history.at(-1)?.actor).toBeNull();
  });
});

describe("Content — errors", () => {
  it("ASSIGN_OWNER rejects a blank owner", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, assignOwner({ owner: "   ", timestamp: TS }));
    expect(lastError(doc)).toBe("An owner name is required");
    expect(doc.state.global.owner).toBeNull();
  });

  it("ADVANCE_STAGE requires an owner before leaving IDEA", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "DRAFTING", timestamp: TS }),
    );
    expect(lastError(doc)).toBe(
      "Assign an owner before leaving the IDEA stage",
    );
    expect(doc.state.global.currentStage).toBe("IDEA");
  });

  it("ADVANCE_STAGE rejects a disallowed transition", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, assignOwner({ owner: "Nik", timestamp: TS }));
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "REVIEW", timestamp: TS }),
    );
    expect(lastError(doc)).toBe("Cannot move from IDEA to REVIEW");
    expect(doc.state.global.currentStage).toBe("IDEA");
  });

  it("ADVANCE_STAGE rejects moving to PUBLISHED directly", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, assignOwner({ owner: "Nik", timestamp: TS }));
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "PUBLISHED", timestamp: TS }),
    );
    expect(lastError(doc)).toBe("Use PUBLISH to move an item to PUBLISHED");
  });

  it("ADVANCE_STAGE rejects a non-active item", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, assignOwner({ owner: "Nik", timestamp: TS }));
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "DRAFTING", timestamp: TS }),
    );
    doc = reducer(doc, park({ eventId: ev(), reason: "hold", timestamp: TS }));
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "REVIEW", timestamp: TS }),
    );
    expect(lastError(doc)).toBe("Only an active item can change stage");
    expect(doc.state.global.currentStage).toBe("DRAFTING");
  });

  it("PUBLISH rejects a non-scheduled item", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, assignOwner({ owner: "Nik", timestamp: TS }));
    doc = reducer(
      doc,
      advanceStage({ eventId: ev(), toStage: "DRAFTING", timestamp: TS }),
    );
    doc = reducer(
      doc,
      publish({
        eventId: ev(),
        publishedUrl: "https://x/p",
        publishedDate: "2026-09-02T00:00:00.000Z",
        timestamp: TS,
      }),
    );
    expect(lastError(doc)).toBe("Only a scheduled item can be published");
    expect(doc.state.global.currentStage).toBe("DRAFTING");
  });

  it("PUBLISH rejects a non-active item", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, kill({ eventId: ev(), reason: "nope", timestamp: TS }));
    doc = reducer(
      doc,
      publish({
        eventId: ev(),
        publishedUrl: "https://x/p",
        publishedDate: "2026-09-02T00:00:00.000Z",
        timestamp: TS,
      }),
    );
    expect(lastError(doc)).toBe("Only an active item can be published");
  });

  it("PARK requires a reason", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, park({ eventId: ev(), reason: "  ", timestamp: TS }));
    expect(lastError(doc)).toBe("A reason is required to park an item");
    expect(doc.state.global.status).toBe("ACTIVE");
  });

  it("PARK rejects a killed item", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, kill({ eventId: ev(), reason: "dead", timestamp: TS }));
    doc = reducer(doc, park({ eventId: ev(), reason: "hold", timestamp: TS }));
    expect(lastError(doc)).toBe("A killed item cannot be parked");
    expect(doc.state.global.status).toBe("KILLED");
  });

  it("KILL requires a reason", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, kill({ eventId: ev(), reason: "", timestamp: TS }));
    expect(lastError(doc)).toBe("A reason is required to kill an item");
    expect(doc.state.global.status).toBe("ACTIVE");
  });

  it("KILL rejects an already-killed item", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, kill({ eventId: ev(), reason: "dead", timestamp: TS }));
    doc = reducer(doc, kill({ eventId: ev(), reason: "again", timestamp: TS }));
    expect(lastError(doc)).toBe("The item is already killed");
  });

  it("RESUME rejects a killed item", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, kill({ eventId: ev(), reason: "dead", timestamp: TS }));
    doc = reducer(doc, resume({ eventId: ev(), timestamp: TS }));
    expect(lastError(doc)).toBe("A killed item cannot be resumed");
    expect(doc.state.global.status).toBe("KILLED");
  });

  it("ADD_ASSET_LINK requires a url or an attachment", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addAssetLink({ id: L1, label: "orphan" }));
    expect(lastError(doc)).toBe(
      "An asset link needs either a url or an uploaded file",
    );
    expect(doc.state.global.assetLinks).toHaveLength(0);
  });

  it("UPDATE_ASSET_LINK and REMOVE_ASSET_LINK reject a missing link", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, updateAssetLink({ id: MISSING, url: "https://x/1" }));
    expect(lastError(doc)).toBe("Asset link not found");
    doc = reducer(doc, removeAssetLink({ id: MISSING }));
    expect(lastError(doc)).toBe("Asset link not found");
  });
});
