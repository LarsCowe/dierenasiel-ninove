import { describe, it, expect, vi, afterEach } from "vitest";
import { getBelgianDayBounds } from "./date";

describe("getBelgianDayBounds", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns end exactly 24h after start on a normal CET day", () => {
    vi.setSystemTime(new Date("2026-02-26T10:00:00Z"));
    const { start, end } = getBelgianDayBounds();
    expect(end.getTime() - start.getTime()).toBe(86_400_000);
  });

  it("returns correct boundaries for Belgian winter time (CET, UTC+1)", () => {
    // 2026-02-26 10:00 UTC = 2026-02-26 11:00 CET
    vi.setSystemTime(new Date("2026-02-26T10:00:00Z"));
    const { start, end } = getBelgianDayBounds();
    // Belgian day starts at midnight CET = 23:00 UTC previous day
    expect(start.toISOString()).toBe("2026-02-25T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-02-26T23:00:00.000Z");
  });

  it("returns correct boundaries for Belgian summer time (CEST, UTC+2)", () => {
    // 2026-07-15 10:00 UTC = 2026-07-15 12:00 CEST
    vi.setSystemTime(new Date("2026-07-15T10:00:00Z"));
    const { start, end } = getBelgianDayBounds();
    // Belgian day starts at midnight CEST = 22:00 UTC previous day
    expect(start.toISOString()).toBe("2026-07-14T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-15T22:00:00.000Z");
  });

  it("handles late night in Belgium (23:30 CET still same Belgian day)", () => {
    // 2026-02-26 22:30 UTC = 2026-02-26 23:30 CET — still Feb 26 in Belgium
    vi.setSystemTime(new Date("2026-02-26T22:30:00Z"));
    const { start, end } = getBelgianDayBounds();
    expect(start.toISOString()).toBe("2026-02-25T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-02-26T23:00:00.000Z");
  });

  it("handles just after midnight UTC in winter (01:30 CET = next Belgian day)", () => {
    // 2026-02-27 00:30 UTC = 2026-02-27 01:30 CET — Feb 27 in Belgium
    vi.setSystemTime(new Date("2026-02-27T00:30:00Z"));
    const { start, end } = getBelgianDayBounds();
    expect(start.toISOString()).toBe("2026-02-26T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-02-27T23:00:00.000Z");
  });

  it("handles DST spring-forward (23h day on Mar 29, 2026)", () => {
    // DST transition: clocks spring forward at 02:00 CET → 03:00 CEST
    vi.setSystemTime(new Date("2026-03-29T10:00:00Z"));
    const { start, end } = getBelgianDayBounds();
    // Day starts at midnight CET (UTC+1) = 23:00 UTC on Mar 28
    expect(start.toISOString()).toBe("2026-03-28T23:00:00.000Z");
    // Day ends at midnight CEST (UTC+2) = 22:00 UTC on Mar 29
    expect(end.toISOString()).toBe("2026-03-29T22:00:00.000Z");
    // Only 23 hours due to spring forward
    expect(end.getTime() - start.getTime()).toBe(23 * 3_600_000);
  });

  it("handles DST fall-back (25h day on Oct 25, 2026)", () => {
    // DST transition: clocks fall back at 03:00 CEST → 02:00 CET
    vi.setSystemTime(new Date("2026-10-25T10:00:00Z"));
    const { start, end } = getBelgianDayBounds();
    // Day starts at midnight CEST (UTC+2) = 22:00 UTC on Oct 24
    expect(start.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    // Day ends at midnight CET (UTC+1) = 23:00 UTC on Oct 25
    expect(end.toISOString()).toBe("2026-10-25T23:00:00.000Z");
    // 25 hours due to fall back
    expect(end.getTime() - start.getTime()).toBe(25 * 3_600_000);
  });
});
