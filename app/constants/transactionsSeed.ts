// app/constants/transactionsSeed.ts
//
// Fixture data for `MockTransactionRepository`. Isolated in its own
// file so the adapter itself stays readable, and so this is the one
// place to touch when the demo data needs to change.
//
// Deliberately ~50 rows spanning three billing months (2026-09,
// 2026-10, 2026-11) so there's enough volume to actually exercise
// filters, search, sorting, bulk selection and pagination during
// usability testing — a handful of rows doesn't surface real UX
// problems. The set also demonstrates every business-rule case side by
// side (see comments inline): an expense with a debtor ("I owe this to
// them"), income with a debtor ("they owe me"), a reimbursable expense
// ("I fronted the money"), multi-installment purchases where `date`
// stays fixed while `billingMonth` advances, and the "Terceiros" /
// "Balanço caixa" categories the real spreadsheet still carries as
// open questions (see estado-atual-planilhas.md).
import type { Transaction } from '~/types/transaction'

export const TRANSACTIONS_SEED: Transaction[] = [
  // --- Receitas fixas do mês ---
  { id: 'seed-1', date: '2026-09-01', description: 'Salário Malu', category: 'Receita', account: 'Inter Malu', method: 'Crédito', amount: 7125.70, type: 'Receita', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-2', date: '2026-09-01', description: 'Salário Gabi', category: 'Receita', account: 'Nubank Gabi', method: 'Crédito', amount: 6322.00, type: 'Receita', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-3', date: '2026-09-01', description: 'Vale Alimentação', category: 'Swile', account: 'Swile', method: 'VA', amount: 1000.00, type: 'Receita', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-4', date: '2026-09-01', description: 'Vale Transporte', category: 'Swile', account: 'Swile', method: 'VR', amount: 700.00, type: 'Receita', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },

  // --- Gastos fixos do mês ---
  { id: 'seed-5', date: '2026-09-01', description: 'Aluguel', category: 'Casa', account: 'Inter Malu', method: 'Débito', amount: 2400.00, type: 'Fixo', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-6', date: '2026-09-05', description: 'Internet', category: 'Casa', account: 'Nubank Gabi', method: 'Débito', amount: 129.90, type: 'Fixo', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-7', date: '2026-09-01', description: 'Spotify', category: 'Assinaturas', account: 'Nubank Gabi', method: 'Débito', amount: 29.24, type: 'Fixo', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-8', date: '2026-09-01', description: 'Seguro Carro', category: 'Carro', account: 'Nubank Gabi', method: 'Débito', amount: 150.00, type: 'Fixo', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-9', date: '2026-09-01', description: 'Parcela Polo', category: 'Carro', account: 'Nubank Gabi', method: 'Débito', amount: 730.00, type: 'Fixo', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-10', date: '2026-09-05', description: 'Telefone', category: 'Telefone', account: 'Inter Malu', method: 'Débito', amount: 79.90, type: 'Fixo', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-11', date: '2026-09-01', description: 'Plano de saúde do pet', category: 'Pet', account: 'Nubank Família', method: 'Débito', amount: 89.00, type: 'Fixo', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },

  // --- Gastos variáveis do mês ---
  { id: 'seed-12', date: '2026-09-03', description: 'Supermercado Koch', category: 'Supermercado', account: 'Nubank Gabi', method: 'Crédito', amount: 342.87, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-13', date: '2026-09-04', description: 'Farmácia Ritorna', category: 'Farmácia', account: 'Nubank Família', method: 'Débito', amount: 68.40, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-14', date: '2026-09-05', description: 'Posto Ipiranga', category: 'Gasolina', account: 'Nubank Gabi', method: 'Crédito', amount: 220.00, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-15', date: '2026-09-06', description: 'Uber', category: 'Transporte', account: 'Swile', method: 'VR', amount: 28.50, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-16', date: '2026-09-07', description: 'Ifood', category: 'Delivery', account: 'Nubank Gabi', method: 'PIX', amount: 54.90, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-17', date: '2026-09-08', description: 'Cinema', category: 'Roles', account: 'Nubank Gabi', method: 'Débito', amount: 62.00, type: 'Variável', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-18', date: '2026-09-11', description: 'Transferência entre contas', category: 'Transferência', account: 'Inter Malu', method: 'PIX', amount: 500.00, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-19', date: '2026-09-10', description: 'Investimento (Caixinha)', category: 'Investimento', account: 'Nubank Gabi', method: 'Investimento', amount: 1200.00, type: 'Investimento', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-20', date: '2026-09-12', description: 'Angeloni', category: 'Alimentação', account: 'Swile', method: 'VA', amount: 85.30, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-21', date: '2026-09-13', description: 'Restaurante', category: 'Restaurantes', account: 'Swile', method: 'VA', amount: 46.60, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-22', date: '2026-09-14', description: 'Wellhub', category: 'Saúde', account: 'Nubank Gabi', method: 'Crédito', amount: 59.99, type: 'Variável', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-23', date: '2026-09-16', description: 'Show — ingressos', category: 'Roles', account: 'Nubank Gabi', method: 'Débito', amount: 180.00, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-24', date: '2026-09-18', description: 'Multa de trânsito', category: 'Tarifas', account: 'Nubank Gabi', method: 'Débito', amount: 130.16, type: 'Variável', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-25', date: '2026-09-19', description: 'Ração e areia', category: 'Pet', account: 'Nubank Gabi', method: 'Débito', amount: 145.00, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-26', date: '2026-09-20', description: 'Curso online', category: 'Estudos', account: 'Inter Malu', method: 'Crédito', amount: 97.00, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-27', date: '2026-09-21', description: 'IPVA', category: 'Impostos', account: 'Inter Malu', method: 'Débito', amount: 340.00, type: 'Fixo', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-28', date: '2026-09-22', description: 'Reforma banheiro', category: 'Reforma Lavandeira', account: 'Nubank Gabi', method: 'PIX', amount: 480.00, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-29', date: '2026-09-29', description: 'Farmácia São João', category: 'Farmácia', account: 'Nubank Gabi', method: 'Débito', amount: 57.92, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-30', date: '2026-09-30', description: 'Balanço', category: 'Balanço caixa', account: 'Nubank Gabi', method: 'PIX', amount: 87.83, type: 'Receita', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },

  // --- Os três casos de negócio de Devedor/A reembolsar lado a lado ---
  // 1) Despesa com Devedor preenchido = "eu devo isso à Julia" (ela adiantou o presente).
  { id: 'seed-31', date: '2026-09-15', description: 'Presente de aniversário', category: 'Presentes', account: 'Nubank Gabi', method: 'PIX', amount: 120.00, type: 'Variável', installment: null, status: 'Pago', debtor: 'Julia', reimbursable: 'Não', billingMonth: '2026-09' },
  // 2) Receita com Devedor preenchido = "a Zu me deve" (ela ainda não pagou de volta).
  { id: 'seed-32', date: '2026-09-23', description: 'Corte de cabelo', category: 'Receita', account: 'Nubank Gabi', method: 'PIX', amount: 60.00, type: 'Receita', installment: null, status: 'Pendente', debtor: 'Zu', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-33', date: '2026-09-23', description: 'Cachaça', category: 'Receita', account: 'Nubank Gabi', method: 'PIX', amount: 10.00, type: 'Receita', installment: null, status: 'Pendente', debtor: 'Zu', reimbursable: 'Não', billingMonth: '2026-09' },
  // 3) Despesa com "A reembolsar" = Sim = "eu adiantei pro Pedro e serei reembolsada por isso".
  { id: 'seed-34', date: '2026-09-24', description: 'Passagem — adiantei pro Pedro', category: 'Viagem', account: 'Nubank Gabi', method: 'PIX', amount: 480.00, type: 'Variável', installment: null, status: 'Pago', debtor: 'Pedro', reimbursable: 'Sim', billingMonth: '2026-09' },

  // --- Parcelamentos: `date` fica fixa na compra original, só `billingMonth` avança ---
  { id: 'seed-35', date: '2026-07-30', description: 'Notebook — parcela 3/10', category: 'Casa', account: 'Nubank Gabi', method: 'Crédito', amount: 245.00, type: 'Variável', installment: '3/10', status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-36', date: '2026-07-30', description: 'Notebook — parcela 4/10', category: 'Casa', account: 'Nubank Gabi', method: 'Crédito', amount: 245.00, type: 'Variável', installment: '4/10', status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-10' },
  { id: 'seed-37', date: '2026-07-30', description: 'Notebook — parcela 5/10', category: 'Casa', account: 'Nubank Gabi', method: 'Crédito', amount: 245.00, type: 'Variável', installment: '5/10', status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-11' },
  { id: 'seed-38', date: '2026-09-17', description: 'Renner — parcela 1/3', category: 'Roupas', account: 'Nubank Gabi', method: 'Crédito', amount: 210.00, type: 'Variável', installment: '1/3', status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-39', date: '2026-09-17', description: 'Renner — parcela 2/3', category: 'Roupas', account: 'Nubank Gabi', method: 'Crédito', amount: 210.00, type: 'Variável', installment: '2/3', status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-10' },
  { id: 'seed-40', date: '2026-09-17', description: 'Renner — parcela 3/3', category: 'Roupas', account: 'Nubank Gabi', method: 'Crédito', amount: 210.00, type: 'Variável', installment: '3/3', status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-11' },
  { id: 'seed-41', date: '2026-09-25', description: 'Passagens de viagem — parcela 1/2', category: 'Viagem', account: 'Nubank Gabi', method: 'Crédito', amount: 890.00, type: 'Variável', installment: '1/2', status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },
  { id: 'seed-42', date: '2026-09-25', description: 'Passagens de viagem — parcela 2/2', category: 'Viagem', account: 'Nubank Gabi', method: 'Crédito', amount: 890.00, type: 'Variável', installment: '2/2', status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-10' },
  // "Terceiros" — categoria legada que o resumo aponta como mal utilizada (ver seção 3.2); mantida
  // aqui como exemplo real de dado antigo que a UI ainda precisa saber exibir corretamente.
  { id: 'seed-43', date: '2025-12-01', description: 'Grupo Casas Bahia S.A. — parcela 9/12', category: 'Terceiros', account: 'Inter Malu', method: 'Crédito', amount: 324.65, type: 'Variável', installment: '9/12', status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-09' },

  // --- Próximo mês (para poder testar navegação/consistência entre meses) ---
  { id: 'seed-44', date: '2026-10-01', description: 'Salário Malu', category: 'Receita', account: 'Inter Malu', method: 'Crédito', amount: 7125.70, type: 'Receita', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-10' },
  { id: 'seed-45', date: '2026-10-01', description: 'Salário Gabi', category: 'Receita', account: 'Nubank Gabi', method: 'Crédito', amount: 6322.00, type: 'Receita', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-10' },
  { id: 'seed-46', date: '2026-10-01', description: 'Aluguel', category: 'Casa', account: 'Inter Malu', method: 'Débito', amount: 2400.00, type: 'Fixo', installment: null, status: 'Pendente', debtor: '', reimbursable: 'Não', billingMonth: '2026-10' },
  { id: 'seed-47', date: '2026-10-02', description: 'Supermercado Fort', category: 'Supermercado', account: 'Nubank Família', method: 'Débito', amount: 389.42, type: 'Variável', installment: null, status: 'Pago', debtor: '', reimbursable: 'Não', billingMonth: '2026-10' }
]
