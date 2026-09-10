<!--
  AppearanceSettings.vue

  Tema: claro, escuro ou o do sistema.

  "Sistema" é uma opção de verdade, não um rótulo para o padrão: é o
  único valor que continua acompanhando o usuário quando ele troca o
  tema do aparelho ao anoitecer. Um par claro/escuro sem ela obriga
  a escolher um lado para sempre.

  Este é o único componente do app que age direto em vez de emitir:
  não existe decisão de página a delegar — a preferência é do
  navegador (o `useColorMode` do Nuxt persiste sozinho) e não passa
  por repositório nenhum. É a mesma exceção estreita já usada em
  `AppNav` para o logout.
-->
<script setup lang="ts">
const colorMode = useColorMode()

const OPTIONS = [
  { value: 'light', label: 'Claro', icon: 'i-lucide-sun' },
  { value: 'dark', label: 'Escuro', icon: 'i-lucide-moon' },
  { value: 'system', label: 'Sistema', icon: 'i-lucide-monitor' }
] as const
</script>

<template>
  <section class="flex flex-col gap-4 rounded-[--ui-radius] border border-default bg-default p-4">
    <div>
      <h2 class="font-medium">Aparência</h2>
      <p class="text-sm text-muted">Vale só neste navegador.</p>
    </div>

    <!--
      `role="radiogroup"` porque é exatamente isso: uma escolha entre
      opções mutuamente exclusivas. Três botões soltos seriam
      anunciados como três ações independentes, sem dizer qual está
      ativa.
    -->
    <div role="radiogroup" aria-label="Tema" class="flex flex-wrap gap-2">
      <UButton
        v-for="option in OPTIONS"
        :key="option.value"
        role="radio"
        :aria-checked="colorMode.preference === option.value"
        :icon="option.icon"
        :label="option.label"
        color="neutral"
        :variant="colorMode.preference === option.value ? 'soft' : 'outline'"
        @click="colorMode.preference = option.value"
      />
    </div>
  </section>
</template>
