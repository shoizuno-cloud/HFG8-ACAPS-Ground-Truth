export type Honesty = {
  n: number;
  agreement: number;
  confidence_band: number[];
  coverage_gaps: string[];
  claims_corroborated: number;
  claims_total: number;
  panel_hit_rate: number | null;
  caveat: string;
};
export type Integrity = {
  pulse_id?: string;
  anchoring_shift: number;
  herding: string;
  collusion_pairs: number;
  recency: string;
  coverage_gaps: string[];
  used_round: number;
  evidence?: Record<string, string>;
};
export type Match = {
  risk_id: string;
  experts: {
    pseudonym: string;
    match: number;
    geo_tags: string[];
    theme_tags: string[];
  }[];
  composition: {
    max_per_affiliation: number;
    ok: boolean;
    geo_spread: string[];
    theme_cover: string[];
    gaps: string[];
  };
};
export type RadarStatus = {
  source: "csv" | "acaps-api";
  fetched_at: string;
  n_risks: number;
  live_available?: boolean;
};
export type Application = {
  geo_tags: string[];
  theme_tags: string[];
  affiliation_tag: string;
  languages: string[];
  channel: string;
};
export type Approval = {
  expert_id?: string;
  status: string;
  approved_by?: string[];
  approvals?: number;
  credential?: string;
};
