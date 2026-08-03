import type { DocumentModelGlobalState } from "document-model";

export const documentModel: DocumentModelGlobalState = {
  id: "powerhouse-ops/content",
  name: "Content",
  author: {
    name: "Powerhouse",
    website: "https://powerhouse.inc",
  },
  extension: "cnt",
  description:
    "A lead-gen content pipeline item: one document per content piece moving through a lightweight stage machine (idea to published to repurpose), with an owner, target channels, dates, links, an append-only stage history, and a soft campaign reference.",
  specifications: [
    {
      state: {
        local: {
          schema: "",
          examples: [],
          initialValue: "",
        },
        global: {
          schema:
            "enum ContentStage {\n  IDEA\n  DRAFTING\n  REVIEW\n  SCHEDULED\n  PUBLISHED\n  REPURPOSE\n}\n\nenum ContentStatus {\n  ACTIVE\n  PARKED\n  KILLED\n}\n\nenum ContentFormat {\n  POST\n  ARTICLE\n  VIDEO\n  ONE_PAGER\n  DM_SCRIPT\n  LEAD_MAGNET\n  OTHER\n}\n\nenum ContentChannel {\n  LINKEDIN\n  REDDIT\n  DISCORD\n  TELEGRAM\n  FACEBOOK_GROUP\n  FORUM\n  DIRECTORY\n  EMAIL\n  WEB\n  OTHER\n}\n\ntype StageEvent {\n  id: OID!\n  fromStage: ContentStage\n  toStage: ContentStage!\n  actor: String\n  timestamp: DateTime!\n  note: String\n}\n\ntype AssetLink {\n  id: OID!\n  label: String\n  url: URL\n  attachmentRef: String\n  fileName: String\n  mimeType: String\n  sizeBytes: Int\n}\n\ntype ContentState {\n  title: String!\n  brief: String\n  format: ContentFormat!\n  channels: [ContentChannel!]!\n  currentStage: ContentStage!\n  status: ContentStatus!\n  dispositionReason: String\n  owner: String\n  targetDate: Date\n  publishedUrl: URL\n  publishedDate: Date\n  draftUrl: URL\n  assetLinks: [AssetLink!]!\n  campaignId: PHID\n  campaignName: String\n  history: [StageEvent!]!\n  createdAt: DateTime\n  updatedAt: DateTime\n}",
          examples: [],
          initialValue:
            '{\n  "title": "",\n  "brief": null,\n  "format": "POST",\n  "channels": [],\n  "currentStage": "IDEA",\n  "status": "ACTIVE",\n  "dispositionReason": null,\n  "owner": null,\n  "targetDate": null,\n  "publishedUrl": null,\n  "publishedDate": null,\n  "draftUrl": null,\n  "assetLinks": [],\n  "campaignId": null,\n  "campaignName": null,\n  "history": [],\n  "createdAt": null,\n  "updatedAt": null\n}',
        },
      },
      modules: [
        {
          id: "392497da-712e-47f2-99a1-f9559057817d",
          name: "definition",
          description: "Content, targeting, dates, and links.",
          operations: [
            {
              id: "a6ae3330-4ab4-4930-bb80-f5f7fff3a0c4",
              name: "SET_TITLE",
              description: "Set the item title.",
              schema: "input SetTitleInput {\n  title: String!\n}",
              template: "",
              reducer: "state.title = action.input.title;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "3343e96d-f18c-4117-98f5-d86915d217a5",
              name: "SET_BRIEF",
              description: "Set the item brief / short description.",
              schema: "input SetBriefInput {\n  brief: String\n}",
              template: "",
              reducer: "state.brief = action.input.brief || null;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "29ad3ea6-91d7-4c1e-95e6-1bce4746b0a2",
              name: "SET_FORMAT",
              description: "Set the content format.",
              schema: "input SetFormatInput {\n  format: ContentFormat!\n}",
              template: "",
              reducer: "state.format = action.input.format;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "6415c6a1-8c3b-43e9-8c02-c02a0a397910",
              name: "SET_CHANNELS",
              description: "Set the target channels (replaces the whole set).",
              schema:
                "input SetChannelsInput {\n  channels: [ContentChannel!]!\n}",
              template: "",
              reducer: "state.channels = action.input.channels;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "619e40c6-1515-4710-82ca-53f1bc340833",
              name: "SET_TARGET_DATE",
              description: "Set (or clear) the target/publish date.",
              schema: "input SetTargetDateInput {\n  targetDate: Date\n}",
              template: "",
              reducer: "state.targetDate = action.input.targetDate || null;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "96703cff-22e3-43fe-b370-22cf59e33023",
              name: "SET_DRAFT_URL",
              description: "Set (or clear) the draft link.",
              schema: "input SetDraftUrlInput {\n  draftUrl: URL\n}",
              template: "",
              reducer: "state.draftUrl = action.input.draftUrl || null;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "7cecd815-72c8-4547-b074-2ec4000bfca1",
              name: "SET_CAMPAIGN",
              description:
                "Set (or clear) the soft campaign reference and its cached name.",
              schema:
                "input SetCampaignInput {\n  campaignId: PHID\n  campaignName: String\n}",
              template: "",
              reducer:
                "state.campaignId = action.input.campaignId || null;\nstate.campaignName = action.input.campaignName || null;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "a5f395f7-d9b4-45c4-b5c8-64e2db3444e1",
              name: "ADD_ASSET_LINK",
              description: "Add a related-asset link.",
              schema:
                "input AddAssetLinkInput {\n  id: OID!\n  label: String\n  url: URL\n  attachmentRef: String\n  fileName: String\n  mimeType: String\n  sizeBytes: Int\n}",
              template: "",
              reducer:
                'if (!action.input.url && !action.input.attachmentRef) {\n  throw new AssetSourceRequiredError(\n    "An asset link needs either a url or an uploaded file",\n  );\n}\nstate.assetLinks.push({\n  id: action.input.id,\n  label: action.input.label || null,\n  url: action.input.url || null,\n  attachmentRef: action.input.attachmentRef || null,\n  fileName: action.input.fileName || null,\n  mimeType: action.input.mimeType || null,\n  sizeBytes: action.input.sizeBytes ?? null,\n});',
              errors: [
                {
                  id: "b1c2d3e4-0000-0000-0000-000000000001",
                  name: "AssetSourceRequiredError",
                  code: "ASSET_SOURCE_REQUIRED",
                  description:
                    "An asset link must have either a url or an uploaded attachment.",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "d380c24a-8eed-46d2-ab85-57d0f9877f1e",
              name: "UPDATE_ASSET_LINK",
              description: "Update a related-asset link.",
              schema:
                "input UpdateAssetLinkInput {\n  id: OID!\n  label: String\n  url: URL\n}",
              template: "",
              reducer:
                'const link = state.assetLinks.find((l) => l.id === action.input.id);\nif (!link) {\n  throw new AssetLinkNotFoundError("Asset link not found");\n}\nif (action.input.label !== undefined) link.label = action.input.label ?? null;\nif (action.input.url) link.url = action.input.url;',
              errors: [
                {
                  id: "98989ff2-a5ab-4e42-bdc2-b7a70d1472e9",
                  name: "AssetLinkNotFoundError",
                  code: "ASSET_LINK_NOT_FOUND",
                  description: "No asset link exists with the given id.",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "f7565a29-9153-463a-a7a7-8b52bd09c20d",
              name: "REMOVE_ASSET_LINK",
              description: "Remove a related-asset link.",
              schema: "input RemoveAssetLinkInput {\n  id: OID!\n}",
              template: "",
              reducer:
                'const index = state.assetLinks.findIndex((l) => l.id === action.input.id);\nif (index === -1) {\n  throw new AssetLinkNotFoundError("Asset link not found");\n}\nstate.assetLinks.splice(index, 1);',
              errors: [
                {
                  id: "610ef0a6-29d1-4a1f-80ff-ad6b471693e3",
                  name: "AssetLinkNotFoundError",
                  code: "ASSET_LINK_NOT_FOUND",
                  description: "No asset link exists with the given id.",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
          ],
        },
        {
          id: "9d68a299-dd5e-4419-9ba9-ee0640a766e8",
          name: "lifecycle",
          description:
            "Stage machine, ownership, and disposition (park/kill/resume).",
          operations: [
            {
              id: "b7184130-217f-4adb-8412-1dcfd60707cb",
              name: "ASSIGN_OWNER",
              description: "Assign (reassign) the accountable owner.",
              schema:
                "input AssignOwnerInput {\n  owner: String!\n  timestamp: DateTime!\n}",
              template: "",
              reducer:
                'if (!action.input.owner.trim()) {\n  throw new EmptyOwnerError("An owner name is required");\n}\nstate.owner = action.input.owner;\nstate.updatedAt = action.input.timestamp;',
              errors: [
                {
                  id: "377fa8c1-84c1-4962-96e6-d6c7d4479f4b",
                  name: "EmptyOwnerError",
                  code: "EMPTY_OWNER",
                  description: "An owner name must be a non-empty string.",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "6284991a-8893-4331-a688-b2da530c8cf0",
              name: "ADVANCE_STAGE",
              description:
                "Move the item to an allowed next stage and append to history.",
              schema:
                "input AdvanceStageInput {\n  eventId: OID!\n  toStage: ContentStage!\n  actor: String\n  timestamp: DateTime!\n  note: String\n}",
              template: "",
              reducer:
                'if (state.status !== "ACTIVE") {\n  throw new ItemNotActiveError("Only an active item can change stage");\n}\nconst from = state.currentStage;\nconst to = action.input.toStage;\nif (to === "PUBLISHED") {\n  throw new InvalidStageTransitionError("Use PUBLISH to move an item to PUBLISHED");\n}\nconst allowed: Record<string, string[]> = {\n  IDEA: ["DRAFTING"],\n  DRAFTING: ["REVIEW"],\n  REVIEW: ["SCHEDULED", "DRAFTING"],\n  SCHEDULED: [],\n  PUBLISHED: ["REPURPOSE"],\n  REPURPOSE: ["IDEA", "DRAFTING"],\n};\nif (!allowed[from].includes(to)) {\n  throw new InvalidStageTransitionError(`Cannot move from ${from} to ${to}`);\n}\nif (from === "IDEA" && !state.owner) {\n  throw new OwnerRequiredError("Assign an owner before leaving the IDEA stage");\n}\nstate.currentStage = to;\nstate.updatedAt = action.input.timestamp;\nstate.history.push({\n  id: action.input.eventId,\n  fromStage: from,\n  toStage: to,\n  actor: action.input.actor || null,\n  timestamp: action.input.timestamp,\n  note: action.input.note || null,\n});',
              errors: [
                {
                  id: "c5b98121-f73b-42cc-9536-7a46ce9f8bcf",
                  name: "InvalidStageTransitionError",
                  code: "INVALID_STAGE_TRANSITION",
                  description:
                    "The requested stage transition is not allowed by the stage machine.",
                  template: "",
                },
                {
                  id: "8e139d1d-f017-407d-ba4e-8d79048ead93",
                  name: "OwnerRequiredError",
                  code: "OWNER_REQUIRED",
                  description:
                    "An item must have an owner before leaving the IDEA stage.",
                  template: "",
                },
                {
                  id: "36a2af43-fd9e-47fd-bf38-245a309ed581",
                  name: "ItemNotActiveError",
                  code: "ITEM_NOT_ACTIVE",
                  description:
                    "The operation requires the item to be active (not parked or killed).",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "e4562098-678b-49a7-9044-54e715695561",
              name: "PUBLISH",
              description:
                "Publish a scheduled item (requires a published URL and date).",
              schema:
                "input PublishInput {\n  eventId: OID!\n  publishedUrl: URL!\n  publishedDate: Date!\n  actor: String\n  timestamp: DateTime!\n  note: String\n}",
              template: "",
              reducer:
                'if (state.status !== "ACTIVE") {\n  throw new ItemNotActiveError("Only an active item can be published");\n}\nconst from = state.currentStage;\nif (from !== "SCHEDULED") {\n  throw new InvalidStageTransitionError("Only a scheduled item can be published");\n}\nstate.publishedUrl = action.input.publishedUrl;\nstate.publishedDate = action.input.publishedDate;\nstate.currentStage = "PUBLISHED";\nstate.updatedAt = action.input.timestamp;\nstate.history.push({\n  id: action.input.eventId,\n  fromStage: from,\n  toStage: "PUBLISHED",\n  actor: action.input.actor || null,\n  timestamp: action.input.timestamp,\n  note: action.input.note || null,\n});',
              errors: [
                {
                  id: "e4153fdf-e81d-4cbd-81cc-cb5ece94ec8f",
                  name: "InvalidStageTransitionError",
                  code: "INVALID_STAGE_TRANSITION",
                  description:
                    "The requested stage transition is not allowed by the stage machine.",
                  template: "",
                },
                {
                  id: "91bd9fd5-ea01-4d02-9938-6dcc075cd0c3",
                  name: "ItemNotActiveError",
                  code: "ITEM_NOT_ACTIVE",
                  description:
                    "The operation requires the item to be active (not parked or killed).",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "5cfface1-4cae-497b-8324-34650cbd71f0",
              name: "PARK",
              description: "Park the item with a reason (resumable).",
              schema:
                "input ParkInput {\n  eventId: OID!\n  reason: String!\n  actor: String\n  timestamp: DateTime!\n}",
              template: "",
              reducer:
                'if (state.status === "KILLED") {\n  throw new ItemNotActiveError("A killed item cannot be parked");\n}\nif (!action.input.reason.trim()) {\n  throw new DispositionReasonRequiredError("A reason is required to park an item");\n}\nstate.status = "PARKED";\nstate.dispositionReason = action.input.reason;\nstate.updatedAt = action.input.timestamp;\nstate.history.push({\n  id: action.input.eventId,\n  fromStage: state.currentStage,\n  toStage: state.currentStage,\n  actor: action.input.actor || null,\n  timestamp: action.input.timestamp,\n  note: `Parked: ${action.input.reason}`,\n});',
              errors: [
                {
                  id: "318155df-2a54-43af-acff-bf48abe96145",
                  name: "DispositionReasonRequiredError",
                  code: "DISPOSITION_REASON_REQUIRED",
                  description: "A reason is required to park or kill an item.",
                  template: "",
                },
                {
                  id: "9a00a69e-861f-4435-b80b-f2009cfb25e9",
                  name: "ItemNotActiveError",
                  code: "ITEM_NOT_ACTIVE",
                  description:
                    "The operation requires the item to be active (not parked or killed).",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "3087d898-e922-40f5-989e-32436fac9509",
              name: "KILL",
              description:
                "Kill the item with a reason (terminal; kept for history).",
              schema:
                "input KillInput {\n  eventId: OID!\n  reason: String!\n  actor: String\n  timestamp: DateTime!\n}",
              template: "",
              reducer:
                'if (state.status === "KILLED") {\n  throw new ItemNotActiveError("The item is already killed");\n}\nif (!action.input.reason.trim()) {\n  throw new DispositionReasonRequiredError("A reason is required to kill an item");\n}\nstate.status = "KILLED";\nstate.dispositionReason = action.input.reason;\nstate.updatedAt = action.input.timestamp;\nstate.history.push({\n  id: action.input.eventId,\n  fromStage: state.currentStage,\n  toStage: state.currentStage,\n  actor: action.input.actor || null,\n  timestamp: action.input.timestamp,\n  note: `Killed: ${action.input.reason}`,\n});',
              errors: [
                {
                  id: "9a101d11-c053-4e34-8105-018d1a36a24b",
                  name: "DispositionReasonRequiredError",
                  code: "DISPOSITION_REASON_REQUIRED",
                  description: "A reason is required to park or kill an item.",
                  template: "",
                },
                {
                  id: "a63bf2aa-aa3f-4332-91d9-4ce9b40b02df",
                  name: "ItemNotActiveError",
                  code: "ITEM_NOT_ACTIVE",
                  description:
                    "The operation requires the item to be active (not parked or killed).",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "9586a013-1dc1-4dad-ae45-5bb8ccf28127",
              name: "RESUME",
              description: "Resume a parked item back to active.",
              schema:
                "input ResumeInput {\n  eventId: OID!\n  actor: String\n  timestamp: DateTime!\n}",
              template: "",
              reducer:
                'if (state.status === "KILLED") {\n  throw new CannotResumeKilledError("A killed item cannot be resumed");\n}\nstate.status = "ACTIVE";\nstate.dispositionReason = null;\nstate.updatedAt = action.input.timestamp;\nstate.history.push({\n  id: action.input.eventId,\n  fromStage: state.currentStage,\n  toStage: state.currentStage,\n  actor: action.input.actor || null,\n  timestamp: action.input.timestamp,\n  note: "Resumed",\n});',
              errors: [
                {
                  id: "cd3e48a9-758f-4ee4-b747-0488400a3937",
                  name: "CannotResumeKilledError",
                  code: "CANNOT_RESUME_KILLED",
                  description:
                    "A killed item is terminal and cannot be resumed.",
                  template: "",
                },
              ],
              examples: [],
              scope: "global",
            },
          ],
        },
      ],
      version: 1,
      changeLog: [],
    },
  ],
};
