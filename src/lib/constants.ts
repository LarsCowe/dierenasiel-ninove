export const SITE_NAME = "Dierenasiel Ninove VZW";
export const SITE_TAGLINE =
  "Het Dierenasiel Ninove (Denderwindeke) geeft nieuwe kansen aan dieren die een nieuwe thuis zoeken.";
export const ENTERPRISE_NUMBER = "BE 0420.668.808";
export const IBAN = "BE98 0680 7888 7093";
export const HK_NUMBER = "HK 30408195";

const WIX = "https://static.wixstatic.com/media";

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
  walkingDays: "Maandag, woensdag, vrijdag, zaterdag",
  walkingHours: "10:00 - 12:00",
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
  {
    name: "Martine Van Den Steen",
    role: "Uitbaatster",
    imageUrl: `${WIX}/0f1711_b56f1deb573e41da890993629e7f246b~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/0f1711_b56f1deb573e41da890993629e7f246b~mv2.jpg`,
  },
  {
    name: "Katrien Reygaerts",
    role: "Bestuurslid",
    imageUrl: `${WIX}/12c6b4_dc0a15e8183149009ad48498ed78e7ca~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_dc0a15e8183149009ad48498ed78e7ca~mv2.jpg`,
  },
  {
    name: "Peter",
    role: "Bestuurslid",
    imageUrl: `${WIX}/12c6b4_343d35f913ea48ec825a8d5720490946~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_343d35f913ea48ec825a8d5720490946~mv2.jpg`,
  },
  {
    name: "Dierenarts Nadia",
    role: "Dierenarts",
    imageUrl: `${WIX}/0f1711_9769fda894074bd9b38872dd84244ede~mv2_d_2048_1418_s_2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/0f1711_9769fda894074bd9b38872dd84244ede~mv2_d_2048_1418_s_2.jpg`,
  },
  {
    name: "Chloe",
    role: "Medewerkster katten",
    imageUrl: `${WIX}/12c6b4_5c81bc249f574c2aa1aa4c22fa0a13a4~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_5c81bc249f574c2aa1aa4c22fa0a13a4~mv2.jpg`,
  },
  {
    name: "Sven",
    role: "Medewerker honden",
    imageUrl: `${WIX}/12c6b4_e633094b8a674fa49956e1a0f2a08349~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_e633094b8a674fa49956e1a0f2a08349~mv2.jpg`,
  },
] as const;

export const VOLUNTEERS = [
  {
    name: "Natasja",
    imageUrl: `${WIX}/12c6b4_443fdf3e6e9d4ad7aad9e002fed1564a~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_443fdf3e6e9d4ad7aad9e002fed1564a~mv2.jpg`,
  },
  {
    name: "Nathalie",
    imageUrl: `${WIX}/12c6b4_89d6488334d5474f9d4417c97894ea32~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_89d6488334d5474f9d4417c97894ea32~mv2.jpg`,
  },
  {
    name: "Ward",
    imageUrl: `${WIX}/12c6b4_cfeea0d9299c4638a848f947b9b95bd9~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_cfeea0d9299c4638a848f947b9b95bd9~mv2.jpg`,
  },
  {
    name: "Lars",
    imageUrl: `${WIX}/12c6b4_b4437b82cf7f4593a207c88da348f5fd~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_b4437b82cf7f4593a207c88da348f5fd~mv2.jpg`,
  },
  {
    name: "Els",
    imageUrl: `${WIX}/12c6b4_d771ab8df3654964a6ef47f2185d42f4~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_d771ab8df3654964a6ef47f2185d42f4~mv2.jpg`,
  },
  {
    name: "Christel",
    imageUrl: `${WIX}/12c6b4_01781dce640e47519ce3dfa608efa2f3~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_01781dce640e47519ce3dfa608efa2f3~mv2.jpg`,
  },
  {
    name: "Joris",
    imageUrl: `${WIX}/12c6b4_0266b52ef24949dfa76262a87465ef3b~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_0266b52ef24949dfa76262a87465ef3b~mv2.jpg`,
  },
  {
    name: "Shirley",
    imageUrl: `${WIX}/12c6b4_44c6e102fe60463190faf89fb6fe3b07~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_44c6e102fe60463190faf89fb6fe3b07~mv2.jpg`,
  },
  {
    name: "David",
    imageUrl: `${WIX}/12c6b4_1cd34dab47d4485caf8bec2e5e362064~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_1cd34dab47d4485caf8bec2e5e362064~mv2.jpg`,
  },
  {
    name: "Marie-Josee",
    imageUrl: `${WIX}/12c6b4_721c049250a641099b2c6592ac0ab381~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_721c049250a641099b2c6592ac0ab381~mv2.jpg`,
  },
  {
    name: "Annemie",
    imageUrl: `${WIX}/12c6b4_bcc691f6a97a476690fc130099235b10~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_bcc691f6a97a476690fc130099235b10~mv2.jpg`,
  },
  {
    name: "Luc",
    imageUrl: `${WIX}/12c6b4_967244ff54ee417da9c7c7a2a0911bc0~mv2.jpg/v1/fill/w_400,h_334,al_c,q_80,enc_auto/12c6b4_967244ff54ee417da9c7c7a2a0911bc0~mv2.jpg`,
  },
] as const;

export const SITE_LOGO_URL = `${WIX}/12c6b4_08c41b8c45754289bb6e258b78f15349~mv2.png/v1/crop/x_31,y_0,w_542,h_542/fill/w_311,h_311,al_c,q_85,enc_auto/logo4.png`;
export const TROOPER_BANNER_URL = `${WIX}/12c6b4_8d3f482b7e164f8f9cd83d69f6813524~mv2.png/v1/fill/w_453,h_172,al_c,q_85,enc_auto/349181460_663508265641046_5119675185064921168_n.png`;
