import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session-server";
import { LoginScreen } from "@/components/login-screen";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect("/");
  return <LoginScreen />;
}
