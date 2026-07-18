import { describe, it, expect } from "vitest";

import { calculatePricing, recalculatePricing, PRICING } from "@/lib/pricing/pricing.service";

/* ============================================
   Pricing Service Tests
   ============================================ */

describe("calculatePricing", () => {
  it("returns 150 for 1 video", () => {
    const result = calculatePricing(1);
    expect(result.pricePerVideo).toBe(150);
    expect(result.totalAmount).toBe(150);
  });

  it("returns 200 for 2 videos (100 per video)", () => {
    const result = calculatePricing(2);
    expect(result.pricePerVideo).toBe(100);
    expect(result.totalAmount).toBe(200);
  });

  it("returns 500 for 5 videos (100 per video)", () => {
    const result = calculatePricing(5);
    expect(result.pricePerVideo).toBe(100);
    expect(result.totalAmount).toBe(500);
  });

  it("returns 1000 for 10 videos", () => {
    const result = calculatePricing(10);
    expect(result.pricePerVideo).toBe(100);
    expect(result.totalAmount).toBe(1000);
  });

  it("returns 0 for 0 videos", () => {
    const result = calculatePricing(0);
    expect(result.pricePerVideo).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it("returns 0 for negative videos", () => {
    const result = calculatePricing(-1);
    expect(result.pricePerVideo).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it("uses single video price for exactly 1 video", () => {
    expect(calculatePricing(1).pricePerVideo).toBe(PRICING.SINGLE_VIDEO_PRICE);
  });

  it("uses multi video price for 2+ videos", () => {
    expect(calculatePricing(2).pricePerVideo).toBe(PRICING.MULTI_VIDEO_PRICE_PER_VIDEO);
    expect(calculatePricing(3).pricePerVideo).toBe(PRICING.MULTI_VIDEO_PRICE_PER_VIDEO);
    expect(calculatePricing(10).pricePerVideo).toBe(PRICING.MULTI_VIDEO_PRICE_PER_VIDEO);
  });
});

describe("recalculatePricing", () => {
  it("recalculates when videos change from 1 to 3", () => {
    const result = recalculatePricing(1, 3);
    expect(result.pricePerVideo).toBe(100);
    expect(result.totalAmount).toBe(300);
  });

  it("recalculates when videos change from 5 to 1", () => {
    const result = recalculatePricing(5, 1);
    expect(result.pricePerVideo).toBe(150);
    expect(result.totalAmount).toBe(150);
  });

  it("recalculates when videos stay the same", () => {
    const result = recalculatePricing(3, 3);
    expect(result.pricePerVideo).toBe(100);
    expect(result.totalAmount).toBe(300);
  });
});
