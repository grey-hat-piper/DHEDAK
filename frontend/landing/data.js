// Sourced example data for the landing globe. Source: the DHEDAK briefing, citing the IDF Diabetes
// Atlas 11th edition (2024 modelled estimates, adults aged 20-79). Replaced by approved database
// records once Management and the indicators API exist. lngLat is an approximate country centre,
// used only to place markers.
export const SOURCE = {
  name: "IDF Diabetes Atlas, 11th edition",
  year: 2024,
  population: "Adults aged 20–79",
  caveat:
    "Modelled estimates, not clinic registrations or confirmed case counts. National level only; no district-level claims.",
};

export const COUNTRIES = [
  { code: "GHA", name: "Ghana", lngLat: [-1.0, 7.9], adults: 317400, prevalence: 2.7, undiagnosed: 78.7 },
  { code: "CMR", name: "Cameroon", lngLat: [12.4, 5.7], adults: 774200, prevalence: 6.9, undiagnosed: 73.1 },
  { code: "UGA", name: "Uganda", lngLat: [32.3, 1.4], adults: 369100, prevalence: 2.2, undiagnosed: 61.2 },
];

export const METRICS = {
  adults: { label: "Estimated adults with diabetes", short: "Adults", fmt: (v) => v.toLocaleString("en-GB") },
  prevalence: { label: "Age-standardised prevalence", short: "Prevalence", fmt: (v) => `${v}%` },
  undiagnosed: { label: "Estimated undiagnosed share", short: "Undiagnosed", fmt: (v) => `${v}%` },
};
