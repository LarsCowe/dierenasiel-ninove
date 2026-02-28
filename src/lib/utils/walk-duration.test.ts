import { describe, it, expect, vi, afterEach } from "vitest";
import { getWalkStatus, elapsedTime } from "./walk-duration";

describe("getWalkStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'overdue' when walk exceeds 4 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T18:01:00"));
    expect(getWalkStatus("14:00")).toBe("overdue");
  });

  it("returns 'long' when walk exceeds 2 hours but not 4", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T16:30:00"));
    expect(getWalkStatus("14:00")).toBe("long");
  });

  it("returns 'normal' when walk is under 2 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T15:00:00"));
    expect(getWalkStatus("14:00")).toBe("normal");
  });

  it("returns 'long' at exactly 4 hours (boundary)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T18:00:00"));
    expect(getWalkStatus("14:00")).toBe("long");
  });

  it("returns 'long' at exactly 2 hours + 1 minute", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T16:01:00"));
    expect(getWalkStatus("14:00")).toBe("long");
  });

  it("returns 'normal' at exactly 2 hours (boundary)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T16:00:00"));
    expect(getWalkStatus("14:00")).toBe("normal");
  });

  it("returns 'normal' when start time is in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T13:00:00"));
    expect(getWalkStatus("14:00")).toBe("normal");
  });
});

describe("elapsedTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats hours and minutes correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T16:30:00"));
    expect(elapsedTime("14:00")).toBe("2u 30min");
  });

  it("formats minutes only when under 1 hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T14:45:00"));
    expect(elapsedTime("14:00")).toBe("45min");
  });

  it("returns dash when start is in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T13:00:00"));
    expect(elapsedTime("14:00")).toBe("—");
  });

  it("shows 0min at exact start time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T14:00:00"));
    expect(elapsedTime("14:00")).toBe("0min");
  });
});
