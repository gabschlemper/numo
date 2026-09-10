// app/composables/useReferenceOptions.ts
//
// Adapta as listas do usuário (objetos com id e uso) para o formato
// que os selects consomem: só os nomes.
//
// Existe para separar duas coisas que os componentes de Lançamentos
// estavam misturando ao importar `constants/referenceOptions`:
//
//   • categorias / contas / devedores → DADO do usuário, editável na
//     tela de Listas. Vem daqui, é reativo, e uma categoria criada
//     agora aparece no formulário sem recarregar nada. Antes eram
//     constantes: criar uma categoria em Listas não teria efeito
//     nenhum no formulário de lançamento, o que faria a tela nova
//     parecer quebrada.
//
//   • método / tipo / status / a reembolsar → uniões FECHADAS do
//     domínio. Continuam vindo de `constants/referenceOptions`,
//     importadas direto, porque não são dado e não mudam em runtime.
//
// Só de leitura de propósito: quem cria e renomeia é a tela de
// Listas, via `useReferenceLists`.
export function useReferenceOptions() {
  const { lists } = useReferenceLists()

  const categories = computed(() => lists.value.categories.map((item) => item.name))
  const accounts = computed(() => lists.value.accounts.map((item) => item.name))
  const debtors = computed(() => lists.value.debtors.map((item) => item.name))

  return { categories, accounts, debtors }
}
