"use client";

import Link from "next/link";
import AdoptionContractStatusBadge from "./AdoptionContractStatusBadge";
import { useClickableRow } from "@/lib/hooks/useClickableRow";
import type { ContractListItem } from "@/lib/queries/adoption-contracts";

interface Props {
  contracts: ContractListItem[];
}

const SPECIES_LABEL: Record<string, string> = {
  hond: "Hond",
  kat: "Kat",
};

export default function AdoptionContractList({ contracts }: Props) {
  if (contracts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Geen contracten gevonden.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <Th>Datum</Th>
            <Th>Adoptant</Th>
            <Th>Dier</Th>
            <Th>Bedrag</Th>
            <Th>Status</Th>
            <Th>Getekend doc.</Th>
            <Th>Acties</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {contracts.map((c) => (
            <ContractRow key={c.id} contract={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractRow({ contract: c }: { contract: ContractListItem }) {
  const rowProps = useClickableRow(`/beheerder/adoptie/contracten/${c.id}`, {
    ariaLabel: `Bekijk contract ${c.candidateFirstName} ${c.candidateLastName} – ${c.animalName}`,
  });
  return (
    <tr
      {...rowProps}
      className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
    >
      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
        {new Date(c.contractDate).toLocaleDateString("nl-BE")}
      </td>
      <td className="px-4 py-2 text-sm text-gray-800">
        {c.candidateFirstName} {c.candidateLastName}
      </td>
      <td className="px-4 py-2 text-sm text-gray-600">
        <Link
          href={`/beheerder/dieren/${c.animalId}`}
          className="font-medium text-emerald-700 hover:underline"
        >
          {c.animalName}
        </Link>
        <span className="ml-1 text-xs text-gray-400">
          ({SPECIES_LABEL[c.animalSpecies] ?? "Ander"})
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
        € {c.paymentAmount}
      </td>
      <td className="px-4 py-2 text-sm">
        <AdoptionContractStatusBadge status={c.status} />
      </td>
      <td className="px-4 py-2 text-sm">
        {c.signedDocumentUrl ? (
          <a
            href={c.signedDocumentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-700 underline hover:text-emerald-900"
          >
            Bekijken
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-2 text-sm">
        <Link
          href={`/beheerder/adoptie/contracten/${c.id}`}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
        >
          Beheer
        </Link>
      </td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
      {children}
    </th>
  );
}
