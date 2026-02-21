import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import ContactForm from "@/components/contact/ContactForm";
import { CONTACT, SHELTER_LOCATIONS, VISITING_HOURS } from "@/lib/constants";

const contactCards = [
  {
    icon: "📍",
    title: "Adres (honden)",
    content: `${SHELTER_LOCATIONS.dogs.address}\n${SHELTER_LOCATIONS.dogs.city}`,
  },
  {
    icon: "📞",
    title: "Telefoon",
    content: CONTACT.phone,
    href: CONTACT.phoneHref,
  },
  {
    icon: "✉️",
    title: "E-mail",
    content: CONTACT.emailGeneral,
    href: `mailto:${CONTACT.emailGeneral}`,
  },
  {
    icon: "🕐",
    title: "Bezoekuren",
    content: `${VISITING_HOURS.days}\n${VISITING_HOURS.hours}`,
  },
];

export default function ContactSection() {
  return (
    <section className="py-24 bg-bg" id="contact">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info side */}
          <AnimateOnScroll animation="fade-in-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
              <span className="inline-block w-8 h-0.5 bg-accent rounded" />
              Contact
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark leading-tight mb-5">
              Neem contact met ons op
            </h2>
            <p className="text-text-light leading-relaxed mb-8">
              Heb je vragen over adoptie, wil je vrijwilliger worden of wil je
              ons steunen? We horen graag van je! We proberen binnen 3 werkdagen
              te antwoorden.
            </p>

            <div className="space-y-5">
              {contactCards.map((card) => (
                <div
                  key={card.title}
                  className="flex items-start gap-4 p-6 bg-gray-100 rounded-xl hover:bg-warm hover:translate-x-1 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center text-lg shrink-0">
                    {card.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-dark mb-1">
                      {card.title}
                    </h4>
                    {card.href ? (
                      <a
                        href={card.href}
                        className="text-sm text-primary font-semibold hover:text-accent transition-colors"
                      >
                        {card.content}
                      </a>
                    ) : (
                      <p className="text-sm text-text-light whitespace-pre-line leading-relaxed">
                        {card.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AnimateOnScroll>

          {/* Form side */}
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
      </div>
    </section>
  );
}
