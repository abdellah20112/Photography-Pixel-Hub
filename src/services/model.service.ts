import { prisma } from "@/lib/prisma";
import { modelRepository } from "@/repositories/model.repository";
import { activityService } from "@/services/activity.service";
import { timelineService } from "@/services/timeline.service";
import { calculatePricing } from "@/lib/pricing/pricing.service";
import { getWhatsAppUrl } from "@/lib/utils/whatsapp";
import type { ModelStatus, PaymentStatus } from "@prisma/client";

/* ============================================
   Model Service
   Business logic layer — calls repositories only.
   Generates MD-000001 codes, manages assignments,
   publishes timeline events.
   ============================================ */

/** Format a sequential model code: MD-000001, MD-000002, etc. */
function formatModelCode(sequence: number): string {
  return `MD-${String(sequence).padStart(6, "0")}`;
}

/** Generate the next unique model code using a transaction. */
async function generateUniqueModelCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.model.findFirst({
      orderBy: { modelCode: "desc" },
      select: { modelCode: true },
    });

    let sequence = 1;
    if (latest?.modelCode) {
      const match = latest.modelCode.match(/^MD-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]!, 10) + 1;
      }
    }

    return formatModelCode(sequence);
  });
}

/** Re-export WhatsApp utility for convenience. */
export { getWhatsAppUrl } from "@/lib/utils/whatsapp";

export const modelService = {
  async getById(id: string) {
    return modelRepository.findById(id);
  },

  async getByModelCode(modelCode: string) {
    return modelRepository.findByModelCode(modelCode);
  },

  async create(
    data: {
      fullName: string;
      phone: string;
      whatsapp?: string;
      email?: string;
      photo?: string;
      notes?: string;
      status?: ModelStatus;
    },
    options?: { actorId?: string }
  ) {
    const modelCode = await generateUniqueModelCode();

    const model = await modelRepository.create({
      modelCode,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || null,
      email: data.email?.trim() || null,
      photo: data.photo?.trim() || null,
      notes: data.notes?.trim() || null,
      status: data.status ?? ("ACTIVE" as ModelStatus),
    });

    // Activity log
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "model",
        entityId: model.id,
        metadata: { modelCode: model.modelCode, fullName: model.fullName },
      });
    }

    return model;
  },

  async update(
    id: string,
    data: {
      fullName: string;
      phone: string;
      whatsapp?: string;
      email?: string;
      photo?: string;
      notes?: string;
      status?: ModelStatus;
    },
    options?: { actorId?: string }
  ) {
    const model = await modelRepository.update(id, {
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || null,
      email: data.email?.trim() || null,
      photo: data.photo?.trim() || null,
      notes: data.notes?.trim() || null,
      status: data.status,
    });

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "UPDATE",
        entity: "model",
        entityId: id,
        metadata: { modelCode: model.modelCode },
      });
    }

    return model;
  },

  /** Soft delete — set status to INACTIVE. */
  async softDelete(id: string, options?: { actorId?: string }) {
    const model = await modelRepository.softDelete(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "ARCHIVE",
        entity: "model",
        entityId: id,
        metadata: { modelCode: model.modelCode },
      });
    }

    return model;
  },

  async restore(id: string, options?: { actorId?: string }) {
    const model = await modelRepository.restore(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "RESTORE",
        entity: "model",
        entityId: id,
        metadata: { modelCode: model.modelCode },
      });
    }

    return model;
  },

  async delete(id: string, options?: { actorId?: string }) {
    return this.softDelete(id, options);
  },

  async list(params: {
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    return modelRepository.findMany(params);
  },

  async count(filter?: string) {
    if (filter === "active") {
      return modelRepository.count({ status: "ACTIVE" });
    }
    if (filter === "inactive") {
      return modelRepository.count({ status: "INACTIVE" });
    }
    return modelRepository.count();
  },

  async getStatistics(modelId: string) {
    return modelRepository.getStatistics(modelId);
  },

  // ── Project Assignments ──────────────────

  async assignToProject(
    data: {
      projectId: string;
      modelId: string;
      videosCount: number;
      notes?: string;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    // Check for duplicate assignment
    const existing = await modelRepository.findAssignment(data.projectId, data.modelId);
    if (existing) {
      throw new Error("الموديل مُعيّن بالفعل في هذا المشروع");
    }

    // Calculate pricing
    const { pricePerVideo, totalAmount } = calculatePricing(data.videosCount);

    const assignment = await modelRepository.createAssignment({
      projectId: data.projectId,
      modelId: data.modelId,
      videosCount: data.videosCount,
      pricePerVideo,
      totalAmount,
      notes: data.notes || null,
    });

    // Publish timeline event
    await timelineService.publish({
      projectId: data.projectId,
      eventType: "MODEL_ASSIGNED",
      title: "تعيين موديل",
      description: `تم تعيين ${assignment.model.fullName} (${assignment.model.modelCode}) بـ ${data.videosCount} فيديو`,
      metadata: {
        modelId: data.modelId,
        modelCode: assignment.model.modelCode,
        videosCount: data.videosCount,
        totalAmount,
      },
      actorId: options?.actorId,
      actorName: options?.actorName ?? "النظام",
    });

    // Activity log
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "project_model",
        entityId: assignment.id,
        metadata: { projectId: data.projectId, modelId: data.modelId },
      });
    }

    return assignment;
  },

  async updateAssignment(
    id: string,
    data: {
      videosCount: number;
      paymentStatus?: PaymentStatus;
      notes?: string;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    // Recalculate pricing
    const { pricePerVideo, totalAmount } = calculatePricing(data.videosCount);

    const assignment = await modelRepository.updateAssignment(id, {
      videosCount: data.videosCount,
      pricePerVideo,
      totalAmount,
      paymentStatus: data.paymentStatus,
      notes: data.notes || null,
    });

    // Publish timeline events
    await timelineService.publish({
      projectId: (assignment as never as { projectId: string }).projectId,
      eventType: "MODEL_VIDEOS_UPDATED",
      title: "تحديث فيديوهات الموديل",
      description: `تم تحديث عدد الفيديوهات إلى ${data.videosCount} — الإجمالي: ${totalAmount}`,
      metadata: { assignmentId: id, videosCount: data.videosCount, totalAmount },
      actorId: options?.actorId,
      actorName: options?.actorName ?? "النظام",
    });

    if (data.paymentStatus) {
      await timelineService.publish({
        projectId: (assignment as never as { projectId: string }).projectId,
        eventType: "MODEL_PAYMENT_UPDATED",
        title: "تحديث حالة الدفع",
        description: `حالة الدفع: ${data.paymentStatus}`,
        metadata: { assignmentId: id, paymentStatus: data.paymentStatus },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return assignment;
  },

  async removeFromProject(
    id: string,
    options?: { actorId?: string; actorName?: string }
  ) {
    const assignment = await modelRepository.deleteAssignment(id);

    // Publish timeline event
    await timelineService.publish({
      projectId: (assignment as never as { projectId: string }).projectId,
      eventType: "MODEL_REMOVED",
      title: "إزالة موديل",
      description: `تمت إزالة الموديل من المشروع`,
      metadata: { assignmentId: id, modelId: (assignment as never as { modelId: string }).modelId },
      actorId: options?.actorId,
      actorName: options?.actorName ?? "النظام",
    });

    return assignment;
  },

  async getAssignmentsByProject(projectId: string) {
    return modelRepository.findAssignmentsByProject(projectId);
  },

  async getDashboardStats() {
    return modelRepository.getDashboardStats();
  },
};
