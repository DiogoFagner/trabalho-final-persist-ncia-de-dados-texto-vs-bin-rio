<div align="center">

# 🧪 SortLab

### Laboratório visual e interativo de **ordenação**, **busca** e **persistência de dados**

Aprenda algoritmos clássicos vendo cada comparação, troca e decisão acontecer passo a passo — com dados reais vindos de APIs públicas. Explore também a diferença prática entre persistência em **texto** e **binário** com um painel comparativo completo.

![Status](https://img.shields.io/badge/status-active-success)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-v1-FF4154)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![Lovable](https://img.shields.io/badge/Built_with-Lovable-7C3AED)

[🚀 Demo ao vivo](https://sorty-visuals.lovable.app) · [📖 Como rodar](#-como-rodar-o-projeto-localmente) · [🧩 Estrutura](#-estrutura-principal)

</div>

---

## ✨ Funcionalidades Principais

### Ordenação e Busca
- 🎬 **Visualização animada** de 6 algoritmos de ordenação clássicos — passo a passo, com controle de velocidade, pausa e avanço manual.
- 🆚 **Modo Comparar** — execute dois algoritmos lado a lado sobre o mesmo dataset e veja quem ganha em passos, comparações e trocas.
- 🔍 **Algoritmos de Busca Interativos** — Busca Linear e Busca Binária com destaque visual de `início`, `meio` e `fim`, e intervalos descartados esmaecidos.
- ⌨️ **Busca exata e parcial** (substring) — digite `pika` e encontre `pikachu`.
- 📊 **Gráficos comparativos** mostrando o crescimento do número de comparações conforme o tamanho da amostra (10, 50, 100, 500).
- 📚 **Pseudocódigo sincronizado** com a animação, destacando a linha em execução em tempo real.
- 🌐 **Dados reais de APIs públicas** — PokéAPI, REST Countries e uma amostra TMDB.
- 🧮 **Métricas em tempo real** — comparações, trocas, passos e tempo decorrido.

### Persistência de Dados (Texto vs Binário)
- 💾 **Salvar em 4 formatos simultâneos** — JSON, CSV, Pickle e Struct binário a partir de um único clique.
- 📊 **Painel comparativo** — visualize tamanho em KB e tempo de processamento (salvar/carregar) lado a lado para cada formato.
- 🧐 **Inspeção visual** — compare o conteúdo textual com um hexdump clássico (offset, hex, ASCII) do arquivo binário gerado.
- 🔌 **Modo Offline** — carregue os dados diretamente do arquivo local salvo em disco, sem depender da API externa.
- 🐍 **Backend Python com FastAPI** — endpoints RESTful para carregar, salvar, comparar e operar offline.

### Interface
- 🎨 **UI moderna** com tema escuro, componentes shadcn/ui e design responsivo.
- 📑 **Navegação por abas** — alterne facilmente entre Ordenação, Busca e Persistência.

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

## 🗃️ Persistência de Dados (Backend Python)

O backend em **FastAPI** gerencia o ciclo completo de persistência, comparando formatos de texto e binário:

| Endpoint | Método | Descrição |
| --- | --- | --- |
| `/carregar` | `GET` | Busca dados da PokéAPI e retorna ao frontend |
| `/salvar` | `POST` | Grava os dados em **JSON**, **CSV**, **Pickle** e **Struct** simultaneamente |
| `/offline` | `GET` | Lê os dados do arquivo `dados.json` salvo localmente |
| `/comparar` | `GET` | Retorna metadados: tamanho (KB), tempo de salvar/carregar (ms), previews de texto e hexdump |

Os arquivos são armazenados no diretório `./dados/` (criado automaticamente na primeira execução).

Arquivos principais do backend:

```
main.py              # Aplicação FastAPI com endpoints e lógica de persistência
requirements.txt     # Dependências Python
```

---

## 🧩 Estrutura principal

```
src/
├── components/
│   ├── SortingLab.tsx        # UI principal de ordenação
│   ├── SearchLab.tsx         # UI de busca interativa
│   ├── PersistenceLab.tsx      # Painel de persistência (salvar, comparar, offline)
│   └── CompareMode.tsx         # Modo comparar lado a lado
├── lib/
│   ├── sorting/
│   │   ├── algorithms.ts     # ⭐ Implementações manuais dos 6 algoritmos
│   │   ├── dataSources.ts    # Integração com PokéAPI, REST Countries e TMDB
│   │   ├── meta.ts           # Pseudocódigo + textos didáticos + Big O
│   │   └── types.ts          # Tipagens compartilhadas
│   └── persistence.ts        # Cliente HTTP para o backend Python
├── routes/
│   ├── __root.tsx            # Layout raiz (shell HTML/head)
│   └── index.tsx             # Página inicial que monta o laboratório
├── server.ts                 # Configuração do servidor (TanStack Start)
├── start.ts                  # Configuração de bootstrap
└── styles.css                # Tokens de design e Tailwind v4

main.py                       # Backend FastAPI (raiz do projeto)
requirements.txt              # Dependências Python (raiz do projeto)
```

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
| **Backend** | [Python 3.11+](https://www.python.org) + [FastAPI](https://fastapi.tiangolo.com) + [Uvicorn](https://www.uvicorn.org) |
| **HTTP Client (Python)** | [httpx](https://www.python-httpx.org) |
| **Plataforma** | [Lovable](https://lovable.dev) — desenvolvimento, preview e deploy |

> 💡 Os algoritmos foram **implementados manualmente do zero**, sem uso de `Array.prototype.sort()` ou qualquer biblioteca de ordenação/busca.

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org) 20+ **ou** [Bun](https://bun.sh) 1.1+
- [Python](https://www.python.org) 3.11+
- Git

### 1. Clone o repositório

```bash
git clone <URL_DO_SEU_REPO>
cd <pasta-do-projeto>
```

### 2. Instale e inicie o backend Python

```bash
# Crie um ambiente virtual (recomendado)
python -m venv .venv

# Ative o ambiente virtual
# macOS/Linux:
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor FastAPI
python main.py
```

O backend estará disponível em **http://localhost:8000**.
Documentação interativa (Swagger UI): **http://localhost:8000/docs**

### 3. Instale e inicie o frontend

Em outro terminal (na mesma pasta do projeto):

```bash
# Instale as dependências Node
bun install
# ou: npm install

# Inicie o servidor de desenvolvimento
bun run dev
# ou: npm run dev
```

A aplicação ficará disponível em **http://localhost:8080**.

### Scripts disponíveis (Frontend)

| Comando | Descrição |
| --- | --- |
| `bun run dev` | Inicia o servidor de desenvolvimento com HMR |
| `bun run build` | Gera build de produção |
| `bun run preview` | Pré-visualiza o build localmente |
| `bun run lint` | Roda o ESLint no projeto |
| `bun run format` | Formata o código com Prettier |

---

## 🚢 Deploy

Este projeto foi criado com [Lovable](https://lovable.dev). Para publicar o frontend, abra o projeto no Lovable e clique em **Share → Publish**.

> O backend Python é executado localmente. Para deploy em produção do backend, considere plataformas como [Render](https://render.com), [Railway](https://railway.app) ou [Fly.io](https://fly.io).

---

## 📄 Licença

Projeto educacional de uso livre. Sinta-se à vontade para estudar, adaptar e compartilhar.

<div align="center">

Feito com 💜 usando [Lovable](https://lovable.dev)

</div>
