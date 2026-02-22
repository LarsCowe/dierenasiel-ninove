import type { NewAnimal } from "@/types";

// High-quality Wix image URLs from the old website
const WIX = "https://static.wixstatic.com/media";

// Helper to create a standardized Wix image URL
function wixImg(id: string, ext = "jpg") {
  return `${WIX}/${id}~mv2.${ext}/v1/fill/w_800,h_800,al_c,q_80,enc_auto/${id}~mv2.${ext}`;
}

export const dogSeeds: NewAnimal[] = [
  {
    name: "Vito",
    slug: "vito",
    species: "hond",
    breed: "Mechelse Herder x Duitse Herder",
    gender: "reu",
    dateOfBirth: "2022-05-02",
    isNeutered: false,
    description: `Vito is een knappe en indrukwekkende hond. Hij heeft een sterk karakter en een groot hart voor wie hem begrijpt. Hij zoekt een ervaren en consequente baas die stevig in zijn schoenen staat en weet hoe je duidelijkheid en structuur biedt. Vito is geen hond voor beginners maar voor iemand die zijn taal spreekt en graag samenwerkt met een intelligente, energieke hond.

Aan de lijn loopt hij mooi mee en kent zijn commando's. In huis heeft Vito behoefte aan rust en duidelijkheid. Daarom zoeken we voor hem een thuis zonder andere honden of kleine kinderen, waar hij echt tot rust kan komen en zich veilig voelt.

Een goed omheinde tuin is belangrijk, zodat hij ook buiten zijn energie kwijt kan. Eens je zijn vertrouwen hebt gewonnen, krijg je er een loyale kameraad voor terug die je met hart en ziel zal verdedigen. Vito is waaks en alert en zal niet aarzelen om zich tussen jou en een (voor hem) onbekende te plaatsen als hij denkt dat er gevaar dreigt.

Met de juiste begeleiding en een stabiele omgeving zal Vito zich ontwikkelen tot een trouwe en betrouwbare metgezel die zijn baas door en door respecteert.`,
    shortDescription: "Een knappe en indrukwekkende kruising met een sterk karakter.",
    imageUrl: wixImg("12c6b4_cd2649975be84f4eb228b69c1ede8484"),
    images: [
      `${WIX}/12c6b4_7c75321881e54a4595edcbee19439002~mv2.jpeg/v1/fill/w_800,h_560,al_c,q_80,enc_auto/12c6b4_7c75321881e54a4595edcbee19439002~mv2.jpeg`,
    ],
    status: "beschikbaar",
    isFeatured: true,
    intakeDate: "2024-08-01",
  },
  {
    name: "Rocky",
    slug: "rocky",
    species: "hond",
    breed: "Berner Sennenhond x Husky x Malamute",
    gender: "reu",
    dateOfBirth: "2020-12-20",
    isNeutered: true,
    description:
      "Rocky is een stevige hond die op zoek is naar een ervaren baasje. Ik ben een kruising van Berner Sennenhond, Husky en Malamute — een indrukwekkende verschijning met een zacht hart. Ik ben gecastreerd en heb nood aan een baasje dat mij de structuur, beweging en liefde kan bieden die ik verdien. Met geduld en consequentie word ik de beste vriend die je je kan wensen.",
    shortDescription: "Een stevige kruising die een ervaren en liefdevol baasje zoekt.",
    imageUrl: wixImg("12c6b4_fe290441b8a445b298236e8d171f04de"),
    status: "beschikbaar",
    isFeatured: true,
    intakeDate: "2024-04-01",
  },
  {
    name: "Boy",
    slug: "boy",
    species: "hond",
    breed: "Engelse Pointer",
    gender: "reu",
    dateOfBirth: "2023-10-01",
    isNeutered: true,
    description: `Hoi, ik ben Boy! 🐾

Ik ben een jonge Engelse Pointer en ben via een inbeslagname in het asiel terechtgekomen. Het begin van een nieuw hoofdstuk in mijn leven!
Toen ik aankwam was ik veel te mager, maar dat wordt nu goedgemaakt met meerdere maaltijden per dag. Ik ben er nog niet helemaal maar met wat tijd komt dat helemaal goed.

Ik ben een supervrolijke jongen met een groot hart en nóg grotere portie energie. Wandelen vind ik fantastisch, ik ga er graag op uit om de wereld te ontdekken. Alleen… ik moet nog wat oefenen met rustig stappen want op dit moment ben ik nog een echt springkonijn vol levenslust!

Zoals het een echte Engelse Pointer betaamt, zit het jachthondbloed stevig in mij. Ik heb een scherpe neus, een groot uithoudingsvermogen en een sterke drang om te bewegen en te verkennen. Daarom zoek ik een thuis met een grote, goed omheinde tuin (liefst hoog! 🏡) waar ik veilig mijn energie kwijt kan.

Of ik zindelijk ben? Dat is nog wat af te wachten. En ook het alleen thuisblijven zal stap voor stap opgebouwd moeten worden want dat ken ik nog niet zo goed. Maar ik ben een slimme, leergierige hond die met wat tijd, liefde en consequente begeleiding enorm veel kan leren.

Ik ben sociaal, vriendelijk en geniet van menselijk gezelschap: ik wil er graag bij horen en deel uitmaken van een warm gezin dat graag actief bezig is. Samen wandelen, spelen, trainen en vooral genieten… dat is waar ik van droom. 💛
Andere honden kan getest worden als ze omkunnen met mijn energie 😁`,
    shortDescription: "Een jonge Engelse Pointer vol levenslust en avontuur.",
    imageUrl: `${WIX}/12c6b4_5b41ca374b4448489b9f8c9475cc0f96~mv2.jpeg/v1/fill/w_800,h_1010,al_c,q_80,enc_auto/12c6b4_5b41ca374b4448489b9f8c9475cc0f96~mv2.jpeg`,
    images: [
      `${WIX}/12c6b4_ab19c3a638ae45f28b0fe016e735503a~mv2.jpeg/v1/fill/w_800,h_687,al_c,q_80,enc_auto/12c6b4_ab19c3a638ae45f28b0fe016e735503a~mv2.jpeg`,
    ],
    status: "beschikbaar",
    badge: "nieuw",
    isFeatured: true,
    intakeDate: "2025-01-10",
  },
  {
    name: "Athena",
    slug: "athena",
    species: "hond",
    breed: "Mechelse Herder",
    gender: "teef",
    dateOfBirth: "2022-03-09",
    isNeutered: false,
    description: `Hallo, ik ben Athena! ✨
Ik ben een prachtige, compacte Mechelse herder van 3,5 jaar jong. Via afstand ben ik in de opvang terechtgekomen en nu droom ik van een thuis waar ik écht deel uitmaak van het gezin.

Als je mij ziet, zie je mijn balletje. Wij zijn onafscheidelijk. Ik ben altijd klaar om er achteraan te rennen, want spelen en werken geven mij energie en plezier. Ik ben slim, leergierig en gericht op mijn mens. Zoals een echte Mechelaar ben ik alert, trouw en vind ik het heerlijk om bezig te zijn — zowel met mijn hoofd als met mijn lijf.

Overdag ben ik gewend om zowel binnen als buiten te leven, maar 's nachts moest ik altijd buiten blijven. Dat vind ik niet fijn. Ik lig veel liever binnen, dicht bij mijn mensen. Ik gedij het best in een thuis met voldoende structuur en duidelijke regels. Dan weet ik waar ik aan toe ben en kan ik mijn energie op een goede manier kwijt.

Ik wandel heel netjes aan de lijn. Buiten kijken we samen naar de wereld, en binnen kom ik tot rust. Ik woon het liefst als enige hond want dan krijg ik de aandacht en begeleiding die bij mij passen. Katten en ik? Nee. Ik haat katten, dus ik zoek een kattenvrij huis. Kleine kindjes zijn voor mij te druk en onvoorspelbaar. Een rustig gezin zonder jonge kinderen past veel beter bij mij.

Alleen thuisblijven is geen probleem. Laat je me echter in de tuin zonder toezicht, dan zie ik dat als een uitnodiging om op avontuur te gaan. Ik kan namelijk met gemak twee meter hoog springen 😉. Een veilige tuin is dus heel belangrijk.

Ik zoek een thuis bij mensen die ervaring hebben met Mechelse herders. Mensen die mijn intelligentie waarderen, mij uitdaging bieden en mij onderdeel willen maken van het gezin.`,
    shortDescription: "Een prachtige, compacte Mechelse herder van 3,5 jaar jong.",
    imageUrl: wixImg("12c6b4_8c5ac89ae40c41e09e8ab2998424c267"),
    images: [
      `${WIX}/12c6b4_66bbf03f175f4a9390f546627e14f410~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_66bbf03f175f4a9390f546627e14f410~mv2.jpg`,
    ],
    status: "beschikbaar",
    isFeatured: true,
    intakeDate: "2024-09-01",
  },
  {
    name: "Lex",
    slug: "lex",
    species: "hond",
    breed: "Siberische Husky",
    gender: "reu",
    dateOfBirth: "2020-09-15",
    isNeutered: true,
    description: `Hoi, ik ben Lex, een prachtige witte Husky, alsof ik recht uit een sneeuwlandschap ben komen aangehuppeld 😅.
Ik zie er misschien stoer en majestueus uit, maar laat je niet misleiden: vanbinnen ben ik vooral een gevoelige ziel in een fluffy jas.

Voor mijn toekomst zoek ik een thuis waar ik de enige hond ben.
Zoals een echte Husky kan ik goed wandelen, zolang jij begrijpt dat "wandelen" bij ons soms betekent:
1% wandelen,
9% snuffelen,
40% majestueus rondkijken,
en 50% doen alsof ik een wolf ben die op expeditie is.

Qua karakter ben ik een afwachtende jongen. Ik moet je eerst leren kennen, je geur even analyseren, je bewegingen inschatten… Ach ja, Husky-logica: "Eerst zien of jij mijn menselijke partner waard bent."
Maar eens ik je vertrouw? Dan ben ik je trouwe, aanhankelijke sneeuwbeer.

Alleen thuisblijven, zindelijkheid, dagelijkse routine… dingen die nog te verbeteren zijn maar ik ben slim en Huskies zijn geboren probleemoplossers (jammer genoeg soms te goed 😅).

Dus, ben jij klaar voor een knappe, witte Husky die je hart langzaam verovert met zachte ogen en een dosis mysterie?`,
    shortDescription: "Een prachtige witte Husky, alsof hij recht uit een sneeuwlandschap komt.",
    imageUrl: wixImg("12c6b4_87a2ea0051c140629a19928739ae540c"),
    images: [
      `${WIX}/12c6b4_bdba3285fd6e41488b1a351bd58b5831~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_bdba3285fd6e41488b1a351bd58b5831~mv2.jpg`,
    ],
    status: "beschikbaar",
    intakeDate: "2024-05-01",
  },
  {
    name: "Tim",
    slug: "tim",
    species: "hond",
    breed: "Mechelse Herder",
    gender: "reu",
    dateOfBirth: "2012-09-19",
    isNeutered: false,
    description: `Ik ben Tim.
En dit is misschien wel het moeilijkste verhaal dat ik ooit moet vertellen.

Mijn baasje is overleden.
Hij was mijn mens, mijn thuis, mijn alles. Sindsdien ben ik op zoek naar een warme mand voor mijn laatste jaren. Dat klinkt zwaar, dat weet ik… maar het is wel de waarheid.

Ik snap het. Echt waar. De meeste mensen vallen voor pups: jong, speels, een heel leven nog voor zich. En toch ga ik hier mijn best doen om mezelf te "verkopen", al voelt dat een beetje vreemd.

Ik ben waakzaam en voorzichtig. Ik neem de tijd om mensen te leren kennen. Niet omdat ik niet wil, maar omdat ik al zoveel heb moeten loslaten. Als we eenmaal samen op pad zijn, merk je het meteen: ik ben een goede wandelaar. Ja ja, ook op mijn leeftijd. Ik geniet ervan, van het buiten zijn, van samen stappen zetten.

En misschien verrast het je nog wel het meest: ik ben een tikkeltje aanhankelijk. Niet opdringerig, gewoon graag dicht bij je. In stilte samen zijn is soms al genoeg.

Ik ben niet gewend om met andere honden en met kinderen te leven.
Ze vermoeden hier dat ik zindelijk ben en ook wel even alleen thuis kan blijven.

Wat ik zoek is geen perfect leven. Geen drukte. Geen groot avontuur. Gewoon een mens die mij nog een plek geeft, een zachte stem, een rustige hand, een warm bed.
Misschien kies je geen pup dit keer. Misschien kies je voor mij. En geef je mij nog één hoofdstuk dat eindigt zoals het hoort: samen. 🐾💙`,
    shortDescription: "Een oudere Mechelse Herder die een rustig en liefdevol thuis zoekt.",
    imageUrl: wixImg("12c6b4_9df752ba213d4b938af938ed353ec26f"),
    images: [
      `${WIX}/12c6b4_822a0ac9e9034f64ada051004d7f8501~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_822a0ac9e9034f64ada051004d7f8501~mv2.jpg`,
    ],
    status: "beschikbaar",
    badge: "dringend",
    intakeDate: "2023-12-01",
  },
  {
    name: "Bella",
    slug: "bella",
    species: "hond",
    breed: "Siberische Husky",
    gender: "teef",
    dateOfBirth: "2020-12-29",
    isNeutered: true,
    description: `Hoi, ik ben Bella!
En ja hoor, mijn naam zegt het al: ik bén mooi.
Maar belangrijker: ik ben ook lief, aanhankelijk en een absolute wandelkampioene.
Serieus, je hoeft me maar een leiband te tonen en ik wandel mee alsof ik auditie doe voor "Honden op de catwalk". 🐾✨

Qua karakter ben ik echt een superlieve, zachte, aanhankelijke hond. Eén die graag bij je is en die je elke dag laat lachen met mijn rare trekjes.
Ik ben dus op zoek naar een thuis waar al een hondenvriendje aanwezig is want zonder buddy zou ik me maar alleen voelen. Of het klikt tussen ons (ik en mijn nieuwe hondenvriend) zien we wel tijdens een kennismaking 😜

Goed afgesloten tuin? AUB ja. Ik ben lief en schattig, maar als er ergens een gaatje is dan zie ik dat als een persoonlijke uitnodiging om een "Bella goes exploring"-tour te beginnen. Je wil die film niet elke dag opnieuw meemaken.

Alleen thuisblijven? Euh… tja… Rustig opbouwen, zeggen de professionals. Persoonlijk dacht ik eerder: "Waarom zou je me ooit alleen laten?" Maar goed, ik ben bereid te oefenen.

Zindelijkheid? Valt te verbeteren, mij op tijd buiten laten is de boodschap.`,
    shortDescription: "Een prachtige Siberische Husky met de mooiste blauwe ogen.",
    imageUrl: `${WIX}/12c6b4_ed121ff0d7744fd7810cba53babf4261~mv2.jpg/v1/fill/w_800,h_1131,al_c,q_80,enc_auto/12c6b4_ed121ff0d7744fd7810cba53babf4261~mv2.jpg`,
    images: [
      `${WIX}/12c6b4_689ea172ab83413b841d69c7a2ef6050~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_689ea172ab83413b841d69c7a2ef6050~mv2.jpg`,
    ],
    status: "beschikbaar",
    isFeatured: true,
    intakeDate: "2024-03-15",
  },
  {
    name: "Iza",
    slug: "iza",
    species: "hond",
    breed: "American Staffordshire Terrier",
    gender: "teef",
    dateOfBirth: "2023-05-23",
    isNeutered: false,
    description: `Hoi! Ik ben Iza 🐶💖
Een jonge, lieve Stafford met een groot hart, een nóg grotere knuffelnood en… vooruit, een beetje chaosenergie.
Door omstandigheden ben ik in de opvang terechtgekomen (afstand dus), maar geloof me: hier noemen ze mij een superlieve, aanhankelijke schat. Ik plak graag aan mensen vast — zeg maar gerust Stafford-klittenband.

Goed nieuws:
✔️ Ik ben zindelijk
✔️ Ik kan alleen thuisblijven
✔️ En ja hoor, ik ben zelfs 's nachts een bench gewoon, … al moet ik toegeven: ik zit daar niet graag in. Jij wel? 😏

Klein aandachtspuntje (oké, eerlijk is eerlijk): ik durf wel eens iets stuk te bijten. Sorry alvast! Maar hé… als je schoenen, kussens of afstandsbedieningen laat rondslingeren, vraag je er ook een béétje om, toch? 🙈 Met begeleiding en duidelijke regels kan ik dat echt afleren.

Wandelen? Ooooh ja, dat vind ik fantastisch!
Ik doe dat wel op mijn eigen manier: met enthousiasme en kracht. Trekken kan ik als de beste — olympisch niveau, echt waar 💪. Jij mag mij hierbij nog wat begeleiden, want ik leer graag bij.

Ik heb veel energie en ben soms wat lomp van enthousiasme. Kleine kindjes vinden dat niet altijd even leuk, dus ik zoek een thuis met oudere kinderen die tegen een vrolijke wervelwind kunnen.
Andere dieren? Euh… nee! Geen honden en geen katten. Nee, ook écht geen kat 🐱❌.

Ben jij op zoek naar een trouwe, grappige, liefdevolle Stafford die je laat lachen, bewegen en af en toe "Izaaaa…" doet zuchten? Dan ben ik misschien wel jouw forever girl 💕🐾`,
    shortDescription: "Een jonge, lieve Stafford met een groot hart en een nog grotere knuffelnood.",
    imageUrl: wixImg("12c6b4_000d3f0edc4740dfb2eda99be7f49537"),
    images: [
      `${WIX}/12c6b4_de8a879946ed428c802e64f58ab6bfa4~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_de8a879946ed428c802e64f58ab6bfa4~mv2.jpg`,
    ],
    status: "beschikbaar",
    isFeatured: true,
    intakeDate: "2024-11-01",
  },
  {
    name: "Aira",
    slug: "aira",
    species: "hond",
    breed: "Terrier Mix",
    gender: "reu",
    dateOfBirth: "2015-03-15",
    isNeutered: true,
    description: `Hallo daar, ik ben Aira.
Officieel ben ik een oudere heer, maar noem mij gerust een oude knol met verrassend stevige pootjes. 🥔➡️🐕

Ik ben in de opvang terechtgekomen na een brand (ja, ook ik had liever een andere verhuis gehad), maar kijk: ik ben er nog, ik sta recht, en ik ben klaar voor mijn volgende hoofdstuk.

Laat je niet misleiden door mijn leeftijd: ik wandel nog graag mee. Geen marathon graag, maar dagelijkse rustige wandelingen? Ja hoor, graag zelfs! Kleine kanttekening: ik kan nog steeds stevig trekken aan de leiband. Niet constant hoor, maar af en toe vergeet ik dat ik geen jonge spring-in-'t-veld meer ben. Zie het als nostalgie. 💪😄

En na die wandeling… héél belangrijk… wil ik uitrusten in een warme, gezellige mand. Liefst eentje waar ik diep kan zuchten alsof ik net een dubbele werkshift achter de rug heb. 😌

Ik ben een rustige ziel en zoek dan ook een kalme thuis waar het leven niet te luid of te chaotisch is.

Katten? Ben ik gewend. Andere honden? Dat kan zeker, zolang we elkaar rustig en beleefd mogen leren kennen. Ik ben geen fan van plots "HIER BEN IK"-gedrag. Doe maar netjes.

Kindjes vind ik ook oké, zolang ze al wat groter zijn en begrijpen dat ik geen springkasteel ben. Respect is het sleutelwoord — en af en toe een aai mag altijd.

O ja, nog even dit: Mijn zindelijkheid is helemaal in orde. Ik doe mijn ding netjes buiten, zoals het hoort voor een heer van stand.

Ben jij op zoek naar een trouwe metgezel voor rustige wandelingen (met af en toe wat armtraining), zachte dutjes en gezelligheid? Dan wacht ik hier, met mijn grijze snoet. 💕🐾`,
    shortDescription: "Een lieve terrier mix die nog vol energie zit ondanks zijn leeftijd.",
    imageUrl: `${WIX}/12c6b4_6595bb9a6f514fc084aa91c3f8bad3c7~mv2.jpg/v1/fill/w_800,h_1131,fp_0.5_0.42,al_c,q_80,enc_auto/12c6b4_6595bb9a6f514fc084aa91c3f8bad3c7~mv2.jpg`,
    images: [
      `${WIX}/12c6b4_cfe79094e7314188ae16aebe18005e24~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_cfe79094e7314188ae16aebe18005e24~mv2.jpg`,
    ],
    status: "beschikbaar",
    intakeDate: "2024-06-01",
  },
  {
    name: "Kamiel",
    slug: "kamiel",
    species: "hond",
    breed: "American Staffordshire Terrier",
    gender: "reu",
    dateOfBirth: "2021-06-01",
    isNeutered: true,
    description: `Hallo daar, ik ben Kamiel.
Ik ben in de opvang beland via de politie — ja ja, ik heb al een strafblad 😇. Grapje!!!

Mijn baasje werd wel gevonden maar is mij helaas nooit komen ophalen. Dus hier ben ik dan, klaar voor een nieuw hoofdstuk mét een mens die wél voor mij kiest.

In de opvang ben ik ontmaskerd als een aanhankelijke hond. Ik ben het liefst in het gezelschap van mijn mens. Samen zijn, samen wandelen, samen leven… dat is mijn ding. Wandelen doe ik trouwens heel netjes: ik trek niet als een tractor, beloofd 🚶‍♂️🐕

Over mijn verleden? Tja… dat is voor iedereen hier een groot raadsel. Dus doen we het maar met de standaardtekst: ik ben een toffe hond die nog veel kan leren en ontdekken.
Zindelijkheid en alleen thuis blijven? Dat is voorlopig nog een groot vraagteken ❓ Met wat geduld en begeleiding komt dat vast goed.

Wat ik zoek?
Een goed afgesloten tuin, want anders ga ik misschien zelf op avontuur
Geen andere dieren — ik wil graag alle aandacht voor mezelf
Liever wat oudere kinderen, die tegen een stootje kunnen (lees: mijn soms wat lomp enthousiasme 😅)

Ben jij die ene mens die ik mag volgen, aanbidden en lichtjes omver lopen van enthousiasme? Dan wacht ik hier geduldig op jou.`,
    shortDescription: "Een stevige American Stafford op zoek naar een ervaren baasje.",
    imageUrl: wixImg("12c6b4_8f2450fd66ae447ea8198a373208a1c1"),
    images: [
      `${WIX}/12c6b4_9cb28c5cb13f490f9eb30eb7a7ac1521~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_9cb28c5cb13f490f9eb30eb7a7ac1521~mv2.jpg`,
    ],
    status: "gereserveerd",
    badge: "gereserveerd",
    intakeDate: "2024-07-15",
  },
];

export const catSeeds: NewAnimal[] = [
  {
    name: "Tobias & Thor",
    slug: "tobias-en-thor",
    species: "kat",
    breed: "Europese Korthaar",
    gender: "kater",
    dateOfBirth: "2023-06-01",
    isNeutered: true,
    description:
      "Tobias en Thor zijn een onafscheidelijk duo. Deze twee broers doen alles samen: spelen, slapen en knuffelen. Ze zijn gecastreerd, gechipt en geregistreerd. Ze zoeken een gezin dat hen samen kan houden en hen de liefde en ruimte kan geven die ze verdienen.",
    shortDescription: "Een onafscheidelijk kattenduo dat samen een nieuw thuis zoekt.",
    imageUrl: wixImg("12c6b4_a9e7932650044215bbd9e40601ba6b22"),
    status: "beschikbaar",
    isFeatured: true,
    intakeDate: "2024-10-01",
  },
  {
    name: "Molly",
    slug: "molly",
    species: "kat",
    breed: "Huiskat Korthaar",
    gender: "poes",
    dateOfBirth: "2017-04-01",
    isNeutered: true,
    description: `Door de opname van haar baasje in het rusthuis is lieve Molly helaas in de opvang terechtgekomen. Een grote verandering voor dit zachte meisje, maar ze blijft dapper haar hart openstellen voor nieuwe mensen.

Molly is een lief katje dat op haar eigen tempo graag eens geaaid wordt. Geef je haar wat tijd en rust, dan komt ze gezellig bij je in de buurt voor wat zachte aandacht. Opnemen is echter niet haar ding – ze houdt haar 4 pootjes liever veilig op de grond. En eerlijk? Dat respecteren we gewoon.

Molly is FIV-positief. Ze kan perfect een mooi en gelukkig leven leiden, maar daarom zoeken we voor haar een thuis waar ze niet naar buiten kan, zodat ze geen andere katten kan besmetten. Daarnaast plaatsen we haar graag als enige kat, zodat ze alle rust en aandacht voor zichzelf heeft.

Ze is steriel, gechipt, gevaccineerd, ontwormd en ontvlooid.`,
    shortDescription: "Een lieve poes op zoek naar een rustig en liefdevol thuis.",
    imageUrl: wixImg("12c6b4_645effbfddb34c6286c5cd160bad282d"),
    images: [
      `${WIX}/12c6b4_1cf90edddcc242b083dee422061fbc35~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_1cf90edddcc242b083dee422061fbc35~mv2.jpg`,
    ],
    status: "beschikbaar",
    isFeatured: true,
    intakeDate: "2024-09-15",
  },
  {
    name: "Dahlia",
    slug: "dahlia",
    species: "kat",
    breed: "Huiskat Korthaar",
    gender: "poes",
    dateOfBirth: "2025-06-01",
    isNeutered: true,
    description: `Hoi, ik ben Dahlia 🌸🐾
Ik ben als vondeling binnengekomen, maar laat dat je niet misleiden: ik ben een echte hartendief in wording. Waar ik vandaan kom weet niemand precies, maar ik ben helemaal klaar om mijn volgende hoofdstuk te beginnen — liefst bij jou thuis.

Ik ben een lief en sociaal katje. Nieuwe mensen? Die bekijk ik even nieuwsgierig… en voor je het weet sta ik al kopjes te geven. Ik hou van gezelschap en vind het heerlijk om bij je in de buurt te zijn.

En spelen? O ja! Geef mij een speelhengel en ik verander in een professionele jager. 🐯
Sprongen, salto's (bijna toch), geconcentreerde blik… ik neem mijn speelmomenten héél serieus. Daarna kom ik tevreden uitblazen en genieten van wat aaitjes. Ik ben dus de perfecte mix van knuffelkont en speelkameraad.

Ik ben steriel, gechipt, gevaccineerd, ontwormd en ontvlooid.`,
    shortDescription: "Een prachtige poes met een zacht karakter.",
    imageUrl: wixImg("12c6b4_4ad661738231484d951a64913fa39545"),
    images: [
      `${WIX}/12c6b4_d8db8430e77b437ba81b83a2a26f97db~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_d8db8430e77b437ba81b83a2a26f97db~mv2.jpg`,
    ],
    status: "beschikbaar",
    intakeDate: "2024-08-01",
  },
  {
    name: "Mina",
    slug: "mina",
    species: "kat",
    breed: "Huiskat Korthaar",
    gender: "poes",
    dateOfBirth: "2025-06-01",
    isNeutered: true,
    description: `Hoi, ik ben Mina 🐾
Ik ben als vondeling binnengekomen in de opvang. Waar ik precies vandaan kom? Dat blijft mijn mysterieuze achtergrondverhaal. Maar wat ik wél weet: ik ben klaar voor een warme thuisbasis waar ik voorgoed mag blijven.

Ik ben een lief en sociaal katje, alleen heb ik in het begin tijd nodig om te wennen. Nieuwe mensen, nieuwe geluiden, nieuwe geurtjes… ik bekijk het eerst even vanop veilige afstand. Gewoon, omdat ik graag zeker ben dat alles klopt.

Maar… zodra ik je vertrouw (en dat moment komt écht!), dan smelt ik. Dan kom ik graag bij je zitten en vraag ik om knuffels. En geloof me: mijn knuffels zijn het wachten meer dan waard. Ik ben geen kat die zich opdringt, maar eentje die je hart rustig verovert.

Voor mij zoek ik een rustig thuis zonder kleine kindjes. Ik hou van kalmte en voorspelbaarheid, zodat ik helemaal mezelf kan zijn en op mijn tempo kan openbloeien.

Ik ben steriel, gechipt, gevaccineerd, ontwormd en ontvlooid.`,
    shortDescription: "Een rustige, elegante poes die graag in de buurt van haar baasje is.",
    imageUrl: `${WIX}/12c6b4_778e9f0b59da45d3811ebd6a36649d26~mv2.jpg/v1/fill/w_800,h_1131,al_c,q_80,enc_auto/12c6b4_778e9f0b59da45d3811ebd6a36649d26~mv2.jpg`,
    images: [
      `${WIX}/12c6b4_889dcf8209874d03820f683a6451b548~mv2.jpg/v1/fill/w_800,h_566,al_c,q_80,enc_auto/12c6b4_889dcf8209874d03820f683a6451b548~mv2.jpg`,
    ],
    status: "beschikbaar",
    intakeDate: "2024-07-01",
  },
];

export const otherAnimalSeeds: NewAnimal[] = [
  {
    name: "Joske",
    slug: "joske",
    species: "ander",
    breed: "Konijn",
    gender: "mannetje",
    description:
      "Joske kwam in onze opvang terecht als vondeling. We zijn op zoek naar een nieuwe thuis voor hem waar ze kennis hebben van konijnen.",
    shortDescription: "Een lief konijntje dat op zoek is naar een nieuw thuis.",
    imageUrl: wixImg("12c6b4_bf89fa1f8c3249629b2948e416f46c6e"),
    status: "beschikbaar",
    intakeDate: "2023-01-01",
  },
  {
    name: "Theo",
    slug: "theo",
    species: "ander",
    breed: "Konijn",
    gender: "mannetje",
    description:
      "Theo kwam in onze opvang terecht als vondeling. We zijn op zoek naar een nieuwe thuis voor hem waar ze kennis hebben van konijnen.",
    shortDescription: "Een gezellig konijntje dat op zoek is naar een nieuw thuis.",
    imageUrl: wixImg("12c6b4_adc6c63de5144e0aa5d1abcb2f16d9a9"),
    status: "beschikbaar",
    isFeatured: true,
    intakeDate: "2023-06-01",
  },
];
