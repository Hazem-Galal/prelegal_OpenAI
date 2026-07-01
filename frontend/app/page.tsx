"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" }).then((response) => {
      if (response.ok) router.replace("/app");
    });
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.detail ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/app");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 p-8 shadow-xs dark:border-neutral-700">
        <h1 className="text-2xl font-semibold tracking-tight text-dark-navy dark:text-white">
          Pre-Legal
        </h1>
        <p className="mt-1 text-sm text-gray-text">
          Draft common legal agreements quickly and accurately.
        </p>

        <div className="mt-6 flex gap-2 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-lg px-3 py-1.5 transition ${
              mode === "signin"
                ? "bg-blue-primary text-white"
                : "text-gray-text hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-3 py-1.5 transition ${
              mode === "signup"
                ? "bg-blue-primary text-white"
                : "text-gray-text hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-dark-navy dark:text-neutral-100">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-primary dark:border-neutral-600 dark:bg-neutral-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-dark-navy dark:text-neutral-100">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-primary dark:border-neutral-600 dark:bg-neutral-900"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-lg bg-purple-secondary px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-purple-secondary/90 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isSubmitting ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
