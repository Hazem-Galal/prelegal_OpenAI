import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";

// Server-side fetches run inside the frontend container, so they must reach
// the backend via its Docker Compose service name, not NEXT_PUBLIC_API_BASE_URL
// (which is baked in for the browser's use and points at localhost:8000).
const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:8000";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_id");

  if (!sessionCookie) {
    redirect("/");
  }

  // Re-validate against the backend rather than trusting cookie presence alone:
  // the database (and every session in it) is wiped on every backend restart,
  // so a returning browser's cookie can reference a session that no longer
  // exists — only a live check catches that and bounces back to sign-in.
  const response = await fetch(`${INTERNAL_API_BASE_URL}/api/auth/me`, {
    headers: { Cookie: `session_id=${sessionCookie.value}` },
    cache: "no-store",
  });

  if (!response.ok) {
    redirect("/");
  }

  const user: { email: string } = await response.json();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userEmail={user.email} />
      {children}
    </div>
  );
}
