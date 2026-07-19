import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { storageService } from "@/lib/storage/storage.service";
import { generateStorageKey, getMimeType, getExtension, validateVideoFile } from "@/lib/video/metadata";

export const maxDuration = 60;

/* ============================================
   Upload API Route
   Handles multipart video uploads via StorageService.
   Provider-agnostic — no direct Cloudflare imports.
   ============================================ */

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "الملف مطلوب" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "المشروع مطلوب" },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate storage key
    const storageKey = generateStorageKey(projectId, file.name);
    const mimeType = getMimeType(file);
    const extension = getExtension(file.name);

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via StorageService
    await storageService.upload({
      key: storageKey,
      body: buffer,
      contentType: mimeType,
      metadata: {
        "original-filename": file.name,
        "project-id": projectId,
      },
    });

    return NextResponse.json({
      success: true,
      storageKey,
      storageBucket: storageService.bucket,
      mimeType,
      extension,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "فشل في رفع الملف" },
      { status: 500 }
    );
  }
}
