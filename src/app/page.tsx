import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? ROUTES.DASHBOARD : ROUTES.LOGIN);
}
