import { logoutAction } from "@/actions/logout";
import { redirect } from "next/navigation";

export async function GET() {
  await logoutAction();
  return redirect("/auth/login");
}
