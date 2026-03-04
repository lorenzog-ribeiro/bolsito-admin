// Types
export type UserStatus = "ativo" | "inativo" | "pendente"

export type SimulationType =
  | "emprestimo"
  | "investimento"
  | "consorcio"
  | "financiamento_imobiliario"
  | "previdencia"

export const simulationTypeLabels: Record<SimulationType, string> = {
  emprestimo: "Emprestimo",
  investimento: "Investimento",
  consorcio: "Consorcio",
  financiamento_imobiliario: "Financiamento Imobiliario",
  previdencia: "Previdencia",
}

export interface User {
  id: string
  nome: string
  email: string
  dataCadastro: string
  status: UserStatus
  totalSimulacoes: number
  ultimoAcesso: string
}

export interface SimulationBase {
  id: string
  userId: string
  tipo: SimulationType
  dataCriacao: string
}

export interface SimulacaoEmprestimo extends SimulationBase {
  tipo: "emprestimo"
  parametros: {
    valorSolicitado: number
    taxaJurosAnual: number
    taxaJurosMensal: number
    prazoMeses: number
    sistemaAmortizacao: "SAC" | "Price"
    valorParcela: number
    custoEfetivoTotal: number
  }
}

export interface SimulacaoInvestimento extends SimulationBase {
  tipo: "investimento"
  parametros: {
    valorInicial: number
    taxaRendimento: number
    prazoMeses: number
    aporteMensal: number
    tipoRendimento: "pre-fixado" | "pos-fixado" | "variavel"
    valorProjetado: number
  }
}

export interface SimulacaoConsorcio extends SimulationBase {
  tipo: "consorcio"
  parametros: {
    valorBem: number
    prazoGrupo: number
    taxaAdministracao: number
    parcelaMensal: number
    fundoReserva: number
  }
}

export interface SimulacaoFinanciamentoImobiliario extends SimulationBase {
  tipo: "financiamento_imobiliario"
  parametros: {
    valorImovel: number
    valorEntrada: number
    taxaJuros: number
    prazoMeses: number
    sistemaAmortizacao: "SAC" | "Price"
    seguroObrigatorio: number
    composicaoRenda: number
  }
}

export interface SimulacaoPrevidencia extends SimulationBase {
  tipo: "previdencia"
  parametros: {
    idadeAtual: number
    idadeAposentadoria: number
    contribuicaoMensal: number
    taxaRendimento: number
    rendaMensalEstimada: number
  }
}

export type Simulation =
  | SimulacaoEmprestimo
  | SimulacaoInvestimento
  | SimulacaoConsorcio
  | SimulacaoFinanciamentoImobiliario
  | SimulacaoPrevidencia

// Mock Users
export const users: User[] = [
  {
    id: "u1",
    nome: "Ana Clara Santos",
    email: "ana.santos@email.com",
    dataCadastro: "2025-01-15",
    status: "ativo",
    totalSimulacoes: 8,
    ultimoAcesso: "2026-03-03",
  },
  {
    id: "u2",
    nome: "Carlos Eduardo Lima",
    email: "carlos.lima@email.com",
    dataCadastro: "2025-03-22",
    status: "ativo",
    totalSimulacoes: 5,
    ultimoAcesso: "2026-03-02",
  },
  {
    id: "u3",
    nome: "Fernanda Oliveira",
    email: "fernanda.oliveira@email.com",
    dataCadastro: "2025-05-10",
    status: "inativo",
    totalSimulacoes: 3,
    ultimoAcesso: "2025-12-18",
  },
  {
    id: "u4",
    nome: "Roberto Mendes",
    email: "roberto.mendes@email.com",
    dataCadastro: "2025-06-01",
    status: "ativo",
    totalSimulacoes: 12,
    ultimoAcesso: "2026-03-04",
  },
  {
    id: "u5",
    nome: "Juliana Costa",
    email: "juliana.costa@email.com",
    dataCadastro: "2025-07-14",
    status: "pendente",
    totalSimulacoes: 1,
    ultimoAcesso: "2026-02-28",
  },
  {
    id: "u6",
    nome: "Marcos Pereira",
    email: "marcos.pereira@email.com",
    dataCadastro: "2025-08-20",
    status: "ativo",
    totalSimulacoes: 7,
    ultimoAcesso: "2026-03-01",
  },
  {
    id: "u7",
    nome: "Patricia Almeida",
    email: "patricia.almeida@email.com",
    dataCadastro: "2025-09-05",
    status: "ativo",
    totalSimulacoes: 4,
    ultimoAcesso: "2026-02-25",
  },
  {
    id: "u8",
    nome: "Lucas Ferreira",
    email: "lucas.ferreira@email.com",
    dataCadastro: "2025-10-12",
    status: "inativo",
    totalSimulacoes: 2,
    ultimoAcesso: "2025-11-30",
  },
  {
    id: "u9",
    nome: "Camila Rodrigues",
    email: "camila.rodrigues@email.com",
    dataCadastro: "2025-11-08",
    status: "ativo",
    totalSimulacoes: 6,
    ultimoAcesso: "2026-03-03",
  },
  {
    id: "u10",
    nome: "Thiago Nascimento",
    email: "thiago.nascimento@email.com",
    dataCadastro: "2025-12-01",
    status: "pendente",
    totalSimulacoes: 0,
    ultimoAcesso: "2026-01-15",
  },
  {
    id: "u11",
    nome: "Beatriz Souza",
    email: "beatriz.souza@email.com",
    dataCadastro: "2026-01-10",
    status: "ativo",
    totalSimulacoes: 9,
    ultimoAcesso: "2026-03-04",
  },
  {
    id: "u12",
    nome: "Diego Martins",
    email: "diego.martins@email.com",
    dataCadastro: "2026-01-25",
    status: "ativo",
    totalSimulacoes: 3,
    ultimoAcesso: "2026-03-02",
  },
]

// Mock Simulations
export const simulations: Simulation[] = [
  // Ana Clara Santos (u1)
  {
    id: "s1",
    userId: "u1",
    tipo: "emprestimo",
    dataCriacao: "2025-02-10",
    parametros: {
      valorSolicitado: 50000,
      taxaJurosAnual: 12.5,
      taxaJurosMensal: 0.99,
      prazoMeses: 36,
      sistemaAmortizacao: "Price",
      valorParcela: 1672.35,
      custoEfetivoTotal: 14.2,
    },
  },
  {
    id: "s2",
    userId: "u1",
    tipo: "investimento",
    dataCriacao: "2025-04-15",
    parametros: {
      valorInicial: 10000,
      taxaRendimento: 13.75,
      prazoMeses: 24,
      aporteMensal: 500,
      tipoRendimento: "pos-fixado",
      valorProjetado: 24850.0,
    },
  },
  {
    id: "s3",
    userId: "u1",
    tipo: "financiamento_imobiliario",
    dataCriacao: "2025-06-20",
    parametros: {
      valorImovel: 450000,
      valorEntrada: 90000,
      taxaJuros: 9.5,
      prazoMeses: 360,
      sistemaAmortizacao: "SAC",
      seguroObrigatorio: 125.0,
      composicaoRenda: 12000,
    },
  },
  {
    id: "s4",
    userId: "u1",
    tipo: "previdencia",
    dataCriacao: "2025-08-05",
    parametros: {
      idadeAtual: 32,
      idadeAposentadoria: 60,
      contribuicaoMensal: 800,
      taxaRendimento: 10.5,
      rendaMensalEstimada: 5200.0,
    },
  },
  // Carlos Eduardo Lima (u2)
  {
    id: "s5",
    userId: "u2",
    tipo: "emprestimo",
    dataCriacao: "2025-04-01",
    parametros: {
      valorSolicitado: 25000,
      taxaJurosAnual: 15.0,
      taxaJurosMensal: 1.17,
      prazoMeses: 24,
      sistemaAmortizacao: "SAC",
      valorParcela: 1208.33,
      custoEfetivoTotal: 16.8,
    },
  },
  {
    id: "s6",
    userId: "u2",
    tipo: "consorcio",
    dataCriacao: "2025-06-10",
    parametros: {
      valorBem: 80000,
      prazoGrupo: 72,
      taxaAdministracao: 15.0,
      parcelaMensal: 1277.78,
      fundoReserva: 2400.0,
    },
  },
  {
    id: "s7",
    userId: "u2",
    tipo: "investimento",
    dataCriacao: "2025-09-20",
    parametros: {
      valorInicial: 5000,
      taxaRendimento: 11.0,
      prazoMeses: 12,
      aporteMensal: 200,
      tipoRendimento: "pre-fixado",
      valorProjetado: 8025.0,
    },
  },
  // Fernanda Oliveira (u3)
  {
    id: "s8",
    userId: "u3",
    tipo: "emprestimo",
    dataCriacao: "2025-06-15",
    parametros: {
      valorSolicitado: 15000,
      taxaJurosAnual: 18.0,
      taxaJurosMensal: 1.39,
      prazoMeses: 12,
      sistemaAmortizacao: "Price",
      valorParcela: 1375.55,
      custoEfetivoTotal: 20.1,
    },
  },
  {
    id: "s9",
    userId: "u3",
    tipo: "previdencia",
    dataCriacao: "2025-08-25",
    parametros: {
      idadeAtual: 45,
      idadeAposentadoria: 65,
      contribuicaoMensal: 1500,
      taxaRendimento: 9.0,
      rendaMensalEstimada: 8700.0,
    },
  },
  // Roberto Mendes (u4)
  {
    id: "s10",
    userId: "u4",
    tipo: "financiamento_imobiliario",
    dataCriacao: "2025-07-01",
    parametros: {
      valorImovel: 750000,
      valorEntrada: 150000,
      taxaJuros: 8.9,
      prazoMeses: 300,
      sistemaAmortizacao: "Price",
      seguroObrigatorio: 210.0,
      composicaoRenda: 20000,
    },
  },
  {
    id: "s11",
    userId: "u4",
    tipo: "investimento",
    dataCriacao: "2025-08-15",
    parametros: {
      valorInicial: 100000,
      taxaRendimento: 14.0,
      prazoMeses: 60,
      aporteMensal: 2000,
      tipoRendimento: "variavel",
      valorProjetado: 295000.0,
    },
  },
  {
    id: "s12",
    userId: "u4",
    tipo: "emprestimo",
    dataCriacao: "2025-10-05",
    parametros: {
      valorSolicitado: 80000,
      taxaJurosAnual: 11.0,
      taxaJurosMensal: 0.87,
      prazoMeses: 48,
      sistemaAmortizacao: "SAC",
      valorParcela: 2393.33,
      custoEfetivoTotal: 12.5,
    },
  },
  {
    id: "s13",
    userId: "u4",
    tipo: "consorcio",
    dataCriacao: "2025-11-20",
    parametros: {
      valorBem: 200000,
      prazoGrupo: 120,
      taxaAdministracao: 12.0,
      parcelaMensal: 1866.67,
      fundoReserva: 6000.0,
    },
  },
  // Juliana Costa (u5)
  {
    id: "s14",
    userId: "u5",
    tipo: "investimento",
    dataCriacao: "2026-02-28",
    parametros: {
      valorInicial: 1000,
      taxaRendimento: 12.5,
      prazoMeses: 6,
      aporteMensal: 100,
      tipoRendimento: "pos-fixado",
      valorProjetado: 1680.0,
    },
  },
  // Marcos Pereira (u6)
  {
    id: "s15",
    userId: "u6",
    tipo: "emprestimo",
    dataCriacao: "2025-09-10",
    parametros: {
      valorSolicitado: 35000,
      taxaJurosAnual: 13.5,
      taxaJurosMensal: 1.06,
      prazoMeses: 36,
      sistemaAmortizacao: "Price",
      valorParcela: 1188.90,
      custoEfetivoTotal: 15.1,
    },
  },
  {
    id: "s16",
    userId: "u6",
    tipo: "financiamento_imobiliario",
    dataCriacao: "2025-11-01",
    parametros: {
      valorImovel: 320000,
      valorEntrada: 64000,
      taxaJuros: 10.2,
      prazoMeses: 240,
      sistemaAmortizacao: "SAC",
      seguroObrigatorio: 98.0,
      composicaoRenda: 9500,
    },
  },
  {
    id: "s17",
    userId: "u6",
    tipo: "previdencia",
    dataCriacao: "2026-01-15",
    parametros: {
      idadeAtual: 28,
      idadeAposentadoria: 55,
      contribuicaoMensal: 600,
      taxaRendimento: 11.0,
      rendaMensalEstimada: 4100.0,
    },
  },
  // Patricia Almeida (u7)
  {
    id: "s18",
    userId: "u7",
    tipo: "consorcio",
    dataCriacao: "2025-10-01",
    parametros: {
      valorBem: 55000,
      prazoGrupo: 60,
      taxaAdministracao: 14.0,
      parcelaMensal: 1045.0,
      fundoReserva: 1650.0,
    },
  },
  {
    id: "s19",
    userId: "u7",
    tipo: "investimento",
    dataCriacao: "2026-01-20",
    parametros: {
      valorInicial: 20000,
      taxaRendimento: 12.0,
      prazoMeses: 36,
      aporteMensal: 1000,
      tipoRendimento: "pre-fixado",
      valorProjetado: 68500.0,
    },
  },
  // Lucas Ferreira (u8)
  {
    id: "s20",
    userId: "u8",
    tipo: "emprestimo",
    dataCriacao: "2025-10-20",
    parametros: {
      valorSolicitado: 10000,
      taxaJurosAnual: 20.0,
      taxaJurosMensal: 1.53,
      prazoMeses: 12,
      sistemaAmortizacao: "Price",
      valorParcela: 926.35,
      custoEfetivoTotal: 22.5,
    },
  },
  // Camila Rodrigues (u9)
  {
    id: "s21",
    userId: "u9",
    tipo: "financiamento_imobiliario",
    dataCriacao: "2025-12-10",
    parametros: {
      valorImovel: 550000,
      valorEntrada: 110000,
      taxaJuros: 9.8,
      prazoMeses: 360,
      sistemaAmortizacao: "Price",
      seguroObrigatorio: 155.0,
      composicaoRenda: 15000,
    },
  },
  {
    id: "s22",
    userId: "u9",
    tipo: "investimento",
    dataCriacao: "2026-02-01",
    parametros: {
      valorInicial: 50000,
      taxaRendimento: 15.0,
      prazoMeses: 48,
      aporteMensal: 3000,
      tipoRendimento: "variavel",
      valorProjetado: 245000.0,
    },
  },
  {
    id: "s23",
    userId: "u9",
    tipo: "previdencia",
    dataCriacao: "2026-02-15",
    parametros: {
      idadeAtual: 35,
      idadeAposentadoria: 60,
      contribuicaoMensal: 1200,
      taxaRendimento: 10.0,
      rendaMensalEstimada: 6800.0,
    },
  },
  // Beatriz Souza (u11)
  {
    id: "s24",
    userId: "u11",
    tipo: "emprestimo",
    dataCriacao: "2026-01-15",
    parametros: {
      valorSolicitado: 40000,
      taxaJurosAnual: 14.0,
      taxaJurosMensal: 1.10,
      prazoMeses: 24,
      sistemaAmortizacao: "SAC",
      valorParcela: 2106.67,
      custoEfetivoTotal: 15.8,
    },
  },
  {
    id: "s25",
    userId: "u11",
    tipo: "consorcio",
    dataCriacao: "2026-02-10",
    parametros: {
      valorBem: 120000,
      prazoGrupo: 84,
      taxaAdministracao: 13.0,
      parcelaMensal: 1614.29,
      fundoReserva: 3600.0,
    },
  },
  // Diego Martins (u12)
  {
    id: "s26",
    userId: "u12",
    tipo: "investimento",
    dataCriacao: "2026-02-05",
    parametros: {
      valorInicial: 30000,
      taxaRendimento: 13.0,
      prazoMeses: 24,
      aporteMensal: 1500,
      tipoRendimento: "pos-fixado",
      valorProjetado: 72300.0,
    },
  },
  {
    id: "s27",
    userId: "u12",
    tipo: "emprestimo",
    dataCriacao: "2026-02-20",
    parametros: {
      valorSolicitado: 20000,
      taxaJurosAnual: 16.0,
      taxaJurosMensal: 1.24,
      prazoMeses: 18,
      sistemaAmortizacao: "Price",
      valorParcela: 1223.45,
      custoEfetivoTotal: 17.9,
    },
  },
]

// Helper functions
export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getSimulationsByUserId(userId: string): Simulation[] {
  return simulations.filter((s) => s.userId === userId)
}

export function getSimulationById(id: string): Simulation | undefined {
  return simulations.find((s) => s.id === id)
}

// Stats
export function getOverviewStats() {
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === "ativo").length
  const totalSimulations = simulations.length

  const byType: Record<SimulationType, number> = {
    emprestimo: 0,
    investimento: 0,
    consorcio: 0,
    financiamento_imobiliario: 0,
    previdencia: 0,
  }
  simulations.forEach((s) => {
    byType[s.tipo]++
  })

  const last30Days = simulations.filter((s) => {
    const d = new Date(s.dataCriacao)
    const now = new Date("2026-03-04")
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }).length

  const last7Days = simulations.filter((s) => {
    const d = new Date(s.dataCriacao)
    const now = new Date("2026-03-04")
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  }).length

  return {
    totalUsers,
    activeUsers,
    totalSimulations,
    byType,
    last30Days,
    last7Days,
  }
}

// Monthly activity data for charts
export function getMonthlyActivity() {
  const months = [
    "Jan 25", "Fev 25", "Mar 25", "Abr 25", "Mai 25", "Jun 25",
    "Jul 25", "Ago 25", "Set 25", "Out 25", "Nov 25", "Dez 25",
    "Jan 26", "Fev 26", "Mar 26",
  ]
  const monthMap: Record<string, string> = {
    "2025-01": "Jan 25", "2025-02": "Fev 25", "2025-03": "Mar 25",
    "2025-04": "Abr 25", "2025-05": "Mai 25", "2025-06": "Jun 25",
    "2025-07": "Jul 25", "2025-08": "Ago 25", "2025-09": "Set 25",
    "2025-10": "Out 25", "2025-11": "Nov 25", "2025-12": "Dez 25",
    "2026-01": "Jan 26", "2026-02": "Fev 26", "2026-03": "Mar 26",
  }

  const simCountByMonth: Record<string, number> = {}
  const userCountByMonth: Record<string, number> = {}
  months.forEach((m) => {
    simCountByMonth[m] = 0
    userCountByMonth[m] = 0
  })

  simulations.forEach((s) => {
    const key = s.dataCriacao.substring(0, 7)
    const label = monthMap[key]
    if (label) simCountByMonth[label]++
  })

  users.forEach((u) => {
    const key = u.dataCadastro.substring(0, 7)
    const label = monthMap[key]
    if (label) userCountByMonth[label]++
  })

  return months.map((m) => ({
    mes: m,
    simulacoes: simCountByMonth[m],
    usuarios: userCountByMonth[m],
  }))
}
