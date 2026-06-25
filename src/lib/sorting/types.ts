export type SortAction =
  | { type: "compare"; indices: [number, number]; line: number; message: string }
  | { type: "swap"; indices: [number, number]; line: number; message: string }
  | { type: "overwrite"; index: number; value: number; line: number; message: string }
  | { type: "sorted"; indices: number[]; line: number; message: string }
  | { type: "pivot"; index: number; line: number; message: string }
  | { type: "heap"; size: number; line: number; message: string };

export type SortStep = {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot: number | null;
  heapSize: number | null;
  line: number;
  message: string;
  comparisons: number;
  swaps: number;
};

export type AlgoKey = "bubble" | "selection" | "insertion" | "merge" | "quick" | "heap";
