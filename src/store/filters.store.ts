import { create } from "zustand";
import type { CandidateFilters, NameKind } from "../types/basename";

export const LENGTH_OPTIONS = [3, 4, 5] as const;
export const DEFAULT_KINDS: NameKind[] = ["word", "palindrome"];

const DEFAULT_SELECTED_LENGTHS = [3, 4];
const INITIAL_SELECTED_KINDS: NameKind[] = ["word"];
const DEFAULT_SORT_DIRECTION: CandidateFilters["sortDirection"] = "asc";

interface FiltersState extends CandidateFilters {
  toggleLength: (length: number) => void;
  setAnyLength: (enabled: boolean) => void;
  toggleKind: (kind: NameKind) => void;
  setSort: (sort: CandidateFilters["sort"]) => void;
  toggleSortDirection: () => void;
  reset: () => void;
}

function sortNumeric(values: Iterable<number>): number[] {
  return Array.from(values).sort((a, b) => a - b);
}

export const useFiltersStore = create<FiltersState>((set) => ({
  lengths: [...DEFAULT_SELECTED_LENGTHS],
  anyLength: false,
  kinds: [...INITIAL_SELECTED_KINDS],
  sort: "score",
  sortDirection: DEFAULT_SORT_DIRECTION,
  toggleLength: (length) =>
    set((state) => {
      if (state.anyLength) {
        const nextLengths = new Set(DEFAULT_SELECTED_LENGTHS);
        if (!nextLengths.has(length)) {
          nextLengths.add(length);
        }
        return { anyLength: false, lengths: sortNumeric(nextLengths) };
      }

      const next = new Set(state.lengths);
      if (next.has(length)) {
        if (next.size === 1) {
          return state;
        }
        next.delete(length);
      } else {
        next.add(length);
      }
      return { lengths: sortNumeric(next) };
    }),
  setAnyLength: (enabled) =>
    set((state) => {
      if (enabled) {
        return { anyLength: true };
      }
      if (!state.anyLength) {
        return state;
      }
      return { anyLength: false, lengths: [...DEFAULT_SELECTED_LENGTHS] };
    }),
  toggleKind: (kind) =>
    set((state) => {
      if (state.kinds.length === 1 && state.kinds[0] === kind) {
        return state;
      }
      return { kinds: [kind] };
    }),
  setSort: (sort) =>
    set((state) => {
      if (state.sort === sort) {
        return { sort };
      }
      return {
        sort,
        sortDirection: DEFAULT_SORT_DIRECTION,
      };
    }),
  toggleSortDirection: () =>
    set((state) => ({ sortDirection: state.sortDirection === "asc" ? "desc" : "asc" })),
  reset: () =>
    set(() => ({
      lengths: [...DEFAULT_SELECTED_LENGTHS],
      anyLength: false,
      kinds: [...INITIAL_SELECTED_KINDS],
      sort: "score",
      sortDirection: DEFAULT_SORT_DIRECTION,
    })),
}));
