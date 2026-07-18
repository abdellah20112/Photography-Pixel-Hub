/* ============================================
   Pricing Service
   Centralized business pricing rules.
   NEVER duplicate this logic elsewhere.
   ============================================ */

/** Pricing constants. */
export const PRICING = {
  SINGLE_VIDEO_PRICE: 150,
  MULTI_VIDEO_PRICE_PER_VIDEO: 100,
  MULTI_VIDEO_THRESHOLD: 2,
} as const;

/**
 * Calculate pricing based on videos count.
 *
 * Business rules:
 * - If videosCount == 1: totalAmount = 150, pricePerVideo = 150
 * - If videosCount >= 2: pricePerVideo = 100, totalAmount = videosCount × 100
 *
 * @returns { pricePerVideo, totalAmount }
 */
export function calculatePricing(videosCount: number): {
  pricePerVideo: number;
  totalAmount: number;
} {
  if (videosCount < 1) {
    return { pricePerVideo: 0, totalAmount: 0 };
  }

  if (videosCount === 1) {
    return {
      pricePerVideo: PRICING.SINGLE_VIDEO_PRICE,
      totalAmount: PRICING.SINGLE_VIDEO_PRICE,
    };
  }

  // videosCount >= 2
  const pricePerVideo = PRICING.MULTI_VIDEO_PRICE_PER_VIDEO;
  const totalAmount = videosCount * pricePerVideo;

  return { pricePerVideo, totalAmount };
}

/** Recalculate pricing when videos count changes. */
export function recalculatePricing(
  currentVideosCount: number,
  newVideosCount: number
): {
  pricePerVideo: number;
  totalAmount: number;
} {
  return calculatePricing(newVideosCount);
}
