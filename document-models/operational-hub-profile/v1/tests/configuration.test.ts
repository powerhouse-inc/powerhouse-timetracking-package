import { generateMock } from "document-model";
import {
  addSubteam,
  AddSubteamInputSchema,
  isOperationalHubProfileDocument,
  reducer,
  removeSubteam,
  RemoveSubteamInputSchema,
  setOperationalHubName,
  SetOperationalHubNameInputSchema,
  setOperatorTeam,
  SetOperatorTeamInputSchema,
  utils,
} from "document-models/operational-hub-profile/v1";
import { describe, expect, it } from "vitest";

describe("ConfigurationOperations", () => {
  it("should handle setOperationalHubName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetOperationalHubNameInputSchema());

    const updatedDocument = reducer(document, setOperationalHubName(input));

    expect(isOperationalHubProfileDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_OPERATIONAL_HUB_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should set the operational hub name on state", () => {
    const document = utils.createDocument();

    const updatedDocument = reducer(
      document,
      setOperationalHubName({ name: "Ops Hub Alpha" }),
    );

    expect(updatedDocument.state.global.name).toBe("Ops Hub Alpha");
    expect(updatedDocument.operations.global[0].error).toBeUndefined();
  });

  it("should handle setOperatorTeam operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetOperatorTeamInputSchema());

    const updatedDocument = reducer(document, setOperatorTeam(input));

    expect(isOperationalHubProfileDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_OPERATOR_TEAM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should set operatorTeam when a truthy PHID is provided", () => {
    const document = utils.createDocument();

    const updatedDocument = reducer(
      document,
      setOperatorTeam({ operatorTeam: "phid-operator-team-1" }),
    );

    expect(updatedDocument.state.global.operatorTeam).toBe(
      "phid-operator-team-1",
    );
  });

  it("should coerce a falsy operatorTeam (empty string) to null", () => {
    const document = utils.createDocument();

    const updatedDocument = reducer(
      document,
      setOperatorTeam({ operatorTeam: "" }),
    );

    expect(updatedDocument.state.global.operatorTeam).toBeNull();
  });

  it("should coerce an omitted operatorTeam to null", () => {
    const document = utils.createDocument();

    const updatedDocument = reducer(document, setOperatorTeam({}));

    expect(updatedDocument.state.global.operatorTeam).toBeNull();
  });

  it("should handle addSubteam operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSubteamInputSchema());

    const updatedDocument = reducer(document, addSubteam(input));

    expect(isOperationalHubProfileDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SUBTEAM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should add a new subteam to state", () => {
    const document = utils.createDocument();

    const updatedDocument = reducer(
      document,
      addSubteam({ subteam: "phid-subteam-1" }),
    );

    expect(updatedDocument.state.global.subteams).toEqual(["phid-subteam-1"]);
  });

  it("should not add a duplicate subteam", () => {
    const document = utils.createDocument();

    let updatedDocument = reducer(
      document,
      addSubteam({ subteam: "phid-subteam-1" }),
    );
    updatedDocument = reducer(
      updatedDocument,
      addSubteam({ subteam: "phid-subteam-1" }),
    );

    expect(updatedDocument.state.global.subteams).toEqual(["phid-subteam-1"]);
    expect(updatedDocument.operations.global).toHaveLength(2);
  });

  it("should handle removeSubteam operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSubteamInputSchema());

    const updatedDocument = reducer(document, removeSubteam(input));

    expect(isOperationalHubProfileDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SUBTEAM",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should remove an existing subteam from state", () => {
    const document = utils.createDocument();

    let updatedDocument = reducer(
      document,
      addSubteam({ subteam: "phid-subteam-1" }),
    );
    updatedDocument = reducer(
      updatedDocument,
      addSubteam({ subteam: "phid-subteam-2" }),
    );
    updatedDocument = reducer(
      updatedDocument,
      removeSubteam({ subteam: "phid-subteam-1" }),
    );

    expect(updatedDocument.state.global.subteams).toEqual(["phid-subteam-2"]);
  });

  it("should be a no-op when removing a subteam that does not exist", () => {
    const document = utils.createDocument();

    let updatedDocument = reducer(
      document,
      addSubteam({ subteam: "phid-subteam-1" }),
    );
    updatedDocument = reducer(
      updatedDocument,
      removeSubteam({ subteam: "phid-does-not-exist" }),
    );

    expect(updatedDocument.state.global.subteams).toEqual(["phid-subteam-1"]);
    expect(updatedDocument.operations.global).toHaveLength(2);
  });

  it("should run a full configuration scenario end to end", () => {
    const document = utils.createDocument();

    let doc = reducer(
      document,
      setOperationalHubName({ name: "Operational Hub" }),
    );
    doc = reducer(doc, setOperatorTeam({ operatorTeam: "phid-operator" }));
    doc = reducer(doc, addSubteam({ subteam: "phid-a" }));
    doc = reducer(doc, addSubteam({ subteam: "phid-b" }));
    doc = reducer(doc, addSubteam({ subteam: "phid-c" }));
    doc = reducer(doc, addSubteam({ subteam: "phid-b" })); // duplicate, ignored
    doc = reducer(doc, removeSubteam({ subteam: "phid-b" }));
    doc = reducer(doc, setOperatorTeam({})); // clear operator team

    expect(doc.state.global.name).toBe("Operational Hub");
    expect(doc.state.global.operatorTeam).toBeNull();
    expect(doc.state.global.subteams).toEqual(["phid-a", "phid-c"]);
    expect(doc.operations.global).toHaveLength(8);
  });
});
