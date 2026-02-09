import { describe, it, expect } from "vitest";
import { normalizeShotsFromSofaScore } from "../src/parsers/normalize";

describe("normalizeShotsFromSofaScore()", () => {
  it("returns empty array for null/undefined input", () => {
    expect(normalizeShotsFromSofaScore("m1", null)).toEqual([]);
    expect(normalizeShotsFromSofaScore("m1", undefined)).toEqual([]);
  });

  it("returns empty array for empty events", () => {
    expect(normalizeShotsFromSofaScore("m1", [])).toEqual([]);
    expect(normalizeShotsFromSofaScore("m1", { events: [] })).toEqual([]);
  });

  it("parses SofaScore shotmap format", () => {
    const json = [
      {
        id: "1001",
        type: "shot",
        player: { id: "p1", name: "Player One" },
        team: { id: "t1" },
        minute: 23,
        second: 15,
        shotType: "on_target",
        xg: 0.12,
        bodyPart: "right_foot",
        situation: "open_play",
        playerCoordinates: { x: 85, y: 45 },
      },
    ];

    const shots = normalizeShotsFromSofaScore("m1", json);
    expect(shots).toHaveLength(1);
    expect(shots[0]).toMatchObject({
      id: "m1:1001",
      matchId: "m1",
      playerId: "p1",
      playerName: "Player One",
      teamId: "t1",
      minute: 23,
      second: 15,
      outcome: "on_target",
      xg: 0.12,
      bodyPart: "right_foot",
      situation: "open_play",
      coordsX: 85,
      coordsY: 45,
    });
  });

  it("parses events wrapped in { events: [...] }", () => {
    const json = {
      events: [
        {
          id: "2001",
          type: "shot",
          playerId: "p2",
          teamId: "t2",
          minute: 50,
          outcome: "goal",
        },
      ],
    };

    const shots = normalizeShotsFromSofaScore("m2", json);
    expect(shots).toHaveLength(1);
    expect(shots[0]!.outcome).toBe("goal");
  });

  it("parses events wrapped in { shotmap: [...] }", () => {
    const json = {
      shotmap: [
        {
          id: "3001",
          type: "shot",
          playerId: "p3",
          teamId: "t3",
          minute: 10,
          shotType: "blocked",
        },
      ],
    };

    const shots = normalizeShotsFromSofaScore("m3", json);
    expect(shots).toHaveLength(1);
    expect(shots[0]!.outcome).toBe("blocked");
  });

  it("filters non-shot events", () => {
    const json = [
      { type: "corner", playerId: "p1", teamId: "t1", minute: 5 },
      {
        type: "shot",
        playerId: "p1",
        teamId: "t1",
        minute: 10,
        shotType: "off_target",
      },
      { type: "foul", playerId: "p1", teamId: "t1", minute: 15 },
    ];

    const shots = normalizeShotsFromSofaScore("m4", json);
    expect(shots).toHaveLength(1);
    expect(shots[0]!.minute).toBe(10);
  });

  it("maps outcome aliases correctly", () => {
    const makeShot = (shotType: string) => [
      { type: "shot", playerId: "p1", teamId: "t1", minute: 1, shotType },
    ];

    expect(normalizeShotsFromSofaScore("m", makeShot("save"))[0]!.outcome).toBe(
      "on_target",
    );
    expect(normalizeShotsFromSofaScore("m", makeShot("miss"))[0]!.outcome).toBe(
      "off_target",
    );
    expect(normalizeShotsFromSofaScore("m", makeShot("post"))[0]!.outcome).toBe(
      "off_target",
    );
    expect(
      normalizeShotsFromSofaScore("m", makeShot("block"))[0]!.outcome,
    ).toBe("blocked");
    expect(normalizeShotsFromSofaScore("m", makeShot("xyz"))[0]!.outcome).toBe(
      "unknown",
    );
  });

  it("derives teamId from isHome flag", () => {
    const json = [
      {
        type: "shot",
        playerId: "p1",
        isHome: true,
        minute: 1,
        shotType: "goal",
      },
    ];
    const shots = normalizeShotsFromSofaScore("m5", json, "home-t", "away-t");
    expect(shots[0]!.teamId).toBe("home-t");
  });

  it("handles missing optional fields gracefully", () => {
    const json = [{ type: "shot", playerId: "p1", teamId: "t1", minute: 30 }];
    const shots = normalizeShotsFromSofaScore("m6", json);
    expect(shots[0]!.xg).toBeUndefined();
    expect(shots[0]!.second).toBeUndefined();
    expect(shots[0]!.bodyPart).toBe("unknown");
    expect(shots[0]!.situation).toBe("unknown");
  });
});
