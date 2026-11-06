export const checkedOn = "6 November 2026";
const base = "https://www.acaps.org/en/";
export const countryProfiles = [
  { iso: "AFG", name: "Afghanistan", slug: "afghanistan" },
  { iso: "TCD", name: "Chad", slug: "chad" },
  { iso: "COL", name: "Colombia", slug: "colombia" },
  { iso: "HTI", name: "Haiti", slug: "haiti" },
  { iso: "SYR", name: "Syria", slug: "syria" },
  { iso: "UKR", name: "Ukraine", slug: "ukraine" },
  { iso: "YEM", name: "Yemen", slug: "yemen" },
].map((c) => ({ ...c, url: `${base}countries/${c.slug}` }));
export const publications = [
  {
    country: "Afghanistan",
    iso: "AFG",
    date: "2026-10-28",
    title: "Community perspectives on early flood warning and preparedness",
    theme: "Natural hazards",
    slug: "afghanistan-community-perspectives-on-early-flood-warning-and-preparedness",
  },
  {
    country: "Ukraine",
    iso: "UKR",
    date: "2026-10-15",
    title: "May–August 2026 humanitarian access update",
    theme: "Humanitarian access",
    slug: "ukraine-may-august-2026-humanitarian-access-update",
  },
  {
    country: "Democratic Republic of the Congo",
    iso: "COD",
    date: "2026-10-13",
    title: "Mpox outbreak affecting Kasaï province",
    theme: "Health",
    slug: "drc-mpox-outbreak-affecting-kasai-province",
  },
  {
    country: "Colombia",
    iso: "COL",
    date: "2026-09-25",
    title: "Earthquake’s expected humanitarian impacts",
    theme: "Natural hazards",
    slug: "colombia-earthquakes-expected-humanitarian-impacts",
  },
].map((p) => ({ ...p, url: `${base}countries/archives/detail/${p.slug}` }));
export const resources = [
  {
    title: "Humanitarian access",
    kind: "Thematic analysis",
    text: "Explore access constraints and the official global overview.",
    url: `${base}thematics/all-topics/humanitarian-access-overview`,
  },
  {
    title: "Climate and environment",
    kind: "Thematic analysis",
    text: "Explore ACAPS analysis of climate and environmental pressures.",
    url: `${base}thematics/all-topics/climate-and-environment-analysis`,
  },
  {
    title: "Conflict in the Middle East",
    kind: "Thematic analysis",
    text: "Find regional analysis and context on the official topic page.",
    url: `${base}thematics/all-topics/conflict-in-the-middle-east`,
  },
  {
    title: "US funding freeze",
    kind: "Thematic analysis",
    text: "Explore analysis of humanitarian funding changes.",
    url: `${base}us-funding-freeze`,
  },
  {
    title: "INFORM Severity Index",
    kind: "Data & methodology",
    text: "Open official datasets and methodology. Crisis severity and future risk are different measures.",
    url: `${base}thematics/all-topics/inform-severity-index`,
  },
  {
    title: "ACAPS API",
    kind: "Data & methodology",
    text: "Access the official data service. Account and authentication requirements are managed by ACAPS.",
    url: "https://api.acaps.org",
  },
  {
    title: "ACAPS newsletter",
    kind: "Stay informed",
    text: "Subscribe through ACAPS for updates and analysis.",
    url: `${base}newsletter`,
  },
];
