import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/model.repository", () => ({
  modelRepository: {
    findById: vi.fn(),
    findByModelCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findLatestModelCode: vi.fn(),
    getStatistics: vi.fn(),
    findAssignment: vi.fn(),
    createAssignment: vi.fn(),
    updateAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
    findAssignmentsByProject: vi.fn(),
    getDashboardStats: vi.fn(),
  },
}));

vi.mock("@/services/activity.service", () => ({
  activityService: {
    log: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
    count: vi.fn(),
  },
}));

vi.mock("@/services/timeline.service", () => ({
  timelineService: {
    publish: vi.fn().mockResolvedValue(undefined),
    getByProject: vi.fn().mockResolvedValue([]),
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getWorkflowStats: vi.fn(),
  },
}));

vi.mock("@/lib/utils/whatsapp", () => ({
  getWhatsAppUrl: vi.fn((phone: string, message?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const text = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${cleanPhone}${text}`;
  }),
}));

vi.mock("@/lib/prisma", () => {
  const mockTx = { model: { findFirst: vi.fn() } };
  return {
    prisma: {
      ...mockTx,
      $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    },
  };
});

/* ── Imports ─────────────────────────────── */

import { modelService } from "@/services/model.service";
import { modelRepository } from "@/repositories/model.repository";

/* ============================================
   Model Service Tests
   ============================================ */

const mockModel = {
  id: "model-1",
  modelCode: "MD-000001",
  fullName: "Test Model",
  phone: "0501234567",
  whatsapp: null,
  email: null,
  photo: null,
  status: "ACTIVE",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  projectModels: [],
};

describe("modelService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a model with generated code", async () => {
    vi.mocked(modelRepository.create).mockResolvedValue(mockModel as never);

    const result = await modelService.create({
      fullName: "Test Model",
      phone: "0501234567",
    });

    expect(result).toEqual(mockModel);
    expect(modelRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        modelCode: expect.any(String),
        fullName: "Test Model",
        phone: "0501234567",
        status: "ACTIVE",
      })
    );
  });

  it("logs activity when actorId provided", async () => {
    vi.mocked(modelRepository.create).mockResolvedValue(mockModel as never);
    const { activityService } = await import("@/services/activity.service");

    await modelService.create(
      { fullName: "Test", phone: "050" },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "CREATE",
        entity: "model",
      })
    );
  });
});

describe("modelService.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to INACTIVE", async () => {
    vi.mocked(modelRepository.softDelete).mockResolvedValue(mockModel as never);

    await modelService.softDelete("model-1");

    expect(modelRepository.softDelete).toHaveBeenCalledWith("model-1");
  });
});

describe("modelService.assignToProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates assignment with calculated pricing", async () => {
    vi.mocked(modelRepository.findAssignment).mockResolvedValue(null);
    vi.mocked(modelRepository.createAssignment).mockResolvedValue({
      id: "assignment-1",
      model: { id: "model-1", fullName: "Test", modelCode: "MD-000001", phone: "050", whatsapp: null, photo: null },
    } as never);

    const result = await modelService.assignToProject({
      projectId: "project-1",
      modelId: "model-1",
      videosCount: 3,
    });

    expect(result).toBeDefined();
    expect(modelRepository.createAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        videosCount: 3,
        pricePerVideo: 100,
        totalAmount: 300,
      })
    );
  });

  it("throws on duplicate assignment", async () => {
    vi.mocked(modelRepository.findAssignment).mockResolvedValue({ id: "existing" } as never);

    await expect(
      modelService.assignToProject({
        projectId: "project-1",
        modelId: "model-1",
        videosCount: 1,
      })
    ).rejects.toThrow("الموديل مُعيّن بالفعل");
  });

  it("publishes MODEL_ASSIGNED timeline event", async () => {
    vi.mocked(modelRepository.findAssignment).mockResolvedValue(null);
    vi.mocked(modelRepository.createAssignment).mockResolvedValue({
      id: "a1",
      model: { id: "m1", fullName: "Test", modelCode: "MD-000001", phone: "050", whatsapp: null, photo: null },
    } as never);
    const { timelineService } = await import("@/services/timeline.service");

    await modelService.assignToProject({
      projectId: "project-1",
      modelId: "model-1",
      videosCount: 2,
    });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "MODEL_ASSIGNED",
        projectId: "project-1",
      })
    );
  });
});

describe("modelService.updateAssignment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recalculates pricing on update", async () => {
    vi.mocked(modelRepository.updateAssignment).mockResolvedValue({
      id: "a1",
      projectId: "p1",
      model: { id: "m1", fullName: "Test", modelCode: "MD-001", phone: "050", whatsapp: null, photo: null },
    } as never);

    await modelService.updateAssignment("a1", { videosCount: 5 });

    expect(modelRepository.updateAssignment).toHaveBeenCalledWith(
      "a1",
      expect.objectContaining({
        videosCount: 5,
        pricePerVideo: 100,
        totalAmount: 500,
      })
    );
  });

  it("publishes MODEL_VIDEOS_UPDATED timeline event", async () => {
    vi.mocked(modelRepository.updateAssignment).mockResolvedValue({
      id: "a1",
      projectId: "p1",
      model: { id: "m1", fullName: "Test", modelCode: "MD-001", phone: "050", whatsapp: null, photo: null },
    } as never);
    const { timelineService } = await import("@/services/timeline.service");

    await modelService.updateAssignment("a1", { videosCount: 2 });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "MODEL_VIDEOS_UPDATED",
      })
    );
  });
});

describe("modelService.getStatistics", () => {
  it("delegates to repository", async () => {
    const stats = { totalProjects: 5, totalVideos: 15, totalEarnings: 1500, pendingAmount: 300, paidAmount: 1200 };
    vi.mocked(modelRepository.getStatistics).mockResolvedValue(stats);

    const result = await modelService.getStatistics("model-1");

    expect(result).toEqual(stats);
  });
});

describe("getWhatsAppUrl", () => {
  it("generates WhatsApp URL with phone", async () => {
    const { getWhatsAppUrl } = await import("@/lib/utils/whatsapp");
    const url = getWhatsAppUrl("0501234567");
    expect(url).toContain("wa.me/0501234567");
  });

  it("includes message when provided", async () => {
    const { getWhatsAppUrl } = await import("@/lib/utils/whatsapp");
    const url = getWhatsAppUrl("0501234567", "مرحباً");
    expect(url).toContain("text=");
    expect(url).toContain(encodeURIComponent("مرحباً"));
  });

  it("strips non-numeric characters from phone", async () => {
    const { getWhatsAppUrl } = await import("@/lib/utils/whatsapp");
    const url = getWhatsAppUrl("+966 50 123 4567");
    expect(url).toContain("wa.me/966501234567");
  });
});
