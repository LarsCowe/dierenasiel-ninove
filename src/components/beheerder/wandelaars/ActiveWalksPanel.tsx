"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActiveWalkForAdmin } from "@/types";

interface ActiveWalksPanelProps {
  walks: ActiveWalkForAdmin[];
}

function isOverdue(startTime: string): boolean {
  const now = new Date();
  const [h, m] = startTime.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return (nowMinutes - startMinutes) > 240; // > 4 hours
}

function elapsedTime(startTime: string): string {
  const now = new Date();
  const [h, m] = startTime.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const diff = nowMinutes - startMinutes;
  if (diff < 0) return "—";
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0) return `${hours}u ${mins}min`;
  return `${mins}min`;
}

export default function ActiveWalksPanel({ walks }: ActiveWalksPanelProps) {
  const router = useRouter();

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60_000);
    return () => clearInterval(interval);
  }, [router]);

  if (walks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">
          Geen actieve wandelingen op dit moment.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Wandelaar</th>
            <th className="px-4 py-3 font-medium text-gray-600">Telefoon</th>
            <th className="px-4 py-3 font-medium text-gray-600">Hond</th>
            <th className="px-4 py-3 font-medium text-gray-600">Start</th>
            <th className="px-4 py-3 font-medium text-gray-600">Duur</th>
            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {walks.map((walk) => {
            const overdue = isOverdue(walk.startTime);
            return (
              <tr key={walk.id} className={overdue ? "bg-red-50" : ""}>
                <td className="px-4 py-3 font-medium text-[#1b4332]">
                  {walk.walkerFirstName} {walk.walkerLastName}
                </td>
                <td className="px-4 py-3 text-gray-600">{walk.walkerPhone}</td>
                <td className="px-4 py-3 text-gray-600">{walk.animalName}</td>
                <td className="px-4 py-3 text-gray-600">{walk.startTime}</td>
                <td className="px-4 py-3 text-gray-600">{elapsedTime(walk.startTime)}</td>
                <td className="px-4 py-3">
                  {overdue ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      Te lang weg!
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Bezig
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
