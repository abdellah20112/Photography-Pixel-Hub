import { downloadRepository } from "@/repositories/download.repository";

/* ============================================
   Download Service
   Business logic layer — calls repositories only.
   ============================================ */

export const downloadService = {
  async getById(id: string) {
    return downloadRepository.findById(id);
  },

  async track(data: {
    videoId: string;
    clientId: string;
    projectId: string;
    ip?: string;
    userAgent?: string;
  }) {
    return downloadRepository.create(data);
  },

  async list(params: {
    videoId?: string;
    clientId?: string;
    projectId?: string;
    skip?: number;
    take?: number;
  }) {
    return downloadRepository.findMany({
      where: {
        videoId: params.videoId,
        clientId: params.clientId,
        projectId: params.projectId,
      },
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    });
  },

  async count(params: {
    videoId?: string;
    clientId?: string;
    projectId?: string;
  }) {
    return downloadRepository.count({
      videoId: params.videoId,
      clientId: params.clientId,
      projectId: params.projectId,
    });
  },
};
