import type { SortStep, AlgoKey } from "./types";

type Recorder = {
  arr: number[];
  steps: SortStep[];
  sorted: Set<number>;
  comparisons: number;
  swaps: number;
  heapSize: number | null;
  pivot: number | null;
  record: (partial: Partial<SortStep> & { line: number; message: string }) => void;
  compare: (i: number, j: number, line: number, msg: string) => void;
  swap: (i: number, j: number, line: number, msg: string) => void;
  overwrite: (i: number, v: number, line: number, msg: string) => void;
  markSorted: (i: number, line: number, msg: string) => void;
};

function makeRecorder(initial: number[]): Recorder {
  const r: Recorder = {
    arr: [...initial],
    steps: [],
    sorted: new Set<number>(),
    comparisons: 0,
    swaps: 0,
    heapSize: null,
    pivot: null,
    record(partial) {
      r.steps.push({
        array: [...r.arr],
        comparing: [],
        swapping: [],
        sorted: [...r.sorted],
        pivot: r.pivot,
        heapSize: r.heapSize,
        comparisons: r.comparisons,
        swaps: r.swaps,
        ...partial,
      });
    },
    compare(i, j, line, msg) {
      r.comparisons++;
      r.record({ comparing: [i, j], line, message: msg });
    },
    swap(i, j, line, msg) {
      r.swaps++;
      [r.arr[i], r.arr[j]] = [r.arr[j], r.arr[i]];
      r.record({ swapping: [i, j], line, message: msg });
    },
    overwrite(i, v, line, msg) {
      r.arr[i] = v;
      r.record({ swapping: [i], line, message: msg });
    },
    markSorted(i, line, msg) {
      r.sorted.add(i);
      r.record({ line, message: msg });
    },
  };
  return r;
}

function bubble(input: number[]): SortStep[] {
  const r = makeRecorder(input);
  r.record({ line: 0, message: "Iniciando Bubble Sort" });
  const n = r.arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      r.compare(j, j + 1, 3, `Comparando índice ${j} (${r.arr[j]}) com ${j + 1} (${r.arr[j + 1]})`);
      if (r.arr[j] > r.arr[j + 1]) {
        r.swap(j, j + 1, 4, `Trocando ${r.arr[j + 1]} ↔ ${r.arr[j]} (depois da troca)`);
        swapped = true;
      }
    }
    r.markSorted(n - 1 - i, 6, `Posição ${n - 1 - i} ordenada`);
    if (!swapped) {
      for (let k = 0; k < n - 1 - i; k++) r.sorted.add(k);
      r.record({ line: 7, message: "Sem trocas, array ordenado" });
      break;
    }
  }
  for (let k = 0; k < n; k++) r.sorted.add(k);
  r.record({ line: 8, message: "Bubble Sort concluído" });
  return r.steps;
}

function selection(input: number[]): SortStep[] {
  const r = makeRecorder(input);
  r.record({ line: 0, message: "Iniciando Selection Sort" });
  const n = r.arr.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    r.record({ line: 2, message: `Assumindo mínimo no índice ${i} (${r.arr[i]})` });
    for (let j = i + 1; j < n; j++) {
      r.compare(min, j, 4, `Comparando mínimo ${r.arr[min]} com ${r.arr[j]}`);
      if (r.arr[j] < r.arr[min]) {
        min = j;
        r.record({ line: 5, message: `Novo mínimo no índice ${j} (${r.arr[j]})` });
      }
    }
    if (min !== i) r.swap(i, min, 7, `Trocando ${r.arr[i]} ↔ ${r.arr[min]}`);
    r.markSorted(i, 8, `Posição ${i} ordenada`);
  }
  r.sorted.add(n - 1);
  r.record({ line: 9, message: "Selection Sort concluído" });
  return r.steps;
}

function insertion(input: number[]): SortStep[] {
  const r = makeRecorder(input);
  r.record({ line: 0, message: "Iniciando Insertion Sort" });
  r.sorted.add(0);
  const n = r.arr.length;
  for (let i = 1; i < n; i++) {
    const key = r.arr[i];
    let j = i - 1;
    r.record({ line: 2, message: `Inserindo ${key} na parte ordenada` });
    while (j >= 0) {
      r.compare(j, i, 4, `Comparando ${r.arr[j]} com chave ${key}`);
      if (r.arr[j] > key) {
        r.overwrite(j + 1, r.arr[j], 5, `Deslocando ${r.arr[j]} para a direita`);
        j--;
      } else break;
    }
    r.overwrite(j + 1, key, 7, `Inserindo chave ${key} no índice ${j + 1}`);
    r.sorted.add(i);
  }
  r.record({ line: 9, message: "Insertion Sort concluído" });
  return r.steps;
}

function merge(input: number[]): SortStep[] {
  const r = makeRecorder(input);
  r.record({ line: 0, message: "Iniciando Merge Sort" });
  const sort = (l: number, ri: number) => {
    if (l >= ri) return;
    const m = Math.floor((l + ri) / 2);
    r.record({ line: 2, message: `Dividindo [${l}..${ri}] no meio ${m}` });
    sort(l, m);
    sort(m + 1, ri);
    mergeRange(l, m, ri);
  };
  const mergeRange = (l: number, m: number, ri: number) => {
    const left = r.arr.slice(l, m + 1);
    const right = r.arr.slice(m + 1, ri + 1);
    let i = 0, j = 0, k = l;
    r.record({ line: 6, message: `Mesclando [${l}..${m}] com [${m + 1}..${ri}]` });
    while (i < left.length && j < right.length) {
      r.comparisons++;
      r.record({ comparing: [l + i, m + 1 + j], line: 7, message: `Comparando ${left[i]} e ${right[j]}` });
      if (left[i] <= right[j]) {
        r.overwrite(k, left[i], 8, `Colocando ${left[i]} na posição ${k}`);
        i++;
      } else {
        r.overwrite(k, right[j], 9, `Colocando ${right[j]} na posição ${k}`);
        j++;
      }
      k++;
    }
    while (i < left.length) { r.overwrite(k, left[i], 10, `Copiando restante da esquerda: ${left[i]}`); i++; k++; }
    while (j < right.length) { r.overwrite(k, right[j], 11, `Copiando restante da direita: ${right[j]}`); j++; k++; }
    if (l === 0 && ri === r.arr.length - 1) for (let x = l; x <= ri; x++) r.sorted.add(x);
  };
  sort(0, r.arr.length - 1);
  for (let i = 0; i < r.arr.length; i++) r.sorted.add(i);
  r.record({ line: 12, message: "Merge Sort concluído" });
  return r.steps;
}

function quick(input: number[]): SortStep[] {
  const r = makeRecorder(input);
  r.record({ line: 0, message: "Iniciando Quick Sort" });
  const part = (lo: number, hi: number): number => {
    const pivot = r.arr[hi];
    r.pivot = hi;
    r.record({ line: 4, message: `Pivô = ${pivot} (índice ${hi})` });
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      r.compare(j, hi, 6, `Comparando ${r.arr[j]} com pivô ${pivot}`);
      if (r.arr[j] <= pivot) {
        i++;
        if (i !== j) r.swap(i, j, 8, `Trocando ${r.arr[i]} ↔ ${r.arr[j]}`);
      }
    }
    r.swap(i + 1, hi, 10, `Colocando pivô ${pivot} na posição correta ${i + 1}`);
    r.pivot = null;
    r.markSorted(i + 1, 11, `Pivô fixo no índice ${i + 1}`);
    return i + 1;
  };
  const sort = (lo: number, hi: number) => {
    if (lo < hi) {
      const p = part(lo, hi);
      sort(lo, p - 1);
      sort(p + 1, hi);
    } else if (lo === hi) r.sorted.add(lo);
  };
  sort(0, r.arr.length - 1);
  for (let i = 0; i < r.arr.length; i++) r.sorted.add(i);
  r.record({ line: 13, message: "Quick Sort concluído" });
  return r.steps;
}

function heap(input: number[]): SortStep[] {
  const r = makeRecorder(input);
  const n = r.arr.length;
  r.heapSize = n;
  r.record({ line: 0, message: "Iniciando Heap Sort — construindo max-heap" });

  const heapify = (size: number, i: number) => {
    let largest = i;
    const l = 2 * i + 1, ri = 2 * i + 2;
    if (l < size) {
      r.compare(l, largest, 4, `Heapify: comparando filho esquerdo ${r.arr[l]} com ${r.arr[largest]}`);
      if (r.arr[l] > r.arr[largest]) largest = l;
    }
    if (ri < size) {
      r.compare(ri, largest, 5, `Heapify: comparando filho direito ${r.arr[ri]} com ${r.arr[largest]}`);
      if (r.arr[ri] > r.arr[largest]) largest = ri;
    }
    if (largest !== i) {
      r.swap(i, largest, 7, `Trocando para manter propriedade do heap`);
      heapify(size, largest);
    }
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  r.record({ line: 10, message: "Max-heap construído. Extraindo máximos." });

  for (let i = n - 1; i > 0; i--) {
    r.swap(0, i, 12, `Movendo máximo ${r.arr[0]} para o fim`);
    r.sorted.add(i);
    r.heapSize = i;
    r.record({ line: 13, message: `Reduzindo heap para tamanho ${i}` });
    heapify(i, 0);
  }
  r.sorted.add(0);
  r.heapSize = 0;
  r.record({ line: 15, message: "Heap Sort concluído" });
  return r.steps;
}

export const ALGORITHMS: Record<AlgoKey, (a: number[]) => SortStep[]> = {
  bubble, selection, insertion, merge, quick, heap,
};
