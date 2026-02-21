import Link from "next/link";
import {
  SITE_NAME,
  ENTERPRISE_NUMBER,
  CONTACT,
  FOOTER_LINKS,
  SHELTER_LOCATIONS,
} from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white/80 pt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 text-white font-heading text-xl font-bold">
              <div className="w-11 h-11 bg-accent rounded-full flex items-center justify-center text-xl shrink-0">
                🐾
              </div>
              <span>{SITE_NAME}</span>
            </Link>
            <p className="text-sm leading-relaxed mt-4 max-w-xs">
              Wij vangen dieren op die een nieuw thuis zoeken. Met liefde, zorg en
              toewijding geven we elk dier een tweede kans op geluk.
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href={CONTACT.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg hover:bg-accent hover:-translate-y-0.5 transition-all"
                aria-label="Facebook"
              >
                📘
              </a>
            </div>
          </div>

          {/* Navigatie */}
          <div>
            <h4 className="text-white font-bold mb-5">Navigatie</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-accent-light hover:pl-1 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-bold mb-5">Informatie</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-accent-light hover:pl-1 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-5">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li>{SHELTER_LOCATIONS.dogs.address}</li>
              <li>{SHELTER_LOCATIONS.dogs.city}</li>
              <li className="mt-2.5">
                <a href={CONTACT.phoneHref} className="text-white/70 hover:text-accent-light transition-colors">
                  {CONTACT.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.emailGeneral}`} className="text-white/70 hover:text-accent-light transition-colors">
                  {CONTACT.emailGeneral}
                </a>
              </li>
              <li className="mt-2.5">Ma-Za: 15:00 - 18:00</li>
            </ul>
          </div>
        </div>

        <div className="py-6 text-center text-xs text-white/50">
          <p>
            &copy; {new Date().getFullYear()} {SITE_NAME}. Alle rechten
            voorbehouden. | {ENTERPRISE_NUMBER}
          </p>
        </div>
      </div>
    </footer>
  );
}
