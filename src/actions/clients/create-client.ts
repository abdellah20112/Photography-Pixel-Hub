"use server";

import { revalidatePath } from "next/cache";

import { clientService } from "@/services/client.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createClientSchema } from "@/lib/validations/client";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Create Client Server Action
   ============================================ */

export type CreateClientState = {
  success: boolean;
  error?: string;
  clientId?: string;
};

export async function createClientAction(
  _prev: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const parsed = createClientSchema.safeParse({
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
    const client = await clientService.create(
      {
        userId: user.id,
        name: parsed.data.name,
        company: parsed.data.company,
        email: parsed.data.email,
        phone: parsed.data.phone,
        notes: parsed.data.notes,
        status: parsed.data.status,
      },
      { actorId: user.id }
    );

    revalidatePath(ROUTES.DASHBOARD_CLIENTS);
    return { success: true, clientId: client.id };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
    }
    return { success: false, error: "فشل في إنشاء العميل" };
  }
}
