"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, type UpdateProfileState } from "@/actions/auth/update-profile";

/* ============================================
   ProfileForm — Edit name and avatar
   ============================================ */

type ProfileFormProps = {
  defaultName: string;
  defaultAvatar: string;
};

export function ProfileForm({ defaultName, defaultAvatar }: ProfileFormProps) {
  const [avatar, setAvatar] = useState(defaultAvatar);
  const prevSuccess = useRef(false);

  const [state, formAction, isPending] = useActionState<
    UpdateProfileState,
    FormData
  >(updateProfileAction, { success: false });

  useEffect(() => {
    if (state.success && !prevSuccess.current) {
      toast.success("تم تحديث الملف الشخصي");
    } else if (state.error && !prevSuccess.current) {
      toast.error(state.error);
    }
    prevSuccess.current = state.success;
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">الاسم <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          placeholder="الاسم الكامل"
          required
          minLength={2}
        />
      </div>

      {/* Avatar URL */}
      <div className="space-y-1.5">
        <Label htmlFor="avatar">رابط الصورة الشخصية</Label>
        <Input
          id="avatar"
          name="avatar"
          type="url"
          defaultValue={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          dir="ltr"
        />
        {avatar && (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar}
              alt="معاينة"
              className="h-16 w-16 rounded-full object-cover"
              onError={() => setAvatar("")}
            />
            <span className="text-xs text-muted-foreground">معاينة الصورة</span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>
    </form>
  );
}
