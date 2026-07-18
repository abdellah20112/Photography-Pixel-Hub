import { describe, it, expect } from "vitest";

import { statisticsEngine } from "@/services/analytics.service";
import { exportService } from "@/services/analytics.service";
import { resolveDateRange } from "@/services/analytics.service";

/* ============================================
   Statistics Engine Tests
   ============================================ */

describe("statisticsEngine.percentage", () => {
  it("returns 0 for 0 total", () => {
    expect(statisticsEngine.percentage(5, 0)).toBe(0);
  });

  it("returns 50 for half", () => {
    expect(statisticsEngine.percentage(5, 10)).toBe(50);
  });

  it("returns 100 for full", () => {
    expect(statisticsEngine.percentage(10, 10)).toBe(100);
  });

  it("returns 33 for 1/3", () => {
    expect(statisticsEngine.percentage(1, 3)).toBe(33);
  });
});

describe("statisticsEngine.average", () => {
  it("returns 0 for empty array", () => {
    expect(statisticsEngine.average([])).toBe(0);
  });

  it("calculates average correctly", () => {
    expect(statisticsEngine.average([10, 20, 30])).toBe(20);
  });

  it("rounds to nearest integer", () => {
    expect(statisticsEngine.average([1, 2])).toBe(2);
  });
});

describe("statisticsEngine.growthRate", () => {
  it("returns 100 for growth from 0", () => {
    expect(statisticsEngine.growthRate(100, 0)).toBe(100);
  });

  it("returns 0 for no growth", () => {
    expect(statisticsEngine.growthRate(100, 100)).toBe(0);
  });

  it("returns positive growth", () => {
    expect(statisticsEngine.growthRate(150, 100)).toBe(50);
  });

  it("returns negative growth", () => {
    expect(statisticsEngine.growthRate(50, 100)).toBe(-50);
  });
});

/* ============================================
   Export Service Tests
   ============================================ */

describe("exportService.toCSV", () => {
  it("generates CSV with headers and data", () => {
    const data = [{ name: "Test", value: 100 }];
    const csv = exportService.toCSV(data, ["name", "value"]);
    expect(csv).toContain("name");
    expect(csv).toContain("value");
    expect(csv).toContain("Test");
    expect(csv).toContain("100");
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("escapes commas in values", () => {
    const data = [{ name: "Name, with comma", value: 1 }];
    const csv = exportService.toCSV(data, ["name", "value"]);
    expect(csv).toContain('"Name, with comma"');
  });

  it("handles null values", () => {
    const data = [{ name: null, value: 1 }];
    const csv = exportService.toCSV(data, ["name", "value"]);
    expect(csv).toContain("1");
  });
});

describe("exportService.toExcel", () => {
  it("generates Excel-compatible CSV", () => {
    const data = [{ name: "Test", value: 50 }];
    const result = exportService.toExcel(data, ["name", "value"]);
    expect(result).toContain("Test");
    expect(result).toContain("50");
  });
});

describe("exportService.toPDF", () => {
  it("throws not implemented error", async () => {
    await expect(exportService.toPDF({})).rejects.toThrow("PDF");
  });
});

/* ============================================
   resolveDateRange Tests
   ============================================ */

describe("resolveDateRange", () => {
  it("returns today range for 'today'", () => {
    const range = resolveDateRange("today");
    expect(range.startDate.getDate()).toBe(range.endDate.getDate());
  });

  it("returns month range for 'month'", () => {
    const range = resolveDateRange("month");
    expect(range.startDate.getMonth()).toBe(range.endDate.getMonth());
    expect(range.startDate.getDate()).toBe(1);
  });

  it("returns year range for 'year'", () => {
    const range = resolveDateRange("year");
    expect(range.startDate.getFullYear()).toBe(range.endDate.getFullYear());
    expect(range.startDate.getMonth()).toBe(0);
    expect(range.startDate.getDate()).toBe(1);
  });

  it("returns custom range for 'custom'", () => {
    const range = resolveDateRange("custom", { start: "2026-01-01", end: "2026-06-30" });
    expect(range.startDate.getFullYear()).toBe(2026);
    expect(range.startDate.getMonth()).toBe(0);
    expect(range.endDate.getMonth()).toBe(5);
  });

  it("defaults to month for unknown preset", () => {
    const range = resolveDateRange("unknown");
    expect(range.startDate.getDate()).toBe(1);
  });
});
