"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  userEmail: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function AppHeader({ userEmail }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch(`${API_BASE_URL}/api/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
    router.push("/");
  };

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-700">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/app" className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
          Pre-Legal
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/app/documents" className="font-medium text-primary hover:underline">
            My Documents
          </Link>
          <span className="text-neutral-500 dark:text-neutral-400">{userEmail}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
