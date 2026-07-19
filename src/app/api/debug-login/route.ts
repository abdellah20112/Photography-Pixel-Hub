import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  console.log("[debug-route] Step 1: createSupabaseServerClient");
  const supabase = await createSupabaseServerClient();

  console.log("[debug-route] Step 2: signInWithPassword", email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.log("[debug-route] Step 2 FAILED:", error?.message, error?.code);
    return NextResponse.json({ step: 2, error: error?.message, code: error?.code }, { status: 400 });
  }

  console.log("[debug-route] Step 3: Prisma findBySupabaseUid:", data.user.id);
  const user = await userRepository.findBySupabaseUid(data.user.id);

  if (!user) {
    console.log("[debug-route] Step 3 FAILED: No Prisma profile");
    return NextResponse.json({ step: 3, error: "No Prisma profile", supabaseUid: data.user.id }, { status: 400 });
  }

  console.log("[debug-route] Step 4: Success!", user.email, user.role);
  return NextResponse.json({
    step: 4,
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
