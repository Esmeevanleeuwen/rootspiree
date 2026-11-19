export const houses = {
  nacht: {
    name: "Nachtglas",
    place: "De Sterrenkamer",
    icon: "compass",
    tint: "#333e64",
    soft: "#e9eaf4",
    gold: "#d9d9ee",
    verb: "Ontdekken",
    motto: "Wat zie jij dat de rest voorbijloopt?",
    trait: "Je zoekt aanwijzingen en legt verbanden.",
    ritual: "Leg het eerste spoor vast in het sterrenboek.",
    memento: "Een lens met een onvolledige sterrenkaart.",
  },
  koper: {
    name: "Kopervonk",
    place: "De Gloedwerkplaats",
    icon: "sun",
    tint: "#70402c",
    soft: "#f4e7d8",
    gold: "#f4cb93",
    verb: "Uitproberen",
    motto: "Wat zou er gebeuren als je het maakte?",
    trait: "Je probeert iets uit en leert van wat er gebeurt.",
    ritual: "Bewaar een eerste proef in de werkplaats.",
    memento: "Een glazen belletje dat pas klinkt als je het beweegt.",
  },
  riet: {
    name: "Rietkring",
    place: "De Drijftuin",
    icon: "fern",
    tint: "#295548",
    soft: "#e2ede2",
    gold: "#dae4af",
    verb: "Verbinden",
    motto: "Wiens stem ontbreekt er nog?",
    trait: "Je brengt mensen en hun verhalen bij elkaar.",
    ritual: "Knoop een nieuw lint aan de brug van de Drijftuin.",
    memento: "Een gevlochten koord met ruimte voor één extra draad.",
  },
  keer: {
    name: "Keerwater",
    place: "Het Getijdenhuis",
    icon: "tide",
    tint: "#254f63",
    soft: "#e0ecf0",
    gold: "#f4cea9",
    verb: "Afstemmen",
    motto: "Wanneer is het tijd om het roer om te gooien?",
    trait:
      "Je voelt aan wanneer iets moet bewegen en stemt de volgende stap daarop af.",
    ritual: "Zet een merkstreep op de peilschaal van het Getijdenhuis.",
    memento: "Een koperen peilschaal die de vorige vloed onthoudt.",
  },
};

export const scenes = [
  {
    title: "De aanlegsteiger",
    story:
      "Op een nacht trekt het water zo ver weg dat de oude haven weer zichtbaar wordt. Een schuitje tikt tegen de palen. Waar ga je als eerste op af?",
    opts: [
      ["riet", "De veervrouw. Ze houdt een tweede roeispaan klaar."],
      ["nacht", "De vreemde inkepingen op de onderkant van de steiger."],
      ["keer", "De waterlijn. Hoeveel tijd hebben we aan deze kant?"],
      ["koper", "Het kapotte lampje op de boeg. Misschien krijg ik het aan."],
    ],
  },
  {
    title: "Een plein zonder straatnamen",
    story:
      "Midden op het drooggevallen plein staat een fontein. Vier smalle straten lopen de mist in. Je mag één spoor achterlaten voor wie na je komt.",
    opts: [
      ["koper", "Ik bouw een kleine wegwijzer van aangespoeld hout."],
      ["keer", "Ik markeer de route die bij opkomend water begaanbaar blijft."],
      ["nacht", "Ik teken het patroon van de straten in het zand."],
      [
        "riet",
        "Ik laat een plek vrij waar iedereen zijn eigen aanwijzing kan achterlaten.",
      ],
    ],
  },
  {
    title: "Het eilandje met de bel",
    story:
      "Een bel klinkt vanaf een eilandje. Daarna is het stil. Je hebt nog één lamp met genoeg olie voor een uur. Wat doe je met het licht?",
    opts: [
      [
        "keer",
        "Ik laat het op vaste momenten knipperen, zodat we elkaar terugvinden.",
      ],
      ["riet", "Ik schijn naar de overkant en wacht op een teken terug."],
      [
        "koper",
        "Ik probeer met een fles de lichtbundel verder te laten reiken.",
      ],
      ["nacht", "Ik zoek de plek waar de klank weerkaatste."],
    ],
  },
  {
    title: "De tafel van de havenmeester",
    story:
      "In het lege havenhuis staat een tafel met vier onvoltooide werken. Je hebt tijd om aan één ervan verder te werken.",
    opts: [
      [
        "nacht",
        "Een kaart waarop twee straten op dezelfde plek lijken te liggen.",
      ],
      ["koper", "Een lantaarn met een lens die niemand nog passend kreeg."],
      ["riet", "Een lied waarvan elke bewoner één regel kende."],
      ["keer", "Een vaarschema dat alleen bij laagwater werkt."],
    ],
  },
  {
    title: "Wat gaat er mee terug?",
    story:
      "Bij het eerste ochtendlicht keert de zee terug. In je jaszak is ruimte voor één klein aandenken. Waar grijp je naar?",
    opts: [
      ["riet", "Een bandje waarin draden van alle veerlieden zijn verweven."],
      ["keer", "Een stukje kade met de oude hoogwaterstreep."],
      ["koper", "Het eerste stukje glas dat in de havenoven gelukte."],
      ["nacht", "Een scherf waarin een onbekend sterrenbeeld staat gekrast."],
    ],
  },
];

export const axes = [
  {
    key: "energy",
    title: "Waar begin je?",
    labels: ["In gesprek", "In stilte"],
    tips: [
      "Bespreek je eerste idee kort met iemand die je kiest.",
      "Neem eerst een minuut alleen om je gedachten te ordenen.",
    ],
    blend: "Kies vandaag tussen even sparren en een minuut voor jezelf.",
  },
  {
    key: "notice",
    title: "Wat helpt je kijken?",
    labels: ["Een voorbeeld", "Een mogelijkheid"],
    tips: [
      "Zoek één concreet voorbeeld van het gedrag dat je wilt oefenen.",
      "Bedenk twee mogelijke benaderingen en probeer degene die je nieuwsgierig maakt.",
    ],
    blend: "Begin met een voorbeeld en bedenk één andere mogelijkheid.",
  },
  {
    key: "decide",
    title: "Wat weeg je mee?",
    labels: ["Een vaste maatstaf", "Waarden en gevolgen"],
    tips: [
      "Toets de uitkomst aan het criterium dat je vooraf koos.",
      "Sta na afloop stil bij wat de uitkomst betekende voor jou of de ander.",
    ],
    blend: "Vergelijk je criterium met wat de uitkomst voor iemand betekende.",
  },
  {
    key: "pace",
    title: "Hoe vind je ritme?",
    labels: ["Vooraf afspreken", "Ruimte houden"],
    tips: [
      "Kies vooraf een moment en zet de eerste stap in je agenda.",
      "Kies een geschikt moment zodra het zich voordoet.",
    ],
    blend: "Kies een moment en houd ruimte om het te verplaatsen.",
  },
];

export const letters = [
  [
    0,
    "Een brief zonder afzender",
    "De nachtpost brengt een envelop uit een haven die nog gebouwd moet worden. Hoe begin je aan je antwoord?",
    "Ik denk hardop met de postbode en ontdek zo wat ik wil zeggen.",
    "Ik neem de brief even mee naar een stille tafel.",
    0,
  ],
  [
    1,
    "Een verloren straat",
    "De volgende brief beschrijft een straat die op geen kaart staat. Wat maakt je nieuwsgierig?",
    "De beschreven deurpost, de geur van zout en het aantal treden.",
    "De mogelijkheid dat al die details samen een tweede verhaal vormen.",
    0,
  ],
  [
    2,
    "Eén plek aan boord",
    "Twee brieven kunnen met de laatste boot mee, maar drie mensen wachten op antwoord. Wat helpt je kiezen?",
    "Ik kijk wie door het uitstel het meest geraakt wordt.",
    "Ik kies een regel die ik aan alle drie kan uitleggen en pas die gelijk toe.",
    1,
  ],
  [
    3,
    "Een dag in de postkamer",
    "Tot middernacht mag je de postkamer beheren. Hoe richt je je dienst in?",
    "Ik laat een deel van de avond open voor onverwachte post.",
    "Ik spreek een volgorde en de laatste vertrektijd af.",
    1,
  ],
  [
    0,
    "Na de laatste overtocht",
    "Na een lange vaart blijven de lampen in de kajuit branden. Waar krijg je weer zin om verder te gaan?",
    "Aan dek, waar ik in mijn eentje kan laten bezinken wat ik las.",
    "Aan de kajuittafel, waar we indrukken uitwisselen.",
    1,
  ],
  [
    1,
    "Inkt die vervaagt",
    "De volgende ochtend is een alinea verdwenen. Wat zoek je eerst?",
    "Welke andere betekenis het verhaal zonder die alinea kan hebben.",
    "De zichtbare inktsporen om de ontbrekende woorden te reconstrueren.",
    1,
  ],
  [
    2,
    "Een adreswijziging",
    "Een bewoner wil voortaan onder een andere naam post ontvangen. Er zijn twee werkbare routes. Wat geeft voor jou de doorslag?",
    "Welke route bij een volgende wijziging even goed zou werken.",
    "Welke route het beste past bij wat deze naam voor de bewoner betekent.",
    0,
  ],
  [
    3,
    "De terugreis",
    "Je krijgt een leeg postboek mee voor de komende week. Wat schrijf je op de eerste bladzijde?",
    "De bezorgmomenten waar ik op wil kunnen rekenen.",
    "De eerste bestemming. De rest vul ik onderweg in.",
    0,
  ],
];

export const goalKinds = {
  voice: {
    label: "Me uitspreken",
    title: "Laat je stem één keer horen",
    step: "Breng één eigen idee of vraag in.",
    example:
      "In ons teamoverleg wil ik mijn idee delen vóór het onderwerp wisselt.",
  },
  listen: {
    label: "Beter luisteren",
    title: "Geef iemands woorden terug",
    step: "Vat in één zin samen wat iemand vertelde en check of je diegene begreep.",
    example: "Ik wil in een gesprek met een vriend minder snel advies geven.",
  },
  bounds: {
    label: "Een grens aangeven",
    title: "Oefen één duidelijke zin",
    step: "Spreek je grens in één zin uit op een moment dat jij kiest.",
    example:
      "Ik wil bij het verdelen van taken zeggen wanneer mijn week vol zit.",
  },
  finish: {
    label: "Iets afronden",
    title: "Rond één klein onderdeel af",
    step: "Maak één afgebakend onderdeel af en markeer wat klaar is.",
    example: "Ik wil mijn eerste schets afronden voordat ik een nieuwe begin.",
  },
  own: {
    label: "Mijn eigen richting",
    title: "Zet je eigen eerste stap",
    step: "Voer de kleine actie uit die je voor dit doel hebt gekozen.",
    example: "Ik wil weer plezier krijgen in tekenen.",
  },
};

export const traits = [
  {
    letters: "EI",
    labels: ["Extravert", "Introvert"],
    title: "Waar krijg je energie van?",
    notes: [
      "Samen bezig zijn geeft je energie.",
      "Tijd voor jezelf geeft je energie.",
    ],
  },
  {
    letters: "SN",
    labels: ["Concreet", "Intuïtief"],
    title: "Hoe neem je informatie op?",
    notes: [
      "Je begint graag met een concreet voorbeeld.",
      "Je zoekt graag naar verbanden en mogelijkheden.",
    ],
  },
  {
    letters: "TF",
    labels: ["Analytisch", "Waardegericht"],
    title: "Hoe maak je een afweging?",
    notes: [
      "Je weegt opties graag af met duidelijke criteria.",
      "Je weegt graag mee wat een keuze voor mensen betekent.",
    ],
  },
  {
    letters: "JP",
    labels: ["Planmatig", "Flexibel"],
    title: "Hoe pak je iets aan?",
    notes: [
      "Je maakt graag vooraf een plan.",
      "Je houdt graag ruimte om onderweg te kiezen.",
    ],
  },
];

export const statements = [
  ["E", "Na een middag alleen zoek ik graag gezelschap op."],
  ["S", "Als ik iets nieuws leer, wil ik eerst een uitgewerkt voorbeeld zien."],
  [
    "F",
    "Bij een lastige keuze vraag ik eerst wat de uitkomst betekent voor de betrokken mensen.",
  ],
  ["P", "Ik begin graag aan een vrije middag zonder te weten waar ik uitkom."],
  ["I", "Na een drukke dag met anderen laad ik graag in mijn eentje op."],
  [
    "N",
    "Als ik iets nieuws hoor, denk ik al snel aan wat er nog meer mogelijk is.",
  ],
  [
    "T",
    "Als twee voorstellen aantrekkelijk zijn, vergelijk ik ze eerst op dezelfde criteria.",
  ],
  [
    "J",
    "Bij een nieuwe opdracht bedenk ik graag vooraf in welke volgorde ik werk.",
  ],
  ["E", "Een idee krijgt voor mij vorm terwijl ik er met iemand over praat."],
  [
    "N",
    "Tijdens het lezen vallen mij vaak verbanden tussen verschillende verhalen op.",
  ],
  [
    "F",
    "Bij een meningsverschil weegt voor mij zwaar wat ieder persoonlijk belangrijk vindt.",
  ],
  ["J", "Ik spreek graag vandaag al af wanneer we de volgende stap zetten."],
  ["I", "In een groep denk ik graag eerst in stilte na over mijn antwoord."],
  [
    "S",
    "Bij het navertellen van een gebeurtenis begin ik vaak met wat ik precies zag of hoorde.",
  ],
  [
    "T",
    "Bij een moeilijke beslissing zoek ik eerst naar een redenering die ik stap voor stap kan uitleggen.",
  ],
  [
    "P",
    "Als ik aan iets werk, laat ik de volgorde graag afhangen van wat ik onderweg ontdek.",
  ],
];

export const agreement = [
  "Helemaal oneens",
  "Oneens",
  "Een beetje oneens",
  "Neutraal",
  "Een beetje eens",
  "Eens",
  "Helemaal eens",
];
