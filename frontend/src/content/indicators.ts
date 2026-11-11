// Static, sourced example data for the landing preview (PRD 6.4). Source: the DHEDAK briefing,
// citing IDF Diabetes Atlas 11th edition. This is replaced by approved database records once
// Management and the indicators API exist.
export interface DiabetesRow {
  country: string;
  adults: number;
  prevalence: number; // age-standardised, %
  undiagnosed: number; // %
}

export const diabetesIndicator = {
  name: "Estimated adults living with diabetes",
  source: "International Diabetes Federation (IDF), Diabetes Atlas 11th edition",
  referenceYear: 2024,
  scope: "National estimates for Ghana, Cameroon and Uganda",
  population: "Adults aged 20–79",
  definition: "Modelled estimates of adults living with diabetes, with an estimated share who are undiagnosed.",
  limitations:
    "These are modelled estimates, not clinic registrations or confirmed case counts. They are not district-level figures.",
  rows: [
    { country: "Ghana", adults: 317_400, prevalence: 2.7, undiagnosed: 78.7 },
    { country: "Cameroon", adults: 774_200, prevalence: 6.9, undiagnosed: 73.1 },
    { country: "Uganda", adults: 369_100, prevalence: 2.2, undiagnosed: 61.2 },
  ] as DiabetesRow[],
};
