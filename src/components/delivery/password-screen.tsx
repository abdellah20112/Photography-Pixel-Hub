"use client";

import { useState, useCallback } from "react";
import { Loader2, Lock } from "lucide-react";

import { BRANDING } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accessDeliveryAction } from "@/actions/deliveries/access-delivery";
import type { PublicDeliveryData } from "@/types/delivery";

/* ============================================
   PasswordScreen — Delivery password gate
   ============================================ */

type PasswordScreenProps = {
  slug: string;
  onSuccess: (data: PublicDeliveryData) => void;
};

export function PasswordScreen({ slug, onSuccess }: PasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const result = await accessDeliveryAction(slug, password);

    if (result.success && result.data) {
      onSuccess(result.data);
    } else {
      setError(result.error ?? "كلمة المرور غير صحيحة");
      setAttempts((a) => a + 1);
    }

    setLoading(false);
  }, [slug, password, loading, onSuccess]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRANDING.logo.full}
        alt={BRANDING.companyName}
        className="h-12 w-12 rounded-lg object-contain"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold tracking-tight">التسليم محمي بكلمة مرور</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          أدخل كلمة المرور للوصول إلى الفيديوهات
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="sr-only">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            aria-invalid={!!error}
            aria-describedby={error ? "password-error" : undefined}
          />
          {error && (
            <p id="password-error" className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          {attempts >= 3 && !error && (
            <p className="text-xs text-muted-foreground">
              محاولات خاطئة: {attempts}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || !password}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}
        </Button>
      </form>
    </main>
  );
}
