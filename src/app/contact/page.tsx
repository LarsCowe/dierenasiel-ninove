import type { Metadata } from "next";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import ContactForm from "@/components/contact/ContactForm";
import { CONTACT, SHELTER_LOCATIONS, VISITING_HOURS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Neem contact op met Dierenasiel Ninove. Vragen over adoptie, vrijwilligerswerk of donaties? We horen graag van je!",
};

export default function ContactPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Contact
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Neem contact met ons op
          </h1>
          <p className="text-text-light max-w-xl mx-auto leading-relaxed">
            We proberen binnen 3 werkdagen te antwoorden. Bel of kom niet
            spontaan langs — we werken op afspraak.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact info */}
          <AnimateOnScroll animation="fade-in-left">
            <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
              Locaties
            </h2>

            {/* Dogs location */}
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-4">
              <h3 className="font-bold text-primary-dark mb-2">
                🐕 {SHELTER_LOCATIONS.dogs.label}
              </h3>
              <p className="text-sm text-text-light">
                {SHELTER_LOCATIONS.dogs.address}
                <br />
                {SHELTER_LOCATIONS.dogs.city}
              </p>
              <a
                href={`mailto:${SHELTER_LOCATIONS.dogs.email}`}
                className="text-sm text-primary font-semibold hover:text-accent transition-colors"
              >
                {SHELTER_LOCATIONS.dogs.email}
              </a>
            </div>

            {/* Cats location */}
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
              <h3 className="font-bold text-primary-dark mb-2">
                🐈 {SHELTER_LOCATIONS.cats.label}
              </h3>
              <p className="text-sm text-text-light">
                {SHELTER_LOCATIONS.cats.address}
                <br />
                {SHELTER_LOCATIONS.cats.city}
              </p>
              <a
                href={`mailto:${SHELTER_LOCATIONS.cats.email}`}
                className="text-sm text-primary font-semibold hover:text-accent transition-colors"
              >
                {SHELTER_LOCATIONS.cats.email}
              </a>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 bg-gray-100 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center text-lg shrink-0">
                  📞
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark mb-1">Telefoon</h4>
                  <a
                    href={CONTACT.phoneHref}
                    className="text-sm text-primary font-semibold hover:text-accent transition-colors"
                  >
                    {CONTACT.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-gray-100 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center text-lg shrink-0">
                  🕐
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark mb-1">Bezoekuren</h4>
                  <p className="text-sm text-text-light">
                    {VISITING_HOURS.days}
                    <br />
                    {VISITING_HOURS.hours}
                    <br />
                    <span className="text-accent font-semibold">
                      {VISITING_HOURS.closed}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Form */}
          <AnimateOnScroll animation="fade-in-right">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-md">
              <h3 className="font-heading text-2xl font-bold text-primary-dark mb-2">
                Stuur ons een bericht
              </h3>
              <p className="text-sm text-text-light mb-7">
                Vul het formulier in en we nemen zo snel mogelijk contact met je
                op.
              </p>
              <ContactForm />
            </div>
          </AnimateOnScroll>
        </div>

        {/* Map */}
        <div className="mt-16 rounded-2xl overflow-hidden shadow-md">
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2518.5!2d${SHELTER_LOCATIONS.dogs.coords.lng}!3d${SHELTER_LOCATIONS.dogs.coords.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1sDierenasiel+Ninove!2s!5e0!3m2!1snl!2sbe`}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Locatie Dierenasiel Ninove"
            className="grayscale-[30%] opacity-95"
          />
        </div>
      </div>
    </div>
  );
}
