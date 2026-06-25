<div align="center">

# 🧪 SortLab

### Laboratório visual e interativo de algoritmos de **ordenação** e **busca**

Aprenda algoritmos clássicos vendo cada comparação, troca e decisão acontecer passo a passo — com dados reais vindos de APIs públicas.

![Status](https://img.shields.io/badge/status-active-success)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-v1-FF4154)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![Lovable](https://img.shields.io/badge/Built_with-Lovable-7C3AED)

[🚀 Demo ao vivo](https://sorty-visuals.lovable.app) · [📖 Como rodar](#-como-rodar-o-projeto-localmente) · [🧩 Estrutura](#-estrutura-principal)

</div>

---

## ✨ Funcionalidades Principais

- 🎬 **Visualização animada** de 6 algoritmos de ordenação clássicos — passo a passo, com controle de velocidade, pausa e avanço manual.
- 🆚 **Modo Comparar** — execute dois algoritmos lado a lado sobre o mesmo dataset e veja quem ganha em passos, comparações e trocas.
- 🔍 **Algoritmos de Busca Interativos** — Busca Linear e Busca Binária com destaque visual de `início`, `meio` e `fim`, e intervalos descartados esmaecidos.
- ⌨️ **Busca exata e parcial** (substring) — digite `pika` e encontre `pikachu`.
- 📊 **Gráficos comparativos** mostrando o crescimento do número de comparações conforme o tamanho da amostra (10, 50, 100, 500).
- 📚 **Pseudocódigo sincronizado** com a animação, destacando a linha em execução em tempo real.
- 🌐 **Dados reais de APIs públicas** — PokéAPI, REST Countries e uma amostra TMDB.
- 🧮 **Métricas em tempo real** — comparações, trocas, passos e tempo decorrido.
- 🎨 **UI moderna** com tema escuro, componentes shadcn/ui e design responsivo.

---

## 🌐 APIs utilizadas

A aplicação permite ao usuário escolher entre **3 fontes de dados** reais:

| Fonte | Endpoint | Observação |
| --- | --- | --- |
| **PokéAPI** | `https://pokeapi.co/api/v2/pokemon` | API principal — pública, sem autenticação |
| **REST Countries** | `https://restcountries.com/v3.1/all` | Pública, sem autenticação |
| **TMDB (amostra estática)** | — | Amostra local de 500 filmes (evita exigir API key) |

> A **PokéAPI** é a fonte recomendada e padrão da aplicação por sua riqueza de campos numéricos e estabilidade pública.

### Campos ordenáveis por fonte

- **PokéAPI** → `weight` (Peso), `height` (Altura), `base_experience` (XP Base)
- **REST Countries** → `population` (População), `area` (Área em km²)
- **TMDB** → `vote_average` (Nota), `popularity` (Popularidade), `vote_count` (Nº de Votos)

O usuário também escolhe o **tamanho da amostra** (10, 50, 100 ou 500 itens).

A configuração das fontes e campos está em:

```
src/lib/sorting/dataSources.ts
```

---

## ⚙️ Algoritmos de ordenação

**Todos os algoritmos foram implementados manualmente, do zero, sem uso de `Array.prototype.sort()` ou qualquer biblioteca de ordenação.** Cada implementação grava passo a passo as comparações, trocas, estado do array e a linha ativa do pseudocódigo, permitindo a visualização animada.

Todos vivem no mesmo arquivo:

```
src/lib/sorting/algorithms.ts
```

| Algoritmo | Função exportada | Arquivo | Complexidade média |
| --- | --- | --- | --- |
| **Bubble Sort** | `bubbleSort`     | `src/lib/sorting/algorithms.ts` | O(n²) |
| **Selection Sort** | `selectionSort` | `src/lib/sorting/algorithms.ts` | O(n²) |
| **Insertion Sort** | `insertionSort` | `src/lib/sorting/algorithms.ts` | O(n²) |
| **Merge Sort**   | `mergeSort`      | `src/lib/sorting/algorithms.ts` | O(n log n) |
| **Quick Sort**   | `quickSort`      | `src/lib/sorting/algorithms.ts` | O(n log n) |
| **Heap Sort**    | `heapSort`       | `src/lib/sorting/algorithms.ts` | O(n log n) |

Metadados didáticos (pseudocódigo, parágrafos explicativos, Big O detalhado) de cada algoritmo:

```
src/lib/sorting/meta.ts
```

Tipos compartilhados (passos, métricas, chaves de algoritmo):

```
src/lib/sorting/types.ts
```

---

## 🧩 Estrutura principal

```
src/
├── components/
│   └── SortingLab.tsx        # UI principal: controles, visualizador, métricas, relatório
├── lib/sorting/
│   ├── algorithms.ts         # ⭐ Implementações manuais dos 6 algoritmos
│   ├── dataSources.ts        # Integração com PokéAPI, REST Countries e TMDB
│   ├── meta.ts               # Pseudocódigo + textos didáticos + Big O
│   └── types.ts              # Tipagens compartilhadas
└── routes/
    └── index.tsx             # Rota raiz que monta o SortingLab
```

---

## 🚀 Como executar

```bash
bun install
bun run dev
```

A aplicação abrirá em `http://localhost:5173`.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Stack |
| --- | --- |
| **Frontend** | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/) (strict) |
| **Framework** | [TanStack Start v1](https://tanstack.com/start) (SSR + file-based routing) |
| **Build** | [Vite 7](https://vitejs.dev) |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com) + design tokens semânticos |
| **Componentes** | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| **Gráficos** | [Recharts](https://recharts.org) |
| **Backend (opcional)** | [Lovable Cloud](https://docs.lovable.dev/features/cloud) (Supabase gerenciado) |
| **Plataforma** | [Lovable](https://lovable.dev) — desenvolvimento, preview e deploy |

> 💡 Os algoritmos foram **implementados manualmente do zero**, sem uso de `Array.prototype.sort()` ou qualquer biblioteca de ordenação/busca.

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org) 20+ **ou** [Bun](https://bun.sh) 1.1+
- Git

### Passo a passo

```bash
# 1. Clone o repositório
git clone <URL_DO_SEU_REPO>
cd <pasta-do-projeto>

# 2. Instale as dependências
bun install
# ou: npm install

# 3. Inicie o servidor de desenvolvimento
bun run dev
# ou: npm run dev
```

A aplicação ficará disponível em **http://localhost:8080**.

### Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `bun run dev` | Inicia o servidor de desenvolvimento com HMR |
| `bun run build` | Gera build de produção |
| `bun run preview` | Pré-visualiza o build localmente |
| `bun run lint` | Roda o ESLint no projeto |
| `bun run format` | Formata o código com Prettier |

---

## 🚢 Deploy

Este projeto foi criado com [Lovable](https://lovable.dev). Para publicar, abra o projeto no Lovable e clique em **Share → Publish**.

---

## 📄 Licença

Projeto educacional de uso livre. Sinta-se à vontade para estudar, adaptar e compartilhar.

<div align="center">

Feito com 💜 usando [Lovable](https://lovable.dev)

</div>
