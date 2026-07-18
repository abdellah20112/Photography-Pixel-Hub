"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginAction, type LoginState } from "@/actions/auth/login";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { ROUTES } from "@/lib/constants/routes";

/** Validate that a redirect target is a safe internal path. */
function getSafeRedirect(value: string | null): string {
  if (!value) return ROUTES.DASHBOARD;
  // Must start with "/" but not "//" or "/\" (protocol-relative or escaped)
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value;
  }
  return ROUTES.DASHBOARD;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

/* ============================================
   Login Page
   Arabic RTL login form.
   ============================================ */

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirect = getSafeRedirect(searchParams.get("redirect"));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result: LoginState = await loginAction(
        { success: false },
        formData
      );

      if (result.success) {
        toast.success("تم تسجيل الدخول بنجاح");
        router.push(redirect);
        router.refresh();
      } else {
        toast.error(result.error ?? "فشل تسجيل الدخول");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "expired") {
      toast.info("انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.");
    }
  }, [searchParams]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
        <CardDescription>
          أدخل بياناتك للوصول إلى لوحة التحكم
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              dir="ltr"
              className="text-right"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              dir="ltr"
              className="text-right"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                جارٍ تسجيل الدخول...
              </span>
            ) : (
              "زر تسجيل الدخول"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
