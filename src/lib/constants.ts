export const SITE_NAME = "Dierenasiel Ninove VZW";
export const SITE_TAGLINE =
  "Het Dierenasiel Ninove geeft nieuwe kansen aan dieren die een nieuwe thuis zoeken.";
export const ENTERPRISE_NUMBER = "BE 0420.668.808";
export const IBAN = "BE98 0680 7888 7093";

export const SHELTER_LOCATIONS = {
  dogs: {
    label: "Honden (nieuw gebouw)",
    address: "Minnenhofstraat 24",
    city: "9400 Denderwindeke (Ninove)",
    coords: { lat: 50.79356, lng: 4.02095 },
    email: "honden@dierenasielninove.be",
  },
  cats: {
    label: "Katten & andere dieren",
    address: "Kerkveld 29",
    city: "9400 Denderwindeke (Ninove)",
    coords: { lat: 50.81, lng: 3.96 },
    email: "info@dierenasielninove.be",
  },
} as const;

export const CONTACT = {
  phone: "054/32 16 79",
  phoneHref: "tel:+3254321679",
  emailGeneral: "info@dierenasielninove.be",
  emailDogs: "honden@dierenasielninove.be",
  emailLegacy: "dierenasielninove@hotmail.com",
  website: "www.dierenasielninove.be",
  facebook: "https://www.facebook.com/dierenasielninove",
  trooper:
    "https://www.trooper.be/nl/trooperverenigingen/dierenasielninove",
} as const;

export const VISITING_HOURS = {
  days: "Maandag tot zaterdag",
  hours: "15:00 - 18:00",
  closed: "Zondag gesloten",
  walkingHours: "10:00 - 12:00 (enkel vaste vrijwilligers)",
} as const;

export const NAV_ITEMS = [
  { label: "Over ons", href: "/over-ons" },
  { label: "Honden", href: "/honden-ter-adoptie" },
  { label: "Katten", href: "/katten-ter-adoptie" },
  { label: "Andere dieren", href: "/andere-dieren" },
  { label: "Nieuws", href: "/nieuws" },
  { label: "Steun ons", href: "/steun-ons" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LINKS = {
  navigation: [
    { label: "Over ons", href: "/over-ons" },
    { label: "Onze dieren", href: "/honden-ter-adoptie" },
    { label: "Adoptieproces", href: "/over-ons#adoptieproces" },
    { label: "Nieuws", href: "/nieuws" },
    { label: "Contact", href: "/contact" },
  ],
  dieren: [
    { label: "Honden", href: "/honden-ter-adoptie" },
    { label: "Katten", href: "/katten-ter-adoptie" },
    { label: "Andere dieren", href: "/andere-dieren" },
  ],
  info: [
    { label: "Wandelreglement", href: "/wandelreglement" },
    { label: "Dier afstaan", href: "/een-dier-afstaan" },
    { label: "Vrijwilligerswerk", href: "/vrijwilligerswerk" },
    { label: "Steun ons", href: "/steun-ons" },
    { label: "Kennelsponsor", href: "/kennelsponsor" },
    { label: "Eetfestijn", href: "/eetfestijn" },
  ],
} as const;

export const TEAM_MEMBERS = [
  { name: "Katrien Reygaerts", role: "Beheerder / Manager" },
  { name: "Martine Van Den Steen", role: "Beheerder / Manager" },
  { name: "Peter", role: "Bestuurslid" },
  { name: "Dierenarts Nadia", role: "Dierenarts" },
  { name: "Chloe", role: "Medewerkster katten" },
  { name: "Sven", role: "Medewerker honden" },
] as const;

export const VOLUNTEERS = [
  "Natasja",
  "Nathalie",
  "Ward",
  "Lars",
  "Els",
  "Christel",
  "Joris",
  "Shirley",
  "David",
  "Marie-Josee",
] as const;
