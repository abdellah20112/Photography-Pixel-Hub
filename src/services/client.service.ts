import { prisma } from "@/lib/prisma";
import { clientRepository } from "@/repositories/client.repository";
import { activityService } from "@/services/activity.service";
import { generateToken } from "@/lib/utils";
import type { ClientStatus } from "@prisma/client";

/* ============================================
   Client Service
   Business logic layer — calls repositories only.
   ============================================ */

/** Format a sequential client code: CL-000001, CL-000002, etc. */
function formatClientCode(sequence: number): string {
  return `CL-${String(sequence).padStart(6, "0")}`;
}

/** Generate the next unique client code using a transaction. */
async function generateUniqueClientCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.client.findFirst({
      orderBy: { clientCode: "desc" },
      select: { clientCode: true },
    });

    let sequence = 1;
    if (latest?.clientCode) {
      const match = latest.clientCode.match(/^CL-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]!, 10) + 1;
      }
    }

    return formatClientCode(sequence);
  });
}

/** Convert service input to repository input (trim, normalize). */
function normalizeInput(data: {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: ClientStatus;
}) {
  return {
    name: data.name.trim(),
    company: data.company?.trim() || null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    notes: data.notes?.trim() || null,
    status: data.status ?? ("ACTIVE" as ClientStatus),
  };
}

export const clientService = {
  async getById(id: string) {
    return clientRepository.findById(id);
  },

  async getByToken(token: string) {
    return clientRepository.findByToken(token);
  },

  async create(
    data: {
      userId: string;
      name: string;
      company?: string;
      email?: string;
      phone?: string;
      notes?: string;
      status?: ClientStatus;
    },
    options?: { actorId?: string }
  ) {
    const normalized = normalizeInput(data);
    const clientCode = await generateUniqueClientCode();
    const token = generateToken(32);

    const client = await clientRepository.create({
      ...normalized,
      userId: data.userId,
      clientCode,
      token,
    });

    // Activity log: Client Created
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "client",
        entityId: client.id,
        metadata: { name: client.name, clientCode: client.clientCode },
      });
    }

    return client;
  },

  async update(
    id: string,
    data: {
      name: string;
      company?: string;
      email?: string;
      phone?: string;
      notes?: string;
      status?: ClientStatus;
    },
    options?: { actorId?: string }
  ) {
    const normalized = normalizeInput(data);

    const client = await clientRepository.update(id, {
      ...normalized,
      status: normalized.status,
    });

    // Activity log: Client Updated
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "UPDATE",
        entity: "client",
        entityId: client.id,
        metadata: { name: client.name, clientCode: client.clientCode },
      });
    }

    return client;
  },

  /** Soft delete — archives the client. */
  async archive(id: string, options?: { actorId?: string }) {
    const client = await clientRepository.softDelete(id);

    // Activity log: Client Archived
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "ARCHIVE",
        entity: "client",
        entityId: id,
        metadata: { name: client.name, clientCode: client.clientCode },
      });
    }

    return client;
  },

  /** Restore an archived client. */
  async restore(id: string, options?: { actorId?: string }) {
    const client = await clientRepository.restore(id);

    // Activity log: Client Restored
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "RESTORE",
        entity: "client",
        entityId: id,
        metadata: { name: client.name, clientCode: client.clientCode },
      });
    }

    return client;
  },

  /** Soft delete alias for backward compatibility. */
  async delete(id: string, options?: { actorId?: string }) {
    return this.archive(id, options);
  },

  async list(params: {
    userId: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: "all" | "active" | "archived" | "blocked";
    sort?: "newest" | "oldest" | "alphabetical";
  }) {
    return clientRepository.findMany(params);
  },

  async count(userId: string) {
    return clientRepository.count({
      userId,
      status: { not: "ARCHIVED" },
    });
  },

  async getStatistics(clientId: string) {
    return clientRepository.getStatistics(clientId);
  },

  /** Export all non-archived clients for a user as CSV rows. */
  async exportCsv(userId: string): Promise<string> {
    const clients = await clientRepository.findAllForExport(userId);

    const headers = [
      "كود العميل",
      "الاسم",
      "الشركة",
      "الهاتف",
      "البريد الإلكتروني",
      "عدد المشاريع",
      "الحالة",
      "تاريخ الإنشاء",
    ];

    const escapeCsv = (value: string | null | undefined): string => {
      if (value == null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = clients.map((c) =>
      [
        c.clientCode,
        c.name,
        c.company ?? "",
        c.phone ?? "",
        c.email,
        String(c._count.projects),
        c.status,
        c.createdAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(",")
    );

    // Add BOM for Excel UTF-8 detection
    return "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\n");
  },
};
