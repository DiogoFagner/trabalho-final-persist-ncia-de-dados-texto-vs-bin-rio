import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, SkipForward, RotateCcw, Swords, Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ALGORITHMS } from "@/lib/sorting/algorithms";
import { ALGO_META } from "@/lib/sorting/meta";
import type { AlgoKey, SortStep } from "@/lib/sorting/types";
import type { DataItem } from "@/lib/sorting/dataSources";

const ALGO_KEYS: AlgoKey[] = ["bubble", "selection", "insertion", "merge", "quick", "heap"];

function colorFor(i: number, step: SortStep | null) {
  if (!step) return "var(--color-bar)";
  if (step.swapping.includes(i)) return "var(--color-swap)";
  if (step.comparing.includes(i)) return "var(--color-compare)";
  if (step.sorted.includes(i)) return "var(--color-sorted)";
  if (step.pivot === i) return "var(--color-pivot)";
  return "var(--color-bar)";
}

function Bars({ step, items }: { step: SortStep | null; items: DataItem[] }) {
  const arr = step?.array ?? items.map((i) => i.value);
  const max = Math.max(...arr, 1);
  return (
    <div className="flex items-end gap-[2px] h-56 px-2 py-2 rounded-lg bg-secondary/40 border overflow-hidden">
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

function MiniPseudocode({ algo, line }: { algo: AlgoKey; line: number }) {
  const meta = ALGO_META[algo];
  return (
    <pre className="text-[10px] leading-relaxed p-2 rounded-lg bg-secondary/60 border font-mono overflow-x-auto">
      {meta.pseudocode.map((l, i) => (
        <div
          key={i}
          className="px-1 -mx-1 rounded transition-colors"
          style={{
            backgroundColor: i === line ? "oklch(0.85 0.18 90 / 0.18)" : "transparent",
            color: i === line ? "oklch(0.95 0.15 90)" : "var(--color-foreground)",
            borderLeft: i === line ? "2px solid var(--color-compare)" : "2px solid transparent",
          }}
        >
          <span className="text-muted-foreground mr-2 select-none">{String(i + 1).padStart(2, "0")}</span>
          {l}
        </div>
      ))}
    </pre>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-1.5 rounded-md bg-secondary/40">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold">{value}</span>
    </div>
  );
}

function Panel({
  algo,
  steps,
  idx,
  items,
  elapsed,
  comparisons,
  swaps,
  label,
  color,
}: {
  algo: AlgoKey;
  steps: SortStep[];
  idx: number;
  items: DataItem[];
  elapsed: number;
  comparisons: number;
  swaps: number;
  label: string;
  color: string;
}) {
  const current = steps[idx] ?? null;
  const meta = ALGO_META[algo];
  return (
    <Card className="p-3 space-y-3 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <Badge style={{ backgroundColor: color, color: "white" }} className="mb-1">
            {label}
          </Badge>
          <h3 className="text-sm font-semibold">{meta.name}</h3>
          <p className="text-[10px] text-muted-foreground">
            Passo {idx + 1} / {steps.length || 1}
          </p>
        </div>
        <div className="text-right space-y-0.5">
          <Stat label="Tempo" value={`${(elapsed / 1000).toFixed(2)}s`} />
          <Stat label="Comparações" value={String(comparisons)} />
          <Stat label="Trocas" value={String(swaps)} />
        </div>
      </div>

      <Bars step={current} items={items} />

      <Card className="p-2 bg-secondary/40 border-dashed">
        <p className="text-xs font-mono truncate">{current?.message ?? "Pronto."}</p>
      </Card>

      <MiniPseudocode algo={algo} line={current?.line ?? -1} />
    </Card>
  );
}

export function CompareMode({ items }: { items: DataItem[] }) {
  const [leftAlgo, setLeftAlgo] = useState<AlgoKey>("bubble");
  const [rightAlgo, setRightAlgo] = useState<AlgoKey>("quick");
  const [speed, setSpeed] = useState<number>(50);

  const [leftSteps, setLeftSteps] = useState<SortStep[]>([]);
  const [rightSteps, setRightSteps] = useState<SortStep[]>([]);

  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(0);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const buildSteps = useCallback(() => {
    if (!items.length) return;
    const base = items.map((i) => i.value);
    setLeftSteps(ALGORITHMS[leftAlgo]([...base]));
    setRightSteps(ALGORITHMS[rightAlgo]([...base]));
    setLeftIdx(0);
    setRightIdx(0);
    setElapsed(0);
    startRef.current = null;
  }, [items, leftAlgo, rightAlgo]);

  useEffect(() => {
    buildSteps();
  }, [buildSteps]);

  // Synchronized playback — advance the slower one
  useEffect(() => {
    if (!playing) return;
    const leftDone = leftIdx >= leftSteps.length - 1;
    const rightDone = rightIdx >= rightSteps.length - 1;
    if (leftDone && rightDone) {
      setPlaying(false);
      toast.success("Ambos os algoritmos concluídos!");
      return;
    }

    const delay = Math.max(5, 500 - speed * 4.95);
    const t = setTimeout(() => {
      setLeftIdx((i) => Math.min(i + 1, leftSteps.length - 1));
      setRightIdx((i) => Math.min(i + 1, rightSteps.length - 1));
    }, delay);
    return () => clearTimeout(t);
  }, [playing, leftIdx, rightIdx, leftSteps.length, rightSteps.length, speed]);

  // Timer
  useEffect(() => {
    if (!playing) return;
    if (startRef.current === null) startRef.current = performance.now() - elapsed;
    const tick = () => {
      setElapsed(performance.now() - (startRef.current ?? performance.now()));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, elapsed]);

  const onReset = () => {
    setPlaying(false);
    setLeftIdx(0);
    setRightIdx(0);
    setElapsed(0);
    startRef.current = null;
    buildSteps();
  };

  const leftCurrent = leftSteps[leftIdx] ?? null;
  const rightCurrent = rightSteps[rightIdx] ?? null;

  const leftMeta = ALGO_META[leftAlgo];
  const rightMeta = ALGO_META[rightAlgo];

  const leftDone = leftIdx >= leftSteps.length - 1;
  const rightDone = rightIdx >= rightSteps.length - 1;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Modo Comparação</h2>
            <span className="text-xs text-muted-foreground">Dois algoritmos, mesmo dataset, execução sincronizada</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Esquerda</label>
              <Select value={leftAlgo} onValueChange={(v) => setLeftAlgo(v as AlgoKey)}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALGO_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {ALGO_META[k].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-muted-foreground text-xs">VS</div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Direita</label>
              <Select value={rightAlgo} onValueChange={(v) => setRightAlgo(v as AlgoKey)}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALGO_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {ALGO_META[k].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Button size="sm" variant={playing ? "secondary" : "default"} onClick={() => setPlaying((p) => !p)}>
            {playing ? <><Pause className="h-4 w-4 mr-1" />Pause</> : <><Play className="h-4 w-4 mr-1" />Play</>}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => {
            setLeftIdx((i) => Math.min(i + 1, leftSteps.length - 1));
            setRightIdx((i) => Math.min(i + 1, rightSteps.length - 1));
          }}>
            <SkipForward className="h-4 w-4 mr-1" />Próximo
          </Button>
          <Button size="sm" variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1" />Reset
          </Button>
          <div className="flex-1 min-w-[200px] space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Velocidade</span>
              <span>{speed}%</span>
            </div>
            <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={1} max={100} step={1} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          algo={leftAlgo}
          steps={leftSteps}
          idx={leftIdx}
          items={items}
          elapsed={elapsed}
          comparisons={leftCurrent?.comparisons ?? 0}
          swaps={leftCurrent?.swaps ?? 0}
          label="Algoritmo A"
          color="oklch(0.72 0.18 200)"
        />
        <Panel
          algo={rightAlgo}
          steps={rightSteps}
          idx={rightIdx}
          items={items}
          elapsed={elapsed}
          comparisons={rightCurrent?.comparisons ?? 0}
          swaps={rightCurrent?.swaps ?? 0}
          label="Algoritmo B"
          color="oklch(0.65 0.22 295)"
        />
      </div>

      {/* Winner banner */}
      {(leftDone || rightDone) && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">Resultado da Corrida</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-secondary/40">
              <div className="text-xs text-muted-foreground mb-1">Vencedor (menos passos)</div>
              <div className="font-semibold">
                {leftSteps.length <= rightSteps.length ? leftMeta.name : rightMeta.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {leftSteps.length <= rightSteps.length
                  ? `${leftSteps.length} vs ${rightSteps.length}`
                  : `${rightSteps.length} vs ${leftSteps.length}`}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40">
              <div className="text-xs text-muted-foreground mb-1">Menos comparações</div>
              <div className="font-semibold">
                {(leftSteps[leftSteps.length - 1]?.comparisons ?? 0) <= (rightSteps[rightSteps.length - 1]?.comparisons ?? 0)
                  ? leftMeta.name
                  : rightMeta.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {Math.min(
                  leftSteps[leftSteps.length - 1]?.comparisons ?? 0,
                  rightSteps[rightSteps.length - 1]?.comparisons ?? 0
                ).toLocaleString()} vs{" "}
                {Math.max(
                  leftSteps[leftSteps.length - 1]?.comparisons ?? 0,
                  rightSteps[rightSteps.length - 1]?.comparisons ?? 0
                ).toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40">
              <div className="text-xs text-muted-foreground mb-1">Menos trocas</div>
              <div className="font-semibold">
                {(leftSteps[leftSteps.length - 1]?.swaps ?? 0) <= (rightSteps[rightSteps.length - 1]?.swaps ?? 0)
                  ? leftMeta.name
                  : rightMeta.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {Math.min(
                  leftSteps[leftSteps.length - 1]?.swaps ?? 0,
                  rightSteps[rightSteps.length - 1]?.swaps ?? 0
                ).toLocaleString()} vs{" "}
                {Math.max(
                  leftSteps[leftSteps.length - 1]?.swaps ?? 0,
                  rightSteps[rightSteps.length - 1]?.swaps ?? 0
                ).toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40">
              <div className="text-xs text-muted-foreground mb-1">Complexidade média</div>
              <div className="font-semibold">{leftMeta.avg}</div>
              <div className="text-xs text-muted-foreground mt-0.5">vs {rightMeta.avg}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
