export type NameKind = "word" | "palindrome";
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
  lengths: number[];
  anyLength: boolean;
  kinds: NameKind[];
  sort: "score" | "alpha";
  sortDirection: "asc" | "desc";
}

export interface CandidatesResponse {
  items: BasenameCandidate[];
  nextCursor?: string;
}

export interface NameCheckResponse {
  availability: Availability;
  priceWei?: string;
}
