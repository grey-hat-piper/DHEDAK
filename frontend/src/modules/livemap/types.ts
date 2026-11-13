export interface ServiceRef { slug: string; name: string }

// Mirrors PublicFacilitySerializer on the backend (explicit allow-list of public fields).
export interface Facility {
  id: number;
  name: string;
  facility_type: string;
  facility_type_label: string;
  country: string;
  region: string | null;
  district: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website: string;
  operating_hours: string;
  services: ServiceRef[];
  data_source: string;
  last_verified: string | null;
}

export interface Paginated<T> { count: number; next: string | null; previous: string | null; results: T[] }
export interface NamedItem { id: number; name: string }

export interface Meta {
  facility_types: { value: string; label: string }[];
  services: ServiceRef[];
  countries: { code: string; name: string }[];
}

export interface GeoFeature {
  type: "Feature";
  id: number;
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: { id: number; name: string; facility_type: string; services: string[] };
}
export interface GeoCollection { type: "FeatureCollection"; features: GeoFeature[]; truncated: boolean }
