"use server";

import { revalidatePath } from "next/cache";

import { clientService } from "@/services/client.service";
import { getCurrentUser } from "@/lib/auth/session";
import { updateClientSchema } from "@/lib/validations/client";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Update Client Server Action
   Email optional, phone required (Moroccan).
   ============================================ */

export type UpdateClientState = {
  success: boolean;
  error?: string;
};

export async function updateClientAction(
  id: string,
  _prev: UpdateClientState,
  formData: FormData
): Promise<UpdateClientState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const parsed = updateClientSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  try {
    await clientService.update(
      id,
      {
        name: parsed.data.name,
        company: parsed.data.company,
        email: parsed.data.email || undefined,
        phone: parsed.data.phone,
        notes: parsed.data.notes,
        status: parsed.data.status,
      },
      { actorId: user.id }
    );

    revalidatePath(ROUTES.DASHBOARD_CLIENTS);
    revalidatePath(`/dashboard/clients/${id}`);
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
    }
    return { success: false, error: "فشل في تحديث العميل" };
  }
}
