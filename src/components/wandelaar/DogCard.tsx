"use client";

import Image from "next/image";
import type { Animal } from "@/types";

interface DogCardProps {
  dog: Animal;
  onBook: (animalId: number) => void;
}

export default function DogCard({ dog, onBook }: DogCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-[#d8f3dc]/40 to-[#95d5b2]/30 flex items-center justify-center">
        {dog.imageUrl ? (
          <Image
            src={dog.imageUrl}
            alt={dog.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <span className="text-6xl">&#x1F415;</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-lg font-bold text-[#1b4332]">
          {dog.name}
        </h3>
        {dog.breed && (
          <p className="mt-0.5 text-sm text-[#2d6a4f]/70">{dog.breed}</p>
        )}
        <button
          type="button"
          onClick={() => onBook(dog.id)}
          className="mt-3 w-full rounded-lg bg-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1b4332]"
        >
          Boek wandeling
        </button>
      </div>
    </div>
  );
}
