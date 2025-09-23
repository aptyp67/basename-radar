export type NameKind = "short" | "word" | "pattern";
export type Availability = "available" | "taken" | "unknown";

export interface BasenameCandidate {
  name: string;
  length: number;
  kind: NameKind[];
  score: number;
  availability: Availability;
  priceWei?: string;
  reasons: string[];
}

export interface CandidateFilters {
  lengthRange: [number, number];
  kinds: NameKind[];
  sort: "score" | "price" | "alpha";
}

export interface CandidatesResponse {
  items: BasenameCandidate[];
  nextCursor?: string;
}

export interface NameCheckResponse {
  availability: Availability;
  priceWei?: string;
}
