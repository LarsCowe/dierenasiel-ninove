import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-28 pb-20 bg-bg min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-8xl mb-6">🐾</div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-primary-dark mb-4">
          Pagina niet gevonden
        </h1>
        <p className="text-text-light text-lg mb-8 max-w-md mx-auto">
          Oeps! Deze pagina lijkt weggelopen te zijn. Misschien kunnen we je
          helpen bij het vinden van wat je zoekt?
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
          >
            Naar de homepage
          </Link>
          <Link
            href="/honden-ter-adoptie"
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-full font-bold hover:bg-primary hover:text-white hover:-translate-y-0.5 transition-all"
          >
            Bekijk onze dieren
          </Link>
        </div>
      </div>
    </div>
  );
}
