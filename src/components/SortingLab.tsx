import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipForward, RotateCcw, Loader2, BarChart3, Swords, LayoutGrid, Search as SearchIcon, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SOURCES, type SourceKey, fetchData, type DataItem } from "@/lib/sorting/dataSources";
import { ALGORITHMS } from "@/lib/sorting/algorithms";
import { ALGO_META } from "@/lib/sorting/meta";
import type { AlgoKey, SortStep } from "@/lib/sorting/types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend as ReLegend, CartesianGrid } from "recharts";
import { CompareMode } from "./CompareMode";
import { SearchLab } from "./SearchLab";
import { PersistenceLab } from "./PersistenceLab";
import { persistApi } from "@/lib/persistence";

type Mode = "single" | "compare" | "search" | "persist";

const ALGO_KEYS: AlgoKey[] = ["bubble", "selection", "insertion", "merge", "quick", "heap"];

function colorFor(i: number, step: SortStep | null) {
  if (!step) return "var(--color-bar)";
  if (step.swapping.includes(i)) return "var(--color-swap)";
  if (step.comparing.includes(i)) return "var(--color-compare)";
  if (step.sorted.includes(i)) return "var(--color-sorted)";
  if (step.pivot === i) return "var(--color-pivot)";
  return "var(--color-bar)";
}

function HeapTree({ array, heapSize }: { array: number[]; heapSize: number | null }) {
  const n = heapSize ?? array.length;
  if (n <= 0) return <div className="text-xs text-muted-foreground">Heap vazio.</div>;
  const levels: number[][] = [];
  let lvl = 0;
  while ((1 << lvl) - 1 < n) {
    const start = (1 << lvl) - 1;
    const end = Math.min(start + (1 << lvl), n);
    levels.push(Array.from({ length: end - start }, (_, i) => start + i));
    lvl++;
  }
  const max = Math.max(...array.slice(0, n), 1);
  return (
    <div className="flex flex-col gap-3 items-center py-2">
      {levels.map((lv, li) => (
        <div key={li} className="flex gap-2 justify-center flex-wrap">
          {lv.map((idx) => {
            const intensity = array[idx] / max;
            return (
              <div
                key={idx}
                className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-mono border-2"
                style={{
                  background: `oklch(${0.3 + intensity * 0.4} 0.15 ${200 + intensity * 100})`,
                  borderColor: "var(--color-border)",
                  color: "white",
                }}
                title={`Índice ${idx}`}
              >
                {array[idx]}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Bars({ step, items }: { step: SortStep | null; items: DataItem[] }) {
  const arr = step?.array ?? items.map((i) => i.value);
  const max = Math.max(...arr, 1);
  return (
    <div className="flex items-end gap-[2px] h-72 px-2 py-2 rounded-lg bg-secondary/40 border overflow-hidden">
      {arr.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-[height,background-color] duration-150"
          style={{
            height: `${(v / max) * 100}%`,
            backgroundColor: colorFor(i, step),
            minWidth: 2,
          }}
          title={`${items[i]?.label ?? i}: ${v}`}
        />
      ))}
    </div>
  );
}

function Pseudocode({ algo, line }: { algo: AlgoKey; line: number }) {
  const meta = ALGO_META[algo];
  return (
    <pre className="text-xs leading-relaxed p-4 rounded-lg bg-secondary/60 border font-mono overflow-x-auto">
      {meta.pseudocode.map((l, i) => (
        <div
          key={i}
          className="px-2 -mx-2 rounded transition-colors"
          style={{
            backgroundColor: i === line ? "oklch(0.85 0.18 90 / 0.18)" : "transparent",
            color: i === line ? "oklch(0.95 0.15 90)" : "var(--color-foreground)",
            borderLeft: i === line ? "3px solid var(--color-compare)" : "3px solid transparent",
          }}
        >
          <span className="text-muted-foreground mr-3 select-none">{String(i + 1).padStart(2, "0")}</span>
          {l}
        </div>
      ))}
    </pre>
  );
}

export function SortingLab() {
  const [mode, setMode] = useState<Mode>("single");
  const [source, setSource] = useState<SourceKey>("pokemon");
  const [field, setField] = useState<string>("weight");
  const [sample, setSample] = useState<number>(50);
  const [algo, setAlgo] = useState<AlgoKey>("bubble");
  const [speed, setSpeed] = useState<number>(50);
  const [items, setItems] = useState<DataItem[]>([]);
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState<{ algo: string; comparisons: number; swaps: number; steps: number; timeMs: number }[]>([]);
  const [hasSorted, setHasSorted] = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Reset field when source changes
  useEffect(() => {
    setField(SOURCES[source].fields[0].key);
  }, [source]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchData(source, field, sample);
      setItems(data);
      setSteps([]);
      setIdx(0);
      setElapsed(0);
      toast.success(`Carregados ${data.length} itens de ${SOURCES[source].name}`);
    } catch (e) {
      toast.error("Erro ao carregar dados: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [source, field, sample]);

  useEffect(() => { load(); }, [load]);

  const buildSteps = useCallback(() => {
    if (!items.length) return;
    const arr = items.map((i) => i.value);
    const s = ALGORITHMS[algo](arr);
    setSteps(s);
    setIdx(0);
    setElapsed(0);
    startRef.current = null;
  }, [items, algo]);

  useEffect(() => { buildSteps(); }, [buildSteps]);

  const current = steps[idx] ?? null;

  // Track whether a full sort has completed for binary-search precondition.
  useEffect(() => {
    if (steps.length && idx >= steps.length - 1) setHasSorted(true);
  }, [idx, steps.length]);
  useEffect(() => { setHasSorted(false); }, [items]);

  // Playback loop
  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) { setPlaying(false); return; }
    const delay = Math.max(5, 500 - speed * 4.95);
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), delay);
    return () => clearTimeout(t);
  }, [playing, idx, steps.length, speed]);

  // Timer
  useEffect(() => {
    if (!playing) return;
    if (startRef.current === null) startRef.current = performance.now() - elapsed;
    const tick = () => {
      setElapsed(performance.now() - (startRef.current ?? performance.now()));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, elapsed]);

  const onReset = () => {
    setPlaying(false);
    setIdx(0);
    setElapsed(0);
    startRef.current = null;
    buildSteps();
  };

  const runComparison = useCallback(() => {
    if (!items.length) return;
    const baseArr = items.map((i) => i.value);
    const results = ALGO_KEYS.map((k) => {
      const arr = [...baseArr];
      const t0 = performance.now();
      const s = ALGORITHMS[k](arr);
      const t1 = performance.now();
      const last = s[s.length - 1];
      return {
        algo: ALGO_META[k].name,
        comparisons: last?.comparisons ?? 0,
        swaps: last?.swaps ?? 0,
        steps: s.length,
        timeMs: +(t1 - t0).toFixed(3),
      };
    });
    setReport(results);
    setHasSorted(true);
    toast.success("Comparativo gerado!");
  }, [items]);

  const meta = ALGO_META[algo];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="border-b bg-card/40 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gradient">SortLab</h1>
            <p className="text-xs text-muted-foreground">Laboratório visual de algoritmos de ordenação</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary rounded-lg p-1 gap-1">
              <button
                onClick={() => setMode("single")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Simples
              </button>
              <button
                onClick={() => setMode("compare")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === "compare" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Swords className="h-3.5 w-3.5" /> Comparar
              </button>
              <button
                onClick={() => setMode("search")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === "search" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <SearchIcon className="h-3.5 w-3.5" /> Busca
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Legend />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Config */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Fonte</label>
              <Select value={source} onValueChange={(v) => setSource(v as SourceKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Campo</label>
              <Select value={field} onValueChange={setField}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES[source].fields.map((f) => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Amostra</label>
              <Select value={String(sample)} onValueChange={(v) => setSample(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 50, 100, 500].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} itens</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {mode === "single" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Algoritmo</label>
                <Select value={algo} onValueChange={(v) => setAlgo(v as AlgoKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALGO_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{ALGO_META[k].name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className={`flex items-end ${mode === "compare" ? "md:col-span-2" : ""}`}>
              <Button onClick={load} disabled={loading} className="w-full">
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Recarregar dados"}
              </Button>
            </div>
          </div>
        </Card>

        {mode === "single" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-4">
              {/* Visualizer */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{meta.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      Passo {idx + 1} / {steps.length || 1}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant={playing ? "secondary" : "default"} onClick={() => setPlaying((p) => !p)}>
                      {playing ? <><Pause className="h-4 w-4 mr-1" />Pause</> : <><Play className="h-4 w-4 mr-1" />Play</>}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setIdx((i) => Math.min(i + 1, steps.length - 1))}>
                      <SkipForward className="h-4 w-4 mr-1" />Próximo
                    </Button>
                    <Button size="sm" variant="outline" onClick={onReset}>
                      <RotateCcw className="h-4 w-4 mr-1" />Reset
                    </Button>
                  </div>
                </div>

                <Bars step={current} items={items} />

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Velocidade</span>
                    <span>{speed}%</span>
                  </div>
                  <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={1} max={100} step={1} />
                </div>

                {/* Narration */}
                <Card className="p-3 bg-secondary/40 border-dashed">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Narração</div>
                  <p className="text-sm font-mono">{current?.message ?? "Pronto para iniciar."}</p>
                </Card>

                {/* Heap tree */}
                {algo === "heap" && (
                  <Card className="p-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Árvore Binária (Heap)</div>
                    <HeapTree array={current?.array ?? items.map((i) => i.value)} heapSize={current?.heapSize ?? items.length} />
                  </Card>
                )}
              </Card>

              {/* Pseudocode + Explanation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold">Pseudocódigo</h3>
                  <Pseudocode algo={algo} line={current?.line ?? -1} />
                </Card>
                <Card className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Lógica & Complexidade</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">Melhor: {meta.best}</Badge>
                    <Badge variant="secondary">Médio: {meta.avg}</Badge>
                    <Badge variant="secondary">Pior: {meta.worst}</Badge>
                    <Badge variant="outline">Espaço: {meta.space}</Badge>
                    <Badge variant="outline">{meta.stable ? "Estável" : "Instável"}</Badge>
                  </div>
                  {meta.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                  ))}
                </Card>
              </div>
            </div>

            {/* Dashboard */}
            <aside className="space-y-4">
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Dashboard</h3>
                <Stat label="Tempo (animação)" value={`${(elapsed / 1000).toFixed(2)}s`} />
                <Stat label="Comparações" value={String(current?.comparisons ?? 0)} />
                <Stat label="Trocas / Escritas" value={String(current?.swaps ?? 0)} />
                <Stat label="Total de passos" value={String(steps.length)} />
                <Stat label="Progresso" value={`${steps.length ? Math.round(((idx + 1) / steps.length) * 100) : 0}%`} />
              </Card>
              <Card className="p-4 space-y-2">
                <h3 className="text-sm font-semibold">Legenda</h3>
                <LegendRow color="var(--color-bar)" label="Não-ordenado" />
                <LegendRow color="var(--color-compare)" label="Em comparação" />
                <LegendRow color="var(--color-swap)" label="Em troca" />
                <LegendRow color="var(--color-pivot)" label="Pivô (Quick)" />
                <LegendRow color="var(--color-sorted)" label="Ordenado" />
              </Card>
            </aside>
          </div>
        )}

        {mode === "compare" && items.length > 0 && <CompareMode items={items} />}
        {mode === "compare" && items.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Carregue os dados primeiro para usar o modo comparação.</p>
          </Card>
        )}

        {mode === "search" && items.length > 0 && (
          <SearchLab items={items} hasSorted={hasSorted} />
        )}
        {mode === "search" && items.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Carregue os dados primeiro para usar a busca.</p>
          </Card>
        )}

        {/* Comparison */}
        {mode !== "search" && <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Relatório comparativo</h2>
              <p className="text-xs text-muted-foreground">Roda todos os algoritmos sobre o mesmo dataset e compara métricas.</p>
            </div>
            <Button onClick={runComparison} disabled={!items.length}>Rodar comparação</Button>
          </div>

          {report.length > 0 && (
            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">Gráfico</TabsTrigger>
                <TabsTrigger value="table">Tabela</TabsTrigger>
              </TabsList>
              <TabsContent value="chart" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.025 260)" />
                    <XAxis dataKey="algo" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.025 260)", border: "1px solid oklch(0.3 0.025 260)", borderRadius: 8 }} />
                    <ReLegend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="comparisons" fill="oklch(0.72 0.18 200)" name="Comparações" />
                    <Bar dataKey="swaps" fill="oklch(0.65 0.22 295)" name="Trocas" />
                    <Bar dataKey="timeMs" fill="oklch(0.85 0.18 90)" name="Tempo (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="table">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 px-3">Algoritmo</th>
                        <th className="py-2 px-3">Comparações</th>
                        <th className="py-2 px-3">Trocas</th>
                        <th className="py-2 px-3">Passos</th>
                        <th className="py-2 px-3">Tempo (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((r) => (
                        <tr key={r.algo} className="border-b border-border/40">
                          <td className="py-2 px-3 font-medium">{r.algo}</td>
                          <td className="py-2 px-3 font-mono">{r.comparisons.toLocaleString()}</td>
                          <td className="py-2 px-3 font-mono">{r.swaps.toLocaleString()}</td>
                          <td className="py-2 px-3 font-mono">{r.steps.toLocaleString()}</td>
                          <td className="py-2 px-3 font-mono">{r.timeMs.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </Card>}

        <footer className="text-center text-xs text-muted-foreground py-6">
          SortLab — feito para aprender ordenação na prática.
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-secondary/40">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}
function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
function Legend() {
  return (
    <>
      <LegendRow color="var(--color-compare)" label="Comparação" />
      <LegendRow color="var(--color-swap)" label="Troca" />
      <LegendRow color="var(--color-sorted)" label="Ordenado" />
    </>
  );
}
