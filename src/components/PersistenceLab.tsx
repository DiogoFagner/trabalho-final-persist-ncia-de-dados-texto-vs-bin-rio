import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, HardDrive, Save, FileText, Binary, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { DataItem } from "@/lib/sorting/dataSources";
import { persistApi, PERSIST_API, type CompareResponse } from "@/lib/persistence";

export function PersistenceLab({
  items,
  onLoadOffline,
}: {
  items: DataItem[];
  onLoadOffline: (items: DataItem[]) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [loadingOffline, setLoadingOffline] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [cmp, setCmp] = useState<CompareResponse | null>(null);
  const [apiUrl, setApiUrl] = useState(PERSIST_API);

  const handleSave = async () => {
    if (!items.length) return toast.error("Carregue dados antes de salvar.");
    setSaving(true);
    try {
      const r = await persistApi.salvar(items);
      toast.success(`Salvou ${r.count} itens em 4 formatos.`);
    } catch (e) {
      toast.error("Falha ao salvar: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadOffline = async () => {
    setLoadingOffline(true);
    try {
      const data = await persistApi.offline();
      onLoadOffline(data);
      toast.success(`Modo Offline: ${data.length} itens carregados do disco.`);
    } catch (e) {
      toast.error("Falha ao carregar offline: " + (e as Error).message);
    } finally {
      setLoadingOffline(false);
    }
  };

  const handleCompare = async () => {
    setComparing(true);
    try {
      const r = await persistApi.comparar();
      setCmp(r);
      toast.success("Comparativo atualizado.");
    } catch (e) {
      toast.error("Falha ao comparar: " + (e as Error).message);
    } finally {
      setComparing(false);
    }
  };

  const saveApiUrl = () => {
    window.localStorage.setItem("persist_api", apiUrl);
    toast.success("URL salva. Recarregue a página.");
  };

  const fmtBadge = (kind: "texto" | "binario") =>
    kind === "texto" ? (
      <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />Texto</Badge>
    ) : (
      <Badge className="gap-1 bg-purple-600 hover:bg-purple-600"><Binary className="h-3 w-3" />Binário</Badge>
    );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <HardDrive className="h-5 w-5" /> Persistência: Texto vs Binário
            </h2>
            <p className="text-xs text-muted-foreground">
              Backend Python (FastAPI): <code className="text-foreground">{PERSIST_API}</code>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="lg"
              onClick={handleLoadOffline}
              disabled={loadingOffline}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20"
            >
              {loadingOffline ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <HardDrive className="h-4 w-4 mr-2" />}
              Carregar do Arquivo (Modo Offline)
            </Button>
            <Button onClick={handleSave} disabled={saving || !items.length} variant="default">
              {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar nos 4 formatos
            </Button>
            <Button onClick={handleCompare} disabled={comparing} variant="secondary">
              {comparing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Atualizar comparativo
            </Button>
          </div>
        </div>
        <div className="flex gap-2 items-center text-xs">
          <span className="text-muted-foreground">API URL:</span>
          <input
            className="flex-1 bg-secondary rounded px-2 py-1 font-mono"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
          <Button size="sm" variant="outline" onClick={saveApiUrl}>Salvar URL</Button>
        </div>
      </Card>

      {/* Comparativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cmp?.formats.map((f) => (
          <Card key={f.format} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold uppercase">{f.format}</h3>
              {fmtBadge(f.kind)}
            </div>
            <div className="text-xs text-muted-foreground font-mono">{f.filename}</div>
            <div className="space-y-1 pt-2 border-t">
              <Row k="Tamanho" v={`${f.size_kb.toFixed(2)} KB`} />
              <Row k="Salvar" v={`${f.save_ms.toFixed(3)} ms`} />
              <Row k="Carregar" v={`${f.load_ms.toFixed(3)} ms`} />
            </div>
          </Card>
        ))}
        {!cmp && (
          <Card className="p-6 md:col-span-2 lg:col-span-4 text-center text-sm text-muted-foreground">
            Clique em <strong>Salvar nos 4 formatos</strong> e depois em <strong>Atualizar comparativo</strong> para ver as métricas.
          </Card>
        )}
      </div>

      {/* Tabela comparativa */}
      {cmp && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Tabela comparativa</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Formato</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Arquivo</th>
                  <th className="py-2 px-3">Tamanho (KB)</th>
                  <th className="py-2 px-3">Salvar (ms)</th>
                  <th className="py-2 px-3">Carregar (ms)</th>
                </tr>
              </thead>
              <tbody>
                {cmp.formats.map((f) => (
                  <tr key={f.format} className="border-b border-border/40">
                    <td className="py-2 px-3 font-semibold uppercase">{f.format}</td>
                    <td className="py-2 px-3">{f.kind}</td>
                    <td className="py-2 px-3 font-mono text-xs">{f.filename}</td>
                    <td className="py-2 px-3 font-mono">{f.size_kb.toFixed(2)}</td>
                    <td className="py-2 px-3 font-mono">{f.save_ms.toFixed(3)}</td>
                    <td className="py-2 px-3 font-mono">{f.load_ms.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Inspeção visual */}
      {cmp && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" /> Texto legível (dados.json)
            </h3>
            <pre className="text-xs font-mono bg-secondary/60 border rounded p-3 overflow-auto max-h-96 whitespace-pre">
{cmp.text_preview}
            </pre>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Ver dados.csv</summary>
              <pre className="text-xs font-mono bg-secondary/60 border rounded p-3 overflow-auto max-h-64 whitespace-pre mt-2">
{cmp.csv_preview}
              </pre>
            </details>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Binary className="h-4 w-4 text-purple-400" /> Binário (hexdump de dados.bin)
            </h3>
            <pre className="text-xs font-mono bg-black/60 border border-purple-900/40 rounded p-3 overflow-auto max-h-96 whitespace-pre text-purple-200">
{cmp.hex_preview}
            </pre>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Ver hexdump de dados.pkl (Pickle)</summary>
              <pre className="text-xs font-mono bg-black/60 border border-purple-900/40 rounded p-3 overflow-auto max-h-64 whitespace-pre text-purple-200 mt-2">
{cmp.pickle_hex_preview}
              </pre>
            </details>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono font-semibold">{v}</span>
    </div>
  );
}
