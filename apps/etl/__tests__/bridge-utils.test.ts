import { describe, it, expect } from "vitest";
import { isNumericId, mapStatus } from "../src/bridge/utils";

describe("isNumericId()", () => {
  it("returns true for numeric strings", () => {
    expect(isNumericId("12345")).toBe(true);
    expect(isNumericId("0")).toBe(true);
    expect(isNumericId("9999999999")).toBe(true);
  });

  it("returns false for non-numeric strings", () => {
    expect(isNumericId("abc")).toBe(false);
    expect(isNumericId("12a34")).toBe(false);
    expect(isNumericId("")).toBe(false);
    expect(isNumericId("12.34")).toBe(false);
    expect(isNumericId("-1")).toBe(false);
  });
});

describe("mapStatus()", () => {
  const past = new Date("2020-01-01");
  const future = new Date("2099-01-01");

  it("maps 'finished' statusType", () => {
    expect(mapStatus("finished", null, past)).toBe("finished");
    expect(mapStatus("Finished", null, past)).toBe("finished");
  });

  it("maps 'inprogress' and 'live' statusType", () => {
    expect(mapStatus("inprogress", null, past)).toBe("live");
    expect(mapStatus("live", null, past)).toBe("live");
  });

  it("maps 'notstarted' statusType", () => {
    expect(mapStatus("notstarted", null, future)).toBe("scheduled");
  });

  it("falls back to statusCode when statusType is null", () => {
    expect(mapStatus(null, 100, past)).toBe("finished");
    expect(mapStatus(null, 0, future)).toBe("scheduled");
    expect(mapStatus(null, 1, future)).toBe("scheduled");
    expect(mapStatus(null, 2, past)).toBe("live");
    expect(mapStatus(null, 3, past)).toBe("live");
  });

  it("falls back to date comparison when both are null/unknown", () => {
    expect(mapStatus(null, null, past)).toBe("finished");
    expect(mapStatus(null, null, future)).toBe("scheduled");
  });
});
