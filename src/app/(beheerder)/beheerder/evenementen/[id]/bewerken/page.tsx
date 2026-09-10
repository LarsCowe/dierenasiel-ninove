import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { getEventById, getTrekkerOptions } from "@/lib/queries/events";
import EventForm from "@/components/beheerder/evenementen/EventForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EvenementBewerkenPage({ params }: Props) {
  const permCheck = await requirePermission("event:write");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder/evenementen");
  }

  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) notFound();

  const [event, opties] = await Promise.all([getEventById(eventId), getTrekkerOptions()]);
  if (!event) notFound();

  // Een trekker die intussen gedeactiveerd is of geen backoffice-rol meer heeft, moet in
  // de lijst blijven staan — anders zou elke bewaring hem stilletjes weghalen. Rechten
  // heeft hij niet meer (zie `eventRights`); de beheerder ziet dat aan het label.
  const trekkerOptions =
    event.trekkerUserId && !opties.some((o) => o.id === event.trekkerUserId)
      ? [...opties, { id: event.trekkerUserId, name: `${event.trekkerName ?? "Onbekend"} (geen toegang meer)` }]
      : opties;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/beheerder/evenementen/${event.id}`} className="text-sm text-[#2d6a4f] hover:underline">
        ← Terug naar {event.name}
      </Link>
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">Evenement bewerken</h1>
      <EventForm mode="edit" event={event} trekkerOptions={trekkerOptions} />
    </div>
  );
}
