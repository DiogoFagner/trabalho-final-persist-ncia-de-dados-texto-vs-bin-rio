import { createFileRoute } from "@tanstack/react-router";
import { SortingLab } from "@/components/SortingLab";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SortLab — Visualizador de Algoritmos de Ordenação" },
      { name: "description", content: "Aprenda Bubble, Selection, Insertion, Merge, Quick e Heap Sort com animações, pseudocódigo e comparativos em tempo real." },
      { property: "og:title", content: "SortLab — Algoritmos de Ordenação" },
      { property: "og:description", content: "Laboratório visual interativo para algoritmos de ordenação com dados reais." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <SortingLab />
      <Toaster richColors position="top-right" />
    </>
  );
}
