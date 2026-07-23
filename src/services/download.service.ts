import { downloadRepository } from "@/repositories/download.repository";

/* ============================================
   Download Service
   Business logic layer — calls repositories only.
   Tracks downloads with IP, browser, device info.
   ============================================ */

/** Parse browser name from user-agent string. */
function parseBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/") || ua.includes("chromium/")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("opr/") || ua.includes("opera/")) return "Opera";
  return "Unknown";
}

/** Parse device type from user-agent string. */
function parseDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("android") || ua.includes("mobile")) return "Mobile";
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  return "Desktop";
}

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
    browser?: string;
    device?: string;
  }) {
    const browser = data.browser ?? (data.userAgent ? parseBrowser(data.userAgent) : "Unknown");
    const device = data.device ?? (data.userAgent ? parseDevice(data.userAgent) : "Unknown");

    return downloadRepository.create({
      videoId: data.videoId,
      clientId: data.clientId,
      projectId: data.projectId,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
      browser,
      device,
    });
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

  /** Get download statistics for a project. */
  async getProjectStats(projectId: string) {
    const downloads = await downloadRepository.findMany({
      where: { projectId },
      take: 1000,
    });

    return {
      totalDownloads: downloads.length,
      uniqueIps: new Set(downloads.map((d) => d.ip).filter(Boolean)).size,
      browsers: downloads.reduce((acc, d) => {
        acc[d.browser ?? "Unknown"] = (acc[d.browser ?? "Unknown"] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      devices: downloads.reduce((acc, d) => {
        acc[d.device ?? "Unknown"] = (acc[d.device ?? "Unknown"] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lastDownload: downloads[0]?.createdAt ?? null,
    };
  },
};
