"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharePortalDialog } from "@/components/projects/share-portal-dialog";

/* ============================================
   SharePortalButton — Client wrapper for
   opening the share portal dialog from
   a server component page.
   ============================================ */

type SharePortalButtonProps = {
  projectId: string;
};

export function SharePortalButton({ projectId }: SharePortalButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" />
        مشاركة البوابة
      </Button>
      <SharePortalDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
      />
    </>
  );
}
