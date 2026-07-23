"use client";

import { useState, useCallback } from "react";
import { Loader2, Lock } from "lucide-react";

import { BRANDING } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ============================================
   PortalPasswordGate — Password protection
   Shows when delivery has passwordProtected.
   Calls onUnlock(password) to verify.
   ============================================ */

type PortalPasswordGateProps = {
  projectName?: string;
  error?: string;
  onUnlock: (password: string) => void;
  loading?: boolean;
};

export function PortalPasswordGate({
  projectName,
  error,
  onUnlock,
  loading,
}: PortalPasswordGateProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (loading || !password) return;
      onUnlock(password);
    },
    [loading, password, onUnlock],
  );

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0a0a0c] to-[#121214] p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRANDING.logo.white}
        alt={BRANDING.companyName}
        className="h-14 w-14 rounded-xl object-contain"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            هذا المشروع محمي
          </h1>
        </div>
        <p className="text-sm text-white/50">
          {projectName
            ? `أدخل كلمة المرور للوصول إلى "${projectName}"`
            : "أدخل كلمة المرور للوصول إلى المشروع"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="portal-password" className="sr-only">
            كلمة المرور
          </Label>
          <Input
            id="portal-password"
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            aria-invalid={!!error}
            aria-describedby={error ? "portal-password-error" : undefined}
            className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
          />
          {error && (
            <p
              id="portal-password-error"
              className="text-xs text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || !password}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "دخول"
          )}
        </Button>
      </form>

      <div className="flex items-center gap-2 text-xs text-white/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRANDING.logo.white}
          alt={BRANDING.companyName}
          className="h-3.5 w-3.5 rounded object-contain"
        />
        {BRANDING.companyName}
      </div>
    </main>
  );
}
