"use server";

import { revalidatePath } from "next/cache";

import { videoService } from "@/services/video.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Complete Upload Server Action
   Finalizes a video upload after the file is stored in R2.
   Creates the video record with metadata.
   ============================================ */

export async function completeUploadAction(params: {
  projectId: string;
  title: string;
  originalFileName: string;
  storageKey: string;
  storageBucket: string;
  mimeType: string;
  extension: string;
  fileSize: number;
  duration?: number;
  width?: number;
  height?: number;
}): Promise<{
  success: boolean;
  error?: string;
  videoId?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    const video = await videoService.create(
      {
        projectId: params.projectId,
        title: params.title,
        originalFileName: params.originalFileName,
        storageKey: params.storageKey,
        storageBucket: params.storageBucket,
        mimeType: params.mimeType,
        extension: params.extension,
        fileSize: BigInt(params.fileSize),
        duration: params.duration,
        width: params.width,
        height: params.height,
        status: "READY",
      },
      { actorId: user.id }
    );

    revalidatePath(ROUTES.DASHBOARD_UPLOADS);
    return { success: true, videoId: video.id };
  } catch {
    return { success: false, error: "فشل في إكمال الرفع" };
  }
}
