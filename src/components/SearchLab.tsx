import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, Search as SearchIcon, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  binarySearch,
  countComparisons,
  linearSearch,
  SEARCH_PSEUDOCODE,
  type MatchMode,
  type SearchKind,
  type SearchStep,
} from "@/lib/search/algorithms";
import type { DataItem } from "@/lib/sorting/dataSources";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend as ReLegend,
} from "recharts";

type Props = {
  items: DataItem[];
  hasSorted: boolean;
};

function inDiscarded(i: number, discarded: Array<[number, number]>) {
  return discarded.some(([a, b]) => i >= a && i <= b);
}

function colorForBinary(i: number, step: SearchStep | null): string {
  if (!step) return "var(--color-bar)";
  if (step.found === i) return "var(--color-sorted)";
  if (step.mid === i) return "var(--color-pivot)";
  if (step.lo === i) return "var(--color-compare)";
  if (step.hi === i) return "var(--color-swap)";
  if (inDiscarded(i, step.discarded)) return "oklch(0.3 0.02 260 / 0.45)";
  if (step.lo !== null && step.hi !== null && (i < step.lo || i > step.hi)) return "oklch(0.3 0.02 260 / 0.45)";
  return "var(--color-bar)";
}

function colorForLinear(i: number, step: SearchStep | null): string {
  if (!step) return "var(--color-bar)";
  if (step.found === i) return "var(--color-sorted)";
  if (step.current === i) return "var(--color-compare)";
  if (step.current !== null && i < step.current) return "oklch(0.3 0.02 260 / 0.45)";
  return "var(--color-bar)";
}

function Pseudocode({ kind, line }: { kind: SearchKind; line: number }) {
  const code = SEARCH_PSEUDOCODE[kind];
  return (
    <pre className="text-xs leading-relaxed p-4 rounded-lg bg-secondary/60 border font-mono overflow-x-auto">
      {code.map((l, i) => (
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

export function SearchLab({ items, hasSorted }: Props) {
  const [kind, setKind] = useState<SearchKind>("linear");
  const [mode, setMode] = useState<MatchMode>("partial");
  const [target, setTarget] = useState("");
  const [speed, setSpeed] = useState(50);
  const [steps, setSteps] = useState<SearchStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [chart, setChart] = useState<Array<{ size: number; linear: number; binary: number }>>([]);
  const lastRunKind = useRef<SearchKind>("linear");

  const labelSorted = useMemo(
    () => [...items].sort((a, b) => a.label.localeCompare(b.label)),
    [items],
  );

  // Effective items shown: binary uses the alphabetically sorted view.
  const view = kind === "binary" ? labelSorted : items;

  // Force kind back to linear if user lost the "sorted" precondition.
  useEffect(() => {
    if (!hasSorted && kind === "binary") setKind("linear");
  }, [hasSorted, kind]);

  const current = steps[idx] ?? null;

  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) { setPlaying(false); return; }
    const delay = Math.max(50, 700 - speed * 6.5);
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), delay);
    return () => clearTimeout(t);
  }, [playing, idx, steps.length, speed]);

  const run = () => {
    if (!view.length || !target.trim()) return;
    const s =
      kind === "linear"
        ? linearSearch(view, target.trim(), mode)
        : binarySearch(view, target.trim(), mode);
    setSteps(s);
    setIdx(0);
    setPlaying(true);
    lastRunKind.current = kind;
  };

  const reset = () => {
    setPlaying(false);
    setIdx(0);
    setSteps([]);
  };

  const buildChart = () => {
    if (!items.length || !target.trim()) return;
    const sizes = [10, 50, 100, 500].filter((n) => n <= items.length);
    const data = sizes.map((n) => {
      const slice = items.slice(0, n);
      const sortedSlice = [...slice].sort((a, b) => a.label.localeCompare(b.label));
      return {
        size: n,
        linear: countComparisons("linear", slice, target.trim(), mode),
        binary: countComparisons("binary", sortedSlice, target.trim(), mode),
      };
    });
    setChart(data);
  };

  const renderBars = () => {
    const arr = view.map((it) => it.value);
    const max = Math.max(...arr, 1);
    return (
      <div className="flex items-end gap-[2px] h-72 px-2 py-2 rounded-lg bg-secondary/40 border overflow-hidden">
        {arr.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t transition-[height,background-color] duration-150"
            style={{
              height: `${(v / max) * 100}%`,
              backgroundColor:
                lastRunKind.current === "binary"
                  ? colorForBinary(i, current)
                  : colorForLinear(i, current),
              minWidth: 2,
            }}
            title={`${view[i]?.label ?? i}: ${v}`}
          />
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Controls */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={kind === "linear" ? "default" : "secondary"}
                size="sm"
                onClick={() => setKind("linear")}
              >
                <SearchIcon className="h-4 w-4 mr-1" /> Busca Linear
              </Button>
              {hasSorted ? (
                <Button
                  variant={kind === "binary" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setKind("binary")}
                >
                  <SearchIcon className="h-4 w-4 mr-1" /> Busca Binária
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="secondary" size="sm" disabled>
                        <SearchIcon className="h-4 w-4 mr-1" /> Busca Binária
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Ordene a lista primeiro!
                    </span>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setMode("exact")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${mode === "exact" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >Exata</button>
              <button
                onClick={() => setMode("partial")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${mode === "partial" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >Parcial (substring)</button>
            </div>

            <div className="flex-1 min-w-[240px]">
              <label className="text-xs text-muted-foreground">Alvo</label>
              <Input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="ex.: pika"
                onKeyDown={(e) => { if (e.key === "Enter") run(); }}
              />
            </div>

            <Button onClick={run} disabled={!target.trim() || !view.length}>Buscar</Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Limpar
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Velocidade</span><span>{speed}%</span>
            </div>
            <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={1} max={100} step={1} />
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          {/* Visualization */}
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-semibold">
                    {kind === "linear" ? "Busca Linear" : "Busca Binária"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Passo {steps.length ? idx + 1 : 0} / {steps.length}
                    {kind === "binary" && " · ordenado por label A→Z"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={playing ? "secondary" : "default"} onClick={() => setPlaying((p) => !p)} disabled={!steps.length}>
                    {playing ? <><Pause className="h-4 w-4 mr-1" />Pause</> : <><Play className="h-4 w-4 mr-1" />Play</>}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={!steps.length} onClick={() => setIdx((i) => Math.min(i + 1, steps.length - 1))}>
                    <SkipForward className="h-4 w-4 mr-1" />Próximo
                  </Button>
                </div>
              </div>

              {renderBars()}

              {/* Index strip for binary highlighting */}
              {lastRunKind.current === "binary" && current && (
                <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                  {view.slice(0, Math.min(40, view.length)).map((it, i) => {
                    const bg = colorForBinary(i, current);
                    return (
                      <span key={i} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: bg, color: "white" }} title={it.label}>
                        {i}
                      </span>
                    );
                  })}
                  {view.length > 40 && <span className="text-muted-foreground">…</span>}
                </div>
              )}

              <Card className="p-3 bg-secondary/40 border-dashed">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Narração</div>
                <p className="text-sm font-mono">{current?.message ?? "Digite um alvo e clique em Buscar."}</p>
              </Card>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4 space-y-2">
                <h3 className="text-sm font-semibold">Pseudocódigo</h3>
                <Pseudocode kind={kind} line={current?.line ?? -1} />
              </Card>
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Sobre o algoritmo</h3>
                {kind === "linear" ? (
                  <>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">Melhor: O(1)</Badge>
                      <Badge variant="secondary">Médio: O(n)</Badge>
                      <Badge variant="secondary">Pior: O(n)</Badge>
                      <Badge variant="outline">Não exige ordenação</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Percorre a lista do início ao fim comparando cada elemento. Funciona em qualquer ordem e suporta busca por substring.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">Melhor: O(1)</Badge>
                      <Badge variant="secondary">Médio: O(log n)</Badge>
                      <Badge variant="secondary">Pior: O(log n)</Badge>
                      <Badge variant="outline">Exige ordenação</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Divide o intervalo pela metade a cada passo, comparando com o elemento central. Para isso a lista precisa estar ordenada — aqui usamos a ordem alfabética dos labels.
                    </p>
                  </>
                )}
              </Card>
            </div>
          </div>

          {/* Dashboard */}
          <aside className="space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Métricas em tempo real</h3>
              <Stat label="Comparações" value={String(current?.comparisons ?? 0)} />
              <Stat label="Passos" value={`${steps.length ? idx + 1 : 0} / ${steps.length}`} />
              <Stat label="Modo" value={mode === "exact" ? "Exato" : "Parcial"} />
              <Stat label="Resultado" value={current?.found != null ? `índice ${current.found}` : current?.done ? "Não encontrado" : "—"} />
            </Card>
            <Card className="p-4 space-y-2">
              <h3 className="text-sm font-semibold">Legenda</h3>
              {lastRunKind.current === "binary" ? (
                <>
                  <LegendRow color="var(--color-compare)" label="Início (lo)" />
                  <LegendRow color="var(--color-pivot)" label="Meio (mid)" />
                  <LegendRow color="var(--color-swap)" label="Fim (hi)" />
                  <LegendRow color="oklch(0.3 0.02 260 / 0.45)" label="Descartado" />
                  <LegendRow color="var(--color-sorted)" label="Encontrado" />
                </>
              ) : (
                <>
                  <LegendRow color="var(--color-compare)" label="Atual" />
                  <LegendRow color="oklch(0.3 0.02 260 / 0.45)" label="Já verificado" />
                  <LegendRow color="var(--color-sorted)" label="Encontrado" />
                </>
              )}
            </Card>
          </aside>
        </div>

        {/* Growth chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold">Crescimento de comparações</h2>
              <p className="text-xs text-muted-foreground">
                Quantas comparações cada algoritmo faz buscando "{target || "—"}" em amostras de 10 / 50 / 100 / 500 itens.
              </p>
            </div>
            <Button onClick={buildChart} disabled={!target.trim() || !items.length}>
              Gerar gráfico
            </Button>
          </div>
          {chart.length > 0 && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.025 260)" />
                  <XAxis dataKey="size" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 12 }} />
                  <ReTooltip contentStyle={{ background: "oklch(0.21 0.025 260)", border: "1px solid oklch(0.3 0.025 260)", borderRadius: 8 }} />
                  <ReLegend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="linear" stroke="oklch(0.72 0.18 200)" strokeWidth={2} name="Linear" />
                  <Line type="monotone" dataKey="binary" stroke="oklch(0.85 0.18 90)" strokeWidth={2} name="Binária" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </TooltipProvider>
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