import { create } from "zustand";
import type { CandidateFilters, NameKind } from "../types/basename";

export const DEFAULT_LENGTH_RANGE: [number, number] = [3, 4];
export const DEFAULT_KINDS: NameKind[] = ["short", "word", "pattern"];
const INITIAL_SELECTED_KINDS: NameKind[] = ["short"];

interface FiltersState extends CandidateFilters {
  setLengthRange: (range: [number, number]) => void;
  toggleKind: (kind: NameKind) => void;
  setSort: (sort: CandidateFilters["sort"]) => void;
  reset: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  lengthRange: [...DEFAULT_LENGTH_RANGE] as [number, number],
  kinds: [...INITIAL_SELECTED_KINDS],
  sort: "score",
  setLengthRange: (range) =>
    set(() => {
      const nextRange: [number, number] = [
        Math.min(range[0], range[1]),
        Math.max(range[0], range[1]),
      ];
      return { lengthRange: nextRange };
    }),
  toggleKind: (kind) =>
    set((state) => {
      if (kind === "pattern") {
        return state;
      }
      const kinds = new Set(state.kinds);
      if (kinds.has(kind)) {
        kinds.delete(kind);
      } else {
        kinds.add(kind);
      }
      const nextKinds = Array.from(kinds);
      return { kinds: nextKinds.length > 0 ? nextKinds : [...INITIAL_SELECTED_KINDS] };
    }),
  setSort: (sort) => set(() => ({ sort })),
  reset: () =>
    set(() => ({
      lengthRange: [...DEFAULT_LENGTH_RANGE] as [number, number],
      kinds: [...INITIAL_SELECTED_KINDS],
      sort: "score",
    })),
}));
