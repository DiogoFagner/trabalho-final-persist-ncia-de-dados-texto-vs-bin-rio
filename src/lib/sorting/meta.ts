import type { AlgoKey } from "./types";

export type AlgoMeta = {
  key: AlgoKey;
  name: string;
  pseudocode: string[];
  best: string;
  avg: string;
  worst: string;
  space: string;
  stable: boolean;
  paragraphs: [string, string, string];
};

export const ALGO_META: Record<AlgoKey, AlgoMeta> = {
  bubble: {
    key: "bubble",
    name: "Bubble Sort",
    best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: true,
    pseudocode: [
      "function bubbleSort(A):",
      "  n = length(A)",
      "  for i from 0 to n-2:",
      "    for j from 0 to n-2-i:",
      "      if A[j] > A[j+1]:",
      "        swap(A[j], A[j+1])",
      "    // posição n-1-i fixada",
      "    if nenhuma troca: break",
      "  return A",
    ],
    paragraphs: [
      "O Bubble Sort percorre o array repetidamente, comparando pares adjacentes e trocando-os caso estejam fora de ordem. Os maiores elementos 'borbulham' para o final a cada passagem completa.",
      "Sua complexidade média e pior é O(n²) porque, no pior cenário, é necessário fazer n-1 passagens com até n-1 comparações cada. No melhor caso (array já ordenado) é O(n) graças à otimização de detectar nenhuma troca.",
      "Apesar de didático e estável, é ineficiente para grandes conjuntos. Use apenas para ensino ou listas muito pequenas — algoritmos como Merge ou Quick Sort vencem em escala.",
    ],
  },
  selection: {
    key: "selection",
    name: "Selection Sort",
    best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: false,
    pseudocode: [
      "function selectionSort(A):",
      "  for i from 0 to n-2:",
      "    min = i",
      "    for j from i+1 to n-1:",
      "      if A[j] < A[min]:",
      "        min = j",
      "    if min != i:",
      "      swap(A[i], A[min])",
      "    // i ordenado",
      "  return A",
    ],
    paragraphs: [
      "O Selection Sort divide o array em uma parte ordenada (à esquerda) e uma não-ordenada. A cada iteração, encontra o menor elemento da parte não-ordenada e o coloca no início dela.",
      "Sua complexidade é sempre O(n²) — independentemente do array inicial — pois sempre faz n·(n-1)/2 comparações. Em compensação, faz no máximo n-1 trocas, sendo útil quando a escrita é cara.",
      "É instável (pode alterar a ordem relativa de iguais) e simples de implementar. Costuma perder para Insertion Sort em arrays quase ordenados.",
    ],
  },
  insertion: {
    key: "insertion",
    name: "Insertion Sort",
    best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: true,
    pseudocode: [
      "function insertionSort(A):",
      "  for i from 1 to n-1:",
      "    key = A[i]",
      "    j = i - 1",
      "    while j >= 0 and A[j] > key:",
      "      A[j+1] = A[j]",
      "      j = j - 1",
      "    A[j+1] = key",
      "  // ordenado",
      "  return A",
    ],
    paragraphs: [
      "O Insertion Sort constrói o array ordenado um elemento de cada vez, inserindo cada novo elemento na posição correta dentro da parte já ordenada à sua esquerda.",
      "Tem complexidade O(n²) no pior caso, mas atinge O(n) quando o array já está quase ordenado — sendo extremamente eficiente para entradas pequenas ou parcialmente ordenadas.",
      "É estável, in-place e amplamente usado como base de algoritmos híbridos (como o Timsort) para tratar pequenas partições.",
    ],
  },
  merge: {
    key: "merge",
    name: "Merge Sort",
    best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: true,
    pseudocode: [
      "function mergeSort(A, l, r):",
      "  if l >= r: return",
      "  m = (l + r) / 2",
      "  mergeSort(A, l, m)",
      "  mergeSort(A, m+1, r)",
      "  merge(A, l, m, r)",
      "function merge(A, l, m, r):",
      "  while ambos têm itens:",
      "    se A[i] <= A[j]: copiar A[i]",
      "    senão: copiar A[j]",
      "  copiar resto da esquerda",
      "  copiar resto da direita",
      "  // mesclado",
    ],
    paragraphs: [
      "O Merge Sort é um algoritmo de divisão e conquista: divide o array recursivamente ao meio até chegar em sub-arrays unitários, e então mescla pares ordenados de volta em arrays maiores e ordenados.",
      "Sua complexidade é O(n log n) em todos os casos — log n níveis de divisão, cada um fazendo O(n) trabalho de merge. Isso o torna previsível e excelente para dados grandes.",
      "Requer O(n) de memória auxiliar para o merge, sendo estável e ideal para ordenar listas encadeadas ou dados externos (que não cabem em memória).",
    ],
  },
  quick: {
    key: "quick",
    name: "Quick Sort",
    best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)", stable: false,
    pseudocode: [
      "function quickSort(A, lo, hi):",
      "  if lo < hi:",
      "    p = partition(A, lo, hi)",
      "function partition(A, lo, hi):",
      "  pivot = A[hi]",
      "  i = lo - 1",
      "  for j from lo to hi-1:",
      "    if A[j] <= pivot:",
      "      i++",
      "      swap(A[i], A[j])",
      "  swap(A[i+1], A[hi])",
      "  return i + 1",
      "  // recursão em sub-partições",
    ],
    paragraphs: [
      "O Quick Sort escolhe um elemento como pivô e particiona o array de modo que os menores fiquem à esquerda e os maiores à direita. Em seguida, aplica recursivamente o mesmo processo a cada partição.",
      "Em média é O(n log n) e na prática costuma ser o mais rápido dos comparativos. No pior caso (pivôs sempre péssimos) degrada para O(n²), mas escolhas inteligentes de pivô (mediana de três, aleatório) evitam isso.",
      "É in-place (O(log n) de stack), instável, e amplamente usado nas bibliotecas padrão (combinado a Insertion para partições pequenas).",
    ],
  },
  heap: {
    key: "heap",
    name: "Heap Sort",
    best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)", stable: false,
    pseudocode: [
      "function heapSort(A):",
      "  buildMaxHeap(A)",
      "function heapify(A, n, i):",
      "  largest = i",
      "  if filho_esq > largest: largest = esq",
      "  if filho_dir > largest: largest = dir",
      "  if largest != i:",
      "    swap(A[i], A[largest])",
      "    heapify(A, n, largest)",
      "// extração",
      "// max-heap pronto",
      "for i from n-1 downto 1:",
      "  swap(A[0], A[i])",
      "  heapify(A, i, 0)",
      "// ordenado",
    ],
    paragraphs: [
      "O Heap Sort transforma o array em um max-heap (árvore binária onde cada pai é maior que seus filhos) e então repetidamente extrai o máximo, colocando-o no final do array.",
      "Sua complexidade é O(n log n) em todos os casos — buildHeap é O(n) e cada uma das n extrações faz heapify O(log n). É portanto previsível como o Merge Sort.",
      "É in-place (O(1) extra) e não estável. Sua principal vantagem sobre o Quick Sort é o pior caso garantido, ao custo de constantes maiores na prática.",
    ],
  },
};
