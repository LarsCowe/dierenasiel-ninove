export default function WalkerNotApprovedMessage() {
  return (
    <div className="mx-auto max-w-md px-6 pt-12 text-center">
      <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-amber-100 text-4xl">
        <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="font-heading text-xl font-bold text-[#1b4332]">
        Registratie in behandeling
      </h2>
      <p className="mt-3 text-[#2d6a4f]/80">
        Uw registratie is nog niet goedgekeurd. De coordinator zal uw aanvraag
        zo snel mogelijk behandelen. U ontvangt een melding zodra uw account
        is geactiveerd.
      </p>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          Na goedkeuring kunt u wandelingen boeken met onze honden.
        </p>
      </div>
    </div>
  );
}
