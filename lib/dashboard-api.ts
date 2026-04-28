import { apiFetch } from "./api"

// Todos os tipos de simuladores (para estatisticas)
export const SIMULATOR_TYPES = [
  "AMORTIZACAO",
  "APOSENTADORIA",
  "COMBUSTIVEL",
  "CONTAS_DIGITAIS",
  "EMPRESTIMO",
  "FINANCIAMENTO_IMOVEL",
  "FINANCIAMENTO_VEICULOS",
  "INVESTIMENTOS",
  "JUROS_COMPOSTOS",
  "RENDA_FIXA",
  "COMPARADOR_ASSINATURA_CARRO",
  "TAXA_MAQUININHA",
  "COMPARADOR_MAQUININHA",
] as const

// Apenas simuladores que possuem parametros configuráveis no banco
export const SIMULATOR_TYPES_WITH_PARAMS = [
  "EMPRESTIMO",
  "FINANCIAMENTO_IMOVEL",
  "FINANCIAMENTO_VEICULOS",
  "TAXA_MAQUININHA",
  "COMPARADOR_MAQUININHA",
  "APOSENTADORIA",
  "AMORTIZACAO",
] as const

export const SIMULATOR_LABELS: Record<string, string> = {
  AMORTIZACAO: "Amortização",
  APOSENTADORIA: "Aposentadoria",
  COMBUSTIVEL: "Combustível",
  CONTAS_DIGITAIS: "Contas Digitais",
  EMPRESTIMO: "Empréstimo",
  FINANCIAMENTO_IMOVEL: "Financiamento Imóvel",
  FINANCIAMENTO_VEICULOS: "Financiamento Veículos",
  INVESTIMENTOS: "Investimentos",
  JUROS_COMPOSTOS: "Juros Compostos",
  RENDA_FIXA: "Renda Fixa",
  COMPARADOR_ASSINATURA_CARRO: "Comparador Assinatura Carro",
  TAXA_MAQUININHA: "Taxa Maquininha",
  COMPARADOR_MAQUININHA: "Comparador Maquininha",
}

export const RANKING_TYPES = [
  { id: "card-machines", label: "Máquinas de Cartão" },
  { id: "digital-accounts", label: "Contas Digitais" },
  { id: "insurance", label: "Seguros" },
  { id: "car-subscription", label: "Assinatura de Carros" },
  { id: "toll-passes", label: "Pedágios" },
] as const

export interface SyncResult {
  postsUpserted: number
  postsSoftDeleted: number
  durationMs: number
}

export interface SyncLog {
  id: number
  startedAt: string
  finishedAt: string | null
  status: "running" | "success" | "failed"
  postsUpserted: number
  postsSoftDeleted: number
  error: string | null
}

export interface PlatformSimulation {
  id: number
  simulatorType: string
  dataCriacao: string
  nome?: string
  email?: string
  inputData: Record<string, unknown>
  outputData: Record<string, unknown>
}

export interface SimulationsListResponse {
  simulations: PlatformSimulation[]
  total: number
}

export interface ImageItem {
  id?: number
  file_path: string
  full_url: string
  source: string
}

export interface OptInSimulationExport {
  id: number
  nome: string
  email: string
  simulatorType: string
  dataCriacao: string
  emailOptInAt: string
}

export function createDashboardApi(token: string) {
  return {
    simulatorParams: (type: string) =>
      apiFetch<unknown>(`/dashboard/simulators/${type}/params`, { token }),

    updateSimulatorParam: (
      type: string,
      id: string,
      body: Record<string, unknown>
    ) =>
      apiFetch<unknown>(
        `/dashboard/simulators/${type}/params/${id}`,
        { method: "PATCH", body: JSON.stringify(body), token }
      ),

    rankingParams: (type: string) =>
      apiFetch<unknown>(`/dashboard/rankings/${type}/params`, { token }),

    updateRankingParam: (
      type: string,
      id: string,
      body: Record<string, unknown>
    ) =>
      apiFetch<unknown>(
        `/dashboard/rankings/${type}/params/${id}`,
        { method: "PATCH", body: JSON.stringify(body), token }
      ),

    simulationsStats: (params?: { startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams()
      if (params?.startDate) q.set("startDate", params.startDate)
      if (params?.endDate) q.set("endDate", params.endDate)
      const query = q.toString()
      return apiFetch<{
        bySimulator: { simulatorType: string; count: number }[]
        byDay: { date: string; count: number }[]
        byWeek: { weekStart: string; count: number }[]
        byMonth: { month: string; count: number }[]
        total: number
      }>(`/dashboard/simulations/stats${query ? `?${query}` : ""}`, { token })
    },

    listSimulations: (params?: {
      simulatorType?: string
      limit?: number
      offset?: number
    }) => {
      const q = new URLSearchParams()
      if (params?.simulatorType) q.set("simulatorType", params.simulatorType)
      if (params?.limit != null) q.set("limit", String(params.limit))
      if (params?.offset != null) q.set("offset", String(params.offset))
      const query = q.toString()
      return apiFetch<SimulationsListResponse>(
        `/dashboard/simulations/list${query ? `?${query}` : ""}`,
        { token }
      )
    },

    simulationById: (id: number) =>
      apiFetch<PlatformSimulation>(`/dashboard/simulations/${id}`, { token }),

    exportOptInSimulations: (params: {
      startDate: string
      endDate: string
    }) => {
      const q = new URLSearchParams()
      q.set("startDate", params.startDate)
      q.set("endDate", params.endDate)
      return apiFetch<OptInSimulationExport[]>(
        `/dashboard/simulations/export-opt-in?${q.toString()}`,
        { token }
      )
    },

    images: () =>
      apiFetch<ImageItem[]>("/dashboard/images", { token }),

    triggerPostSync: () =>
      apiFetch<SyncResult>("/dashboard/sync/posts", { method: "POST", token }),

    syncHistory: () =>
      apiFetch<SyncLog[]>("/dashboard/sync/posts/status", { token }),

    // Blog Tracking Stats
    blogTrackingStats: (params?: { startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams()
      if (params?.startDate) q.set("startDate", params.startDate)
      if (params?.endDate) q.set("endDate", params.endDate)
      const query = q.toString()
      return apiFetch<BlogTrackingStats>(
        `/tracking/stats${query ? `?${query}` : ""}`,
        { token }
      )
    },
  }
}
export interface BlogTrackingStats {
  totalPageViews: number
  totalSessions: number
  avgSessionDuration: number
  topPages: { path: string; views: number; avgTime: number }[]
  topArticles: { slug: string; title: string; views: number }[]
  pageViewsByDay: { date: string; count: number }[]
  eventsByType: Record<string, number>
  simulatorUsage: { type: string; starts: number; completions: number }[]
  searchQueries: { query: string; count: number }[]
  recentEvents: {
    type: string
    timestamp: string
    path: string
    title?: string
    duration?: number
    metadata?: Record<string, unknown>
  }[]
}
