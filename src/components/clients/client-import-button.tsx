"use client";

import { Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { importClientsAction } from "@/actions/clients/import-clients";

/* ============================================
   ClientImportButton — Import stub UI
   Infrastructure only — actual import not implemented.
   ============================================ */

export function ClientImportButton() {
  const [isPending, setIsPending] = useState(false);

  const handleImport = async () => {
    setIsPending(true);
    const result = await importClientsAction({ success: false }, new FormData());
    if (!result.success) {
      toast.info(result.error ?? "الاستيراد غير متاح حالياً");
    }
    setIsPending(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleImport}
      disabled
      aria-label="استيراد عملاء (غير متاح)"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">استيراد</span>
    </Button>
  );
}
