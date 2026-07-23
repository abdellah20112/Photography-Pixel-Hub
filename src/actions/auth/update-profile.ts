"use server";

import { revalidatePath } from "next/cache";

import { userService } from "@/services/user.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Update Profile Server Action
   Updates the current user's name and avatar.
   ============================================ */

export type UpdateProfileState = {
  success: boolean;
  error?: string;
};

export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const name = formData.get("name") as string;
  if (!name || name.trim().length < 2) {
    return { success: false, error: "الاسم مطلوب" };
  }

  const avatar = formData.get("avatar") as string | null;

  try {
    await userService.update(user.id, {
      name: name.trim(),
      avatar: avatar || undefined,
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "فشل في تحديث الملف الشخصي" };
  }
}
