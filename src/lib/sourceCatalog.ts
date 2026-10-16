export const sourceCatalog = [
  {
    name: "Federal Reserve press releases",
    connector: "RSS",
    url: "https://www.federalreserve.gov/",
    feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml",
    topics: ["economics", "policy"],
    region: "United States",
    language: "English",
    listedAt: "https://www.federalreserve.gov/feeds/feeds.htm",
  },
  {
    name: "UK Ministry of Defence",
    connector: "Atom",
    url: "https://www.gov.uk/government/organisations/ministry-of-defence",
    feedUrl:
      "https://www.gov.uk/government/organisations/ministry-of-defence.atom",
    topics: ["defence", "policy", "security"],
    region: "United Kingdom",
    language: "English",
    listedAt: "https://www.gov.uk/government/organisations/ministry-of-defence",
  },
];
export type CatalogSource = typeof sourceCatalog[number];
