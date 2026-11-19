export const aetherRegions = [
  {
    key: "awakening",
    house: "koper",
    icon: "🌅",
    skillIcon: "🔥",
    en: {
      title: "The Awakening",
      subtitle: "Discover your strength",
      description:
        "A new world awakens. Take the first step, discover what you do well and choose who you want to become.",
      skill: "Courage",
      quest: {
        name: "The first brave step",
        desc: "Choose a small personal goal and take one concrete step toward it today.",
        submissionPrompt:
          "Describe the step you took and what you learned from it.",
        completionCriteria:
          "You took one action toward your goal and explained one thing it taught you.",
      },
    },
    nl: {
      title: "Het Ontwaken",
      subtitle: "Ontdek jouw kracht",
      description:
        "Een nieuwe wereld ontwaakt. Zet de eerste stap, leer je talent kennen en kies wie je wilt worden.",
      skill: "Moed",
      quest: {
        name: "De eerste dappere stap",
        desc: "Kies een klein groeidoel en zet vandaag één concrete stap om dichterbij te komen.",
        submissionPrompt:
          "Beschrijf welke stap je hebt gezet en wat je ervan hebt geleerd.",
        completionCriteria:
          "Je hebt één actie voor je doel uitgevoerd en vertelt wat je daarvan hebt geleerd.",
      },
    },
  },
  {
    key: "connected-isles",
    house: "riet",
    icon: "🏝️",
    skillIcon: "🤝",
    en: {
      title: "The Connected Isles",
      subtitle: "Find strength in working together",
      description:
        "Bridge the distance by asking for help and offering it in return. Working together opens new paths.",
      skill: "Collaboration",
      quest: {
        name: "Build a bridge",
        desc: "Help someone with a goal and ask how your help landed.",
        submissionPrompt:
          "Describe what you did to help and one thing you learned from their response.",
        completionCriteria:
          "You helped someone with their goal, asked for feedback and shared a takeaway.",
      },
    },
    nl: {
      title: "De Verbonden Eilanden",
      subtitle: "Kracht door samenwerking",
      description:
        "Overwin afstanden door hulp te geven en te vragen. Samenwerking opent nieuwe paden.",
      skill: "Samenwerking",
      quest: {
        name: "Bouw een brug",
        desc: "Help iemand met een doel en vraag hoe jouw hulp aankwam.",
        submissionPrompt:
          "Beschrijf hoe je hielp en wat je van de reactie hebt geleerd.",
        completionCriteria:
          "Je hebt iemand geholpen, om feedback gevraagd en één inzicht gedeeld.",
      },
    },
  },
  {
    key: "shadowwood",
    house: "keer",
    icon: "🌲",
    skillIcon: "🎯",
    en: {
      title: "The Shadowwood",
      subtitle: "Notice your patterns",
      description:
        "The shadows bring your doubts into view. Practise paying attention and finding your footing again when you get distracted.",
      skill: "Focus",
      quest: {
        name: "A light in the Shadowwood",
        desc: "Work on one task for 20 minutes without distractions.",
        submissionPrompt:
          "Share what helped you stay focused during those 20 minutes.",
        completionCriteria:
          "You spent 20 minutes on a task and identified one thing that helped you focus.",
      },
    },
    nl: {
      title: "Het Schaduwwoud",
      subtitle: "Durf je patronen te zien",
      description:
        "De schaduw maakt je twijfels zichtbaar. Oefen met aandacht, reflectie en het terugvinden van je focus.",
      skill: "Focus",
      quest: {
        name: "Licht in het Schaduwwoud",
        desc: "Werk 20 minuten aan één taak zonder afleiding.",
        submissionPrompt:
          "Vertel wat jou tijdens die 20 minuten hielp om gefocust te blijven.",
        completionCriteria:
          "Je hebt 20 minuten aan een taak gewerkt en noemt één ding dat hielp om je te concentreren.",
      },
    },
  },
  {
    key: "star-tower",
    house: "nacht",
    icon: "🌌",
    skillIcon: "🎨",
    en: {
      title: "The Star Tower",
      subtitle: "Strengthen the community",
      description:
        "Bring what you have learned back to the community and make something others can use.",
      skill: "Creativity",
      quest: {
        name: "Build something for the group",
        desc: "Think of one idea that could help the community and make a small first version.",
        submissionPrompt:
          "Share the first version or describe how it works and whom it helps.",
        completionCriteria:
          "You made a first version of an idea with a clear use for the group.",
      },
    },
    nl: {
      title: "De Sterrentoren",
      subtitle: "Versterk de gemeenschap",
      description:
        "Gebruik wat je hebt geleerd om iets te maken waar anderen in de wereld iets aan hebben.",
      skill: "Creativiteit",
      quest: {
        name: "Bouw iets voor de groep",
        desc: "Bedenk één idee dat de gemeenschap helpt en maak een kleine eerste versie.",
        submissionPrompt:
          "Deel je eerste versie of leg uit hoe die werkt en wie er iets aan heeft.",
        completionCriteria:
          "Je hebt een eerste versie gemaakt van iets waar de groep iets aan heeft.",
      },
    },
  },
];

export function getAetherRegion(key) {
  return aetherRegions.find((region) => region.key === key);
}
