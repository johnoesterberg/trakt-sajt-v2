// ALLA texter på sidan finns här. Ändra fritt – inget annat behöver röras.
// Priser, e-post och Instagram är exempel som du byter senare.

export const content = {
  hero: {
    brand: "TRAKT",
    tagline: "Dofter från Sverige",
    scrollHint: "Skrolla",
    product: "Sarek",
    notes: "Fjäll. Kall luft. Lav. Sten.",
    closing: "Doften av ett landskap.",
  },

  story: {
    heading: "Dofter från platser som formar oss",
    text1:
      "Alla kommer från någonstans. En skog, en klippa vid havet, ett fjäll, en åker i juli. Trakt gör dofter av de platserna, för att ha med sig hemma eller ge bort till någon som hör hemma där.",
    text2:
      "Varje doft i serien bygger på ett svenskt landskap. Inte en vykortsbild, utan känslan av att vara där: luften, marken och ljuset.",
    tagline: "Natur · Människor · Platser",
  },

  scents: {
    heading: "Fyra landskap",
    items: [
      { id: "granskog", name: "Granskog", color: "#46614b", text: "Mörk, sval och lugn. Doften av en skog: granbarr, enbär, ceder och mossa." },
      { id: "bohuslan", name: "Bohuslän", color: "#ece4d3", text: "Salt och ljus. Doften av klippor, tång och hav en sen sommarkväll." },
      { id: "sarek", name: "Sarek", color: "#a6b4b8", text: "Klar och kall. Doften av fjällluft, lav och sten, långt från allt." },
      { id: "aker", name: "Åker", color: "#ede5d2", text: "Varm och mjuk. Doften av vete, hö och jord en sommardag." },
    ],
  },

  products: {
    heading: "Tre sätt att ta med sig en plats",
    items: [
      { id: "parfym", name: "Parfym", text: "Eau de parfum, för dig.", detail: "50 ml · 695 kr (exempelpris)" },
      { id: "doftljus", name: "Doftljus", text: "För hemmet, kväll efter kväll.", detail: "220 g · 349 kr (exempelpris)" },
      { id: "rumsspray", name: "Rumsspray", text: "Ett ögonblick av landskap, när du vill.", detail: "100 ml · 249 kr (exempelpris)" },
    ],
    note: "Preliminära produkter. Förändringar kan ske.",
  },

  waitlist: {
    heading: "Bli först att få ett landskap",
    text: "Vi är i början. Lämna din e-post så hör vi av oss när de första dofterna är klara. Ingen betalning och inget köp.",
    nameLabel: "Namn",
    emailLabel: "E-post",
    scentLabel: "Vilken doft vill du ha först?",
    scentOptions: ["Granskog", "Bohuslän", "Sarek", "Åker"],
    button: "Anmäl mig",
    thanks: "Tack! Vi hör av oss.",
  },

  footer: {
    line1: "Trakt · Dofter från Sverige",
    line2: "Natur · Människor · Platser",
    contact: "hej@trakt-exempel.se · @trakt.exempel (exempeluppgifter)",
  },
};
