import { describe, it, expect } from "vitest";

import {
  WORKFLOW_TRANSITIONS,
  isTransitionAllowed,
  getAllowedTransitions,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_ORDER,
} from "@/lib/workflow/transitions";

/* ============================================
   Workflow Transition Tests
   ============================================ */

describe("WORKFLOW_TRANSITIONS", () => {
  it("defines transitions for all statuses", () => {
    expect(WORKFLOW_TRANSITIONS.NEW).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.PLANNING).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.SHOOTING).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.EDITING).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.REVIEW).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.REVISION).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.APPROVED).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.DELIVERED).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.PAID).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.COMPLETED).toBeDefined();
    expect(WORKFLOW_TRANSITIONS.ARCHIVED).toBeDefined();
  });

  it("ARCHIVED has no allowed transitions", () => {
    expect(WORKFLOW_TRANSITIONS.ARCHIVED).toEqual([]);
  });
});

describe("isTransitionAllowed", () => {
  it("allows NEW → PLANNING", () => {
    expect(isTransitionAllowed("NEW", "PLANNING")).toBe(true);
  });

  it("allows PLANNING → SHOOTING", () => {
    expect(isTransitionAllowed("PLANNING", "SHOOTING")).toBe(true);
  });

  it("allows SHOOTING → EDITING", () => {
    expect(isTransitionAllowed("SHOOTING", "EDITING")).toBe(true);
  });

  it("allows EDITING → REVIEW", () => {
    expect(isTransitionAllowed("EDITING", "REVIEW")).toBe(true);
  });

  it("allows REVIEW → REVISION", () => {
    expect(isTransitionAllowed("REVIEW", "REVISION")).toBe(true);
  });

  it("allows REVIEW → APPROVED", () => {
    expect(isTransitionAllowed("REVIEW", "APPROVED")).toBe(true);
  });

  it("allows REVISION → REVIEW", () => {
    expect(isTransitionAllowed("REVISION", "REVIEW")).toBe(true);
  });

  it("allows APPROVED → DELIVERED", () => {
    expect(isTransitionAllowed("APPROVED", "DELIVERED")).toBe(true);
  });

  it("allows DELIVERED → PAID", () => {
    expect(isTransitionAllowed("DELIVERED", "PAID")).toBe(true);
  });

  it("allows PAID → COMPLETED", () => {
    expect(isTransitionAllowed("PAID", "COMPLETED")).toBe(true);
  });

  it("allows COMPLETED → ARCHIVED", () => {
    expect(isTransitionAllowed("COMPLETED", "ARCHIVED")).toBe(true);
  });

  // Invalid transitions
  it("rejects NEW → EDITING (skip steps)", () => {
    expect(isTransitionAllowed("NEW", "EDITING")).toBe(false);
  });

  it("rejects NEW → APPROVED (skip steps)", () => {
    expect(isTransitionAllowed("NEW", "APPROVED")).toBe(false);
  });

  it("rejects ARCHIVED → NEW (terminal state)", () => {
    expect(isTransitionAllowed("ARCHIVED", "NEW")).toBe(false);
  });

  it("rejects PLANNING → REVIEW (skip shooting)", () => {
    expect(isTransitionAllowed("PLANNING", "REVIEW")).toBe(false);
  });

  it("rejects REVISION → APPROVED (must go through REVIEW)", () => {
    expect(isTransitionAllowed("REVISION", "APPROVED")).toBe(false);
  });
});

describe("getAllowedTransitions", () => {
  it("returns [PLANNING] for NEW", () => {
    expect(getAllowedTransitions("NEW")).toEqual(["PLANNING"]);
  });

  it("returns [REVISION, APPROVED] for REVIEW", () => {
    expect(getAllowedTransitions("REVIEW")).toEqual(["REVISION", "APPROVED"]);
  });

  it("returns [REVIEW] for REVISION", () => {
    expect(getAllowedTransitions("REVISION")).toEqual(["REVIEW"]);
  });

  it("returns [] for ARCHIVED", () => {
    expect(getAllowedTransitions("ARCHIVED")).toEqual([]);
  });
});

describe("WORKFLOW_STATUS_LABELS", () => {
  it("has Arabic labels for all statuses", () => {
    expect(WORKFLOW_STATUS_LABELS.NEW).toBe("جديد");
    expect(WORKFLOW_STATUS_LABELS.PLANNING).toBe("تخطيط");
    expect(WORKFLOW_STATUS_LABELS.SHOOTING).toBe("تصوير");
    expect(WORKFLOW_STATUS_LABELS.EDITING).toBe("مونتاج");
    expect(WORKFLOW_STATUS_LABELS.REVIEW).toBe("مراجعة");
    expect(WORKFLOW_STATUS_LABELS.REVISION).toBe("تعديلات");
    expect(WORKFLOW_STATUS_LABELS.APPROVED).toBe("معتمد");
    expect(WORKFLOW_STATUS_LABELS.DELIVERED).toBe("تم التسليم");
    expect(WORKFLOW_STATUS_LABELS.PAID).toBe("مدفوع");
    expect(WORKFLOW_STATUS_LABELS.COMPLETED).toBe("مكتمل");
    expect(WORKFLOW_STATUS_LABELS.ARCHIVED).toBe("مؤرشف");
  });
});

describe("WORKFLOW_ORDER", () => {
  it("has 9 steps (excluding REVISION and ARCHIVED)", () => {
    expect(WORKFLOW_ORDER).toHaveLength(9);
  });

  it("starts with NEW", () => {
    expect(WORKFLOW_ORDER[0]).toBe("NEW");
  });

  it("ends with COMPLETED", () => {
    expect(WORKFLOW_ORDER[WORKFLOW_ORDER.length - 1]).toBe("COMPLETED");
  });
});
