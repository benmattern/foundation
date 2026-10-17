export type CatalogSource = {
  id: string;
  name: string;
  connector: string;
  url: string;
  feedUrl: string;
  topics: string[];
  region: string;
  language: string;
  listedAt: string;
  packs: string[];
  verifiedOn: string;
  limits: string;
  perspective: string;
  fields: string[];
  check: string;
  use: string;
};
export const sourcePacks = [
  "Taiwan / Indo-Pacific",
  "Semiconductors / supply chain",
  "Economic policy",
];
const verifiedOn = "2026-10-17"; // UTC; local implementation session began October 16.
const use =
  "Public access, no account/payment. No feed-specific numeric polling limit found in the inspected listing; reuse the existing five-minute scheduler/backoff. Original material remains subject to publisher terms; do not bulk republish.";
export const sourceCatalog: CatalogSource[] = [
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
].map((s, i) => ({
  ...s,
  id: i === 0 ? "us-fed-press" : "uk-mod",
  packs: i === 0 ? [sourcePacks[2]] : [sourcePacks[0]],
  verifiedOn,
  use,
  limits:
    i === 0
      ? "Broad monetary/regulatory releases; not Taiwan-specific."
      : "Broad UK defence releases; regional relevance varies.",
  perspective:
    i === 0
      ? "US central-bank institutional position"
      : "UK government defence position",
  fields: ["title", "date", "excerpt", "link"],
  check:
    "Publisher listing + HTTP 200 + application parser: 20 items, 20 dated, 20 descriptions.",
}));
sourceCatalog.push(
  {
    id: "tw-mofa-news",
    name: "Taiwan Ministry of Foreign Affairs",
    url: "https://en.mofa.gov.tw/",
    feedUrl: "https://en.mofa.gov.tw/OpenData.aspx?SN=07564A7F01D47BAD",
    connector: "RSS",
    topics: ["diplomacy", "security"],
    region: "Taiwan / Indo-Pacific",
    language: "English",
    listedAt: "https://en.mofa.gov.tw/News.aspx?n=1eaddcfd4c6ec567&sms=",
    packs: [sourcePacks[0]],
    verifiedOn,
    use,
    limits:
      "Government statements and responses, not independent reporting; first 50 items only.",
    perspective: "Taiwan foreign-policy institutional position",
    fields: ["title", "date", "excerpt", "link"],
    check:
      "Publisher Open data RSS link; HTTP 200; 150146 bytes; 50/50 items dated/described.",
  },
  {
    id: "tw-mof-news",
    name: "Taiwan Ministry of Finance",
    url: "https://www.mof.gov.tw/eng/",
    feedUrl: "https://www.mof.gov.tw/eng/Rss/f48d641f159a4866b1d31c0916fbcc71",
    connector: "RSS",
    topics: ["trade", "tax", "economics"],
    region: "Taiwan",
    language: "English",
    listedAt: "https://www.mof.gov.tw/eng/Rss",
    packs: [sourcePacks[0], sourcePacks[1], sourcePacks[2]],
    verifiedOn,
    use,
    limits:
      "Broad fiscal/trade releases, not a chip-industry feed. 844257 bytes, close to 1 MiB cap; only first 50 of 330 items parsed. Future growth may exceed cap.",
    perspective: "Taiwan fiscal/trade agency position",
    fields: ["title", "date", "excerpt", "link"],
    check:
      "Publisher RSS listing link; HTTP 200; first 50 items dated/described; truncation warning retained.",
  },
  {
    id: "eu-ecb-press",
    name: "European Central Bank",
    url: "https://www.ecb.europa.eu/",
    feedUrl: "https://www.ecb.europa.eu/rss/press.html",
    connector: "RSS",
    topics: ["economics", "monetary policy"],
    region: "Euro area",
    language: "English",
    listedAt: "https://www.ecb.europa.eu/home/html/rss.en.html",
    packs: [sourcePacks[2]],
    verifiedOn,
    use,
    limits:
      "Broad European macroeconomic context. Titles, links and dates only in current response; no descriptions. Missing text must remain unknown.",
    perspective: "Euro-area central-bank institutional position",
    fields: ["title", "date", "link"],
    check:
      "Publisher press RSS listing; HTTP 200; 5752 bytes; 15 dated items; zero descriptions.",
  },
  ...[
    [
      "tw-cbc",
      "Central Bank of the Republic of China (Taiwan)",
      "https://www.cbc.gov.tw/en/lp-448-2.html",
      ["economics", "monetary policy"],
      "Taiwan",
      [sourcePacks[0], sourcePacks[2]],
      "Taiwan monetary-authority position",
      "Official press-release page inspected; no supported endpoint verified.",
    ],
    [
      "tw-tsmc",
      "Taiwan Semiconductor Manufacturing Company",
      "https://investor.tsmc.com/english/quarterly-results",
      ["semiconductors", "company disclosures"],
      "Taiwan / global",
      [sourcePacks[0], sourcePacks[1]],
      "Company investor disclosure; selective corporate perspective",
      "Official quarterly results and press archive inspected. Manual capture only; no RSS/API verified.",
    ],
    [
      "tw-umc",
      "United Microelectronics Corporation",
      "https://www.umc.com/en/News/press_release",
      ["semiconductors", "company disclosures"],
      "Taiwan / global",
      [sourcePacks[0], sourcePacks[1]],
      "Company corporate/investor perspective",
      "Official press-release listing inspected. Manual capture only; no RSS/API verified.",
    ],
    [
      "jp-meti",
      "Japan Ministry of Economy, Trade and Industry",
      "https://www.meti.go.jp/english/rss/index.html",
      ["trade", "industry", "supply chain"],
      "Japan / Indo-Pacific",
      [sourcePacks[0], sourcePacks[1], sourcePacks[2]],
      "Japan industrial-policy institutional position",
      "Official RSS documentation found; live listing HTTP 403. No collection endpoint promoted or block bypass attempted.",
    ],
    [
      "us-bis",
      "US Bureau of Industry and Security",
      "https://media.bis.gov/news-updates/all-press-releases",
      ["export controls", "semiconductors", "trade"],
      "United States / global",
      [sourcePacks[1], sourcePacks[2]],
      "US export-control agency position",
      "Official releases/listing inspected. Manual capture only; no supported RSS/API verified.",
    ],
  ].map(
    ([id, name, url, topics, region, packs, perspective, check]) =>
      ({
        id,
        name,
        url,
        topics,
        region,
        packs,
        perspective,
        check,
        connector: "Manual",
        feedUrl: "",
        language: "English",
        listedAt: url,
        verifiedOn,
        use: "Public official website; original documents may have separate terms. No automatic collection configured; use explicit link capture.",
        fields: ["manual capture"],
        limits:
          id === "jp-meti"
            ? "Listing currently blocked (403). Manual-only until a supported endpoint can be verified."
            : "Manual-only. No claim that this publisher has no feed; none is verified for this release.",
      }) as CatalogSource,
  ),
);
export const verificationStale = (date: string, now = Date.now()) =>
  now - new Date(date + "T00:00:00Z").getTime() > 90 * 86400000;
sourceCatalog.find((s) => s.id === "eu-ecb-press")!.use +=
  " ECB reuse terms require accurate reproduction, attribution and disclosure of modifications; authored papers have separate permissions. See https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html";
sourceCatalog.find((s) => s.id === "uk-mod")!.use +=
  " GOV.UK reuse is subject to the Open Government Licence; rate limiting may apply to excessive requests. See https://www.gov.uk/help/reuse-govuk-content";
