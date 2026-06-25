import type { DataItem } from "@/lib/sorting/dataSources";

export type SearchStep = {
  lo: number | null;
  hi: number | null;
  mid: number | null;
  current: number | null;
  discarded: Array<[number, number]>;
  found: number | null;
  comparisons: number;
  line: number;
  message: string;
  done: boolean;
};

export type SearchKind = "linear" | "binary";
export type MatchMode = "exact" | "partial";

function matches(label: string, target: string, mode: MatchMode) {
  const a = label.toLowerCase();
  const b = target.toLowerCase();
  return mode === "exact" ? a === b : a.includes(b);
}

export function linearSearch(
  items: DataItem[],
  target: string,
  mode: MatchMode,
): SearchStep[] {
  const steps: SearchStep[] = [];
  let comparisons = 0;
  steps.push({
    lo: null, hi: null, mid: null, current: null, discarded: [],
    found: null, comparisons, line: 0, done: false,
    message: `Iniciando busca linear por "${target}" (${mode === "exact" ? "exata" : "parcial"}).`,
  });
  for (let i = 0; i < items.length; i++) {
    steps.push({
      lo: null, hi: null, mid: null, current: i, discarded: [],
      found: null, comparisons, line: 1, done: false,
      message: `Verificando índice ${i}: "${items[i].label}".`,
    });
    comparisons++;
    const hit = matches(items[i].label, target, mode);
    steps.push({
      lo: null, hi: null, mid: null, current: i, discarded: [],
      found: hit ? i : null, comparisons, line: 2, done: hit,
      message: hit
        ? `Encontrado em ${i}: "${items[i].label}".`
        : `"${items[i].label}" não corresponde, segue.`,
    });
    if (hit) return steps;
  }
  steps.push({
    lo: null, hi: null, mid: null, current: null, discarded: [],
    found: null, comparisons, line: 4, done: true,
    message: `Fim da lista. "${target}" não encontrado.`,
  });
  return steps;
}

// Binary search assumes items already sorted alphabetically by label.
export function binarySearch(
  items: DataItem[],
  target: string,
  mode: MatchMode,
): SearchStep[] {
  const steps: SearchStep[] = [];
  let comparisons = 0;
  let lo = 0;
  let hi = items.length - 1;
  const discarded: Array<[number, number]> = [];
  const t = target.toLowerCase();

  steps.push({
    lo, hi, mid: null, current: null, discarded: [...discarded],
    found: null, comparisons, line: 0, done: false,
    message: `Iniciando busca binária por "${target}". Intervalo [${lo}, ${hi}].`,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      lo, hi, mid, current: null, discarded: [...discarded],
      found: null, comparisons, line: 1, done: false,
      message: `Calculando meio = ⌊(${lo}+${hi})/2⌋ = ${mid}.`,
    });
    comparisons++;
    const labelMid = items[mid].label.toLowerCase();
    const hit = mode === "exact" ? labelMid === t : labelMid.includes(t);
    if (hit) {
      steps.push({
        lo, hi, mid, current: mid, discarded: [...discarded],
        found: mid, comparisons, line: 2, done: true,
        message: `"${items[mid].label}" corresponde. Encontrado em ${mid}!`,
      });
      return steps;
    }
    if (labelMid < t) {
      steps.push({
        lo, hi, mid, current: null, discarded: [...discarded],
        found: null, comparisons, line: 3, done: false,
        message: `"${items[mid].label}" < "${target}". Descartando [${lo}, ${mid}].`,
      });
      discarded.push([lo, mid]);
      lo = mid + 1;
    } else {
      steps.push({
        lo, hi, mid, current: null, discarded: [...discarded],
        found: null, comparisons, line: 5, done: false,
        message: `"${items[mid].label}" > "${target}". Descartando [${mid}, ${hi}].`,
      });
      discarded.push([mid, hi]);
      hi = mid - 1;
    }
    steps.push({
      lo, hi, mid: null, current: null, discarded: [...discarded],
      found: null, comparisons, line: 7, done: false,
      message: lo <= hi
        ? `Novo intervalo [${lo}, ${hi}].`
        : `Intervalo vazio. Encerrando.`,
    });
  }

  steps.push({
    lo, hi, mid: null, current: null, discarded: [...discarded],
    found: null, comparisons, line: 8, done: true,
    message: `"${target}" não encontrado.`,
  });
  return steps;
}

export const SEARCH_PSEUDOCODE: Record<SearchKind, string[]> = {
  linear: [
    "para i ← 0 até n-1 faça",
    "    se A[i] = alvo então",
    "        retornar i",
    "fim para",
    "retornar -1  // não encontrado",
  ],
  binary: [
    "lo ← 0;  hi ← n-1",
    "enquanto lo ≤ hi faça",
    "    mid ← ⌊(lo + hi) / 2⌋",
    "    se A[mid] = alvo então retornar mid",
    "    senão se A[mid] < alvo então",
    "        lo ← mid + 1",
    "    senão",
    "        hi ← mid - 1",
    "retornar -1  // não encontrado",
  ],
};

// For the comparison chart — counts comparisons on synthetic datasets.
export function countComparisons(
  kind: SearchKind,
  items: DataItem[],
  target: string,
  mode: MatchMode,
): number {
  if (kind === "linear") {
    let c = 0;
    for (let i = 0; i < items.length; i++) {
      c++;
      if (matches(items[i].label, target, mode)) return c;
    }
    return c;
  } else {
    let c = 0;
    let lo = 0, hi = items.length - 1;
    const t = target.toLowerCase();
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      c++;
      const m = items[mid].label.toLowerCase();
      const hit = mode === "exact" ? m === t : m.includes(t);
      if (hit) return c;
      if (m < t) lo = mid + 1;
      else hi = mid - 1;
    }
    return c;
  }
}