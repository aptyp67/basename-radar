import { create } from "zustand";
import type { CandidateFilters, NameKind } from "../types/basename";

export const LENGTH_OPTIONS = [3, 4, 5, 6, 7, 8, 9] as const;
export const DEFAULT_KINDS: NameKind[] = ["word", "palindrome"];

const DEFAULT_SELECTED_LENGTHS = [3, 4, 5];
const INITIAL_SELECTED_KINDS: NameKind[] = ["word"];
interface FiltersState extends CandidateFilters {
  toggleLength: (length: number) => void;
  setAnyLength: (enabled: boolean) => void;
  toggleKind: (kind: NameKind) => void;
  reset: () => void;
  isDefault: () => boolean;
}

function sortNumeric(values: Iterable<number>): number[] {
  return Array.from(values).sort((a, b) => a - b);
}

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  lengths: [...DEFAULT_SELECTED_LENGTHS],
  anyLength: false,
  kinds: [...INITIAL_SELECTED_KINDS],
  toggleLength: (length) =>
    set((state) => {
      if (state.anyLength) {
        return { anyLength: false, lengths: [length] };
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
      return { anyLength: false };
    }),
  toggleKind: (kind) =>
    set((state) => {
      if (state.kinds.length === 1 && state.kinds[0] === kind) {
        return state;
      }
      return { kinds: [kind] };
    }),
  reset: () =>
    set(() => ({
      lengths: [...DEFAULT_SELECTED_LENGTHS],
      anyLength: false,
      kinds: [...INITIAL_SELECTED_KINDS],
    })),
  isDefault: () => {
    const state = get();
    return (
      state.anyLength === false &&
      arraysEqual(state.lengths, DEFAULT_SELECTED_LENGTHS) &&
      arraysEqual(state.kinds, INITIAL_SELECTED_KINDS)
    );
  },
}));
