"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getWalkStatus, elapsedTime } from "@/lib/utils/walk-duration";
import type { ActiveWalkForAdmin } from "@/types";

interface ActiveWalksPanelProps {
  walks: ActiveWalkForAdmin[];
}

export default function ActiveWalksPanel({ walks }: ActiveWalksPanelProps) {
  const router = useRouter();

  // Auto-refresh every 30 seconds for near-realtime updates (AC2)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  if (walks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">
          Momenteel geen wandelingen actief.
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
            const status = getWalkStatus(walk.startTime);
            return (
              <tr
                key={walk.id}
                className={
                  status === "overdue"
                    ? "bg-red-50"
                    : status === "long"
                      ? "bg-orange-50"
                      : ""
                }
              >
                <td className="px-4 py-3 font-medium text-[#1b4332]">
                  {walk.walkerFirstName} {walk.walkerLastName}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <a
                    href={`tel:${walk.walkerPhone}`}
                    className="text-[#2d6a4f] underline decoration-[#2d6a4f]/30 hover:decoration-[#2d6a4f]"
                  >
                    {walk.walkerPhone}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600">{walk.animalName}</td>
                <td className="px-4 py-3 text-gray-600">{walk.startTime}</td>
                <td className="px-4 py-3 text-gray-600">{elapsedTime(walk.startTime)}</td>
                <td className="px-4 py-3">
                  <WalkStatusBadge status={status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WalkStatusBadge({ status }: { status: "normal" | "long" | "overdue" }) {
  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Te lang weg!
      </span>
    );
  }

  if (status === "long") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
        Lang onderweg
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
      Bezig
    </span>
  );
}
