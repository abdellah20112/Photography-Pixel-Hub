"use server";

/* ============================================
   Import Projects Server Action
   Infrastructure only — import not yet implemented.
   Will be implemented in a future sprint.
   ============================================ */

export type ImportProjectsState = {
  success: boolean;
  error?: string;
  imported?: number;
  skipped?: number;
};

export async function importProjectsAction(
  _prev: ImportProjectsState,
  _formData: FormData
): Promise<ImportProjectsState> {
  return {
    success: false,
    error: "استيراد المشاريع غير متاح حالياً — سيتم تفعيله في إصدار قادم",
  };
}
