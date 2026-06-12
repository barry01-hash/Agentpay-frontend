"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";

type Service = { serviceId: string; priceStroops: number };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ services: Service[] }>("/api/v1/services")
      .then((b) => setServices(b.services))
      .catch((e) => setError(e.message ?? "failed to load"));
  }, []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
        <Link
          href="/services/new"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-black"
        >
          New service
        </Link>
      </header>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {!services && !error && <p>Loading…</p>}
      {services && services.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No services registered yet.
        </p>
      )}
      {services && services.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {services.map((s) => (
            <li key={s.serviceId} className="flex items-center justify-between py-3">
              <span className="font-mono text-sm">{s.serviceId}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {s.priceStroops} stroops / request
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
