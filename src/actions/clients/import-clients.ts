"use server";

/* ============================================
   Import Clients Server Action
   Infrastructure only — import not yet implemented.
   Will be implemented in a future sprint.
   ============================================ */

export type ImportClientsState = {
  success: boolean;
  error?: string;
  imported?: number;
  skipped?: number;
};

export async function importClientsAction(
  _prev: ImportClientsState,
  _formData: FormData
): Promise<ImportClientsState> {
  return {
    success: false,
    error: "استيراد العملاء غير متاح حالياً — سيتم تفعيله في إصدار قادم",
  };
}
