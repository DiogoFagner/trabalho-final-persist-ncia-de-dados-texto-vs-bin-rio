// Data source fetchers. Returns { label, value }[] for sorting.
export type DataItem = { label: string; value: number; image?: string };
export type SourceKey = "pokemon" | "countries" | "tmdb";

export type FieldOption = { key: string; label: string };

export const SOURCES: Record<SourceKey, { name: string; fields: FieldOption[] }> = {
  pokemon: {
    name: "PokéAPI",
    fields: [
      { key: "weight", label: "Peso" },
      { key: "height", label: "Altura" },
      { key: "base_experience", label: "XP Base" },
    ],
  },
  countries: {
    name: "REST Countries",
    fields: [
      { key: "population", label: "População" },
      { key: "area", label: "Área (km²)" },
    ],
  },
  tmdb: {
    name: "TMDB (amostra)",
    fields: [
      { key: "vote_average", label: "Nota" },
      { key: "popularity", label: "Popularidade" },
      { key: "vote_count", label: "Nº de Votos" },
    ],
  },
};

async function fetchPokemon(field: string, n: number): Promise<DataItem[]> {
  const list = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${n}`).then((r) => r.json());
  const details = await Promise.all(
    list.results.map((p: { url: string }) => fetch(p.url).then((r) => r.json())),
  );
  return details.map((p) => ({
    label: p.name,
    value: Number(p[field]) || 0,
    image: p.sprites?.front_default,
  }));
}

async function fetchCountries(field: string, n: number): Promise<DataItem[]> {
  const all = await fetch(
    `https://restcountries.com/v3.1/all?fields=name,population,area,flags`,
  ).then((r) => r.json());
  return all.slice(0, n).map((c: { name: { common: string }; population: number; area: number; flags?: { png?: string } }) => ({
    label: c.name.common,
    value: Number((c as Record<string, unknown>)[field]) || 0,
    image: c.flags?.png,
  }));
}

// TMDB requires an API key — usamos amostra estática rica para evitar exigir chave.
const TMDB_SAMPLE: { title: string; vote_average: number; popularity: number; vote_count: number; poster: string }[] = Array.from({ length: 500 }, (_, i) => ({
  title: `Filme #${i + 1}`,
  vote_average: +(Math.random() * 9 + 1).toFixed(1),
  popularity: +(Math.random() * 1000).toFixed(1),
  vote_count: Math.floor(Math.random() * 50000),
  poster: "",
}));

async function fetchTmdb(field: string, n: number): Promise<DataItem[]> {
  return TMDB_SAMPLE.slice(0, n).map((m) => ({
    label: m.title,
    value: Number((m as Record<string, unknown>)[field]) || 0,
  }));
}

export async function fetchData(source: SourceKey, field: string, n: number): Promise<DataItem[]> {
  if (source === "pokemon") return fetchPokemon(field, n);
  if (source === "countries") return fetchCountries(field, n);
  return fetchTmdb(field, n);
}
