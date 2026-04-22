"use client";

import { useState } from "react";
import DogCard from "./DogCard";
import WalkBookingForm from "./WalkBookingForm";
import type { Animal } from "@/types";

interface AvailableDogsGridProps {
  dogs: Animal[];
  walkDays: number[];
}

export default function AvailableDogsGrid({ dogs, walkDays }: AvailableDogsGridProps) {
  const [selectedDogId, setSelectedDogId] = useState<number | null>(null);

  const selectedDog = dogs.find((d) => d.id === selectedDogId) ?? null;

  if (dogs.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-[#2d6a4f]/70">
          Er zijn momenteel geen honden beschikbaar voor wandelingen.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {dogs.map((dog) => (
          <DogCard key={dog.id} dog={dog} onBook={setSelectedDogId} />
        ))}
      </div>

      {selectedDog && (
        <WalkBookingForm
          dog={selectedDog}
          walkDays={walkDays}
          onCancel={() => setSelectedDogId(null)}
          onSuccess={() => setSelectedDogId(null)}
        />
      )}
    </>
  );
}
