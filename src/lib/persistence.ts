// Cliente para a API Python de persistência (FastAPI / Flask).
// Configure a URL via window.localStorage("persist_api") ou edite PERSIST_API.
import type { DataItem } from "@/lib/sorting/dataSources";

export const PERSIST_API =
  (typeof window !== "undefined" && window.localStorage.getItem("persist_api")) ||
  "http://localhost:8000";

export type CompareFormat = {
  format: "json" | "csv" | "pickle" | "struct";
  kind: "texto" | "binario";
  size_kb: number;
  save_ms: number;
  load_ms: number;
  filename: string;
};

export type CompareResponse = {
  formats: CompareFormat[];
  text_preview: string;     // trecho do dados.json
  csv_preview: string;      // trecho do dados.csv
  hex_preview: string;      // hexdump do dados.bin
  pickle_hex_preview: string; // hexdump do dados.pkl
};

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${await r.text()}`);
  return r.json();
}

export const persistApi = {
  async carregar(): Promise<DataItem[]> {
    return j(await fetch(`${PERSIST_API}/carregar`));
  },
  async salvar(items: DataItem[]): Promise<{ ok: true; count: number }> {
    return j(
      await fetch(`${PERSIST_API}/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }),
    );
  },
  async offline(): Promise<DataItem[]> {
    return j(await fetch(`${PERSIST_API}/offline`));
  },
  async comparar(): Promise<CompareResponse> {
    return j(await fetch(`${PERSIST_API}/comparar`));
  },
};
