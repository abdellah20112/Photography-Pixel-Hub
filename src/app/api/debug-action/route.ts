import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  try {
    const user = await authService.login(email, password, {
      ip: "127.0.0.1",
      userAgent: "debug-test",
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[debug-action] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : "Unknown",
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 400 }
    );
  }
}
