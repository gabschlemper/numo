<!--
  AppNav.vue

  The navigation CONTENT — brand, links, account menu — with no
  opinion about the box it sits in. `AppSidebar` mounts it as a
  permanent column on `lg`+; `layouts/default.vue` mounts the same
  component inside a slideover on smaller screens.

  Extracted for exactly that reason: a phone can't afford a 224px
  column permanently docked next to a data table, but duplicating the
  nav into a second "mobile" component is how the two silently drift
  apart. One component, two containers.

  It emits `navigate` on every link so whichever container it's in can
  react — the drawer closes itself, the docked sidebar ignores it.
-->
<script setup lang="ts">
const { user, logout } = useAuth()
const toast = useToast()
const route = useRoute()

// The drawer container already renders "Numo" in its own header, so
// it turns this off rather than showing the word twice.
withDefaults(defineProps<{ brand?: boolean }>(), { brand: true })

const emit = defineEmits<{ navigate: [] }>()

const NAV_ITEMS = [
  { label: 'Lançamentos', to: '/transactions', icon: 'i-lucide-list' },
  { label: 'Resumo mensal', to: '/summary', icon: 'i-lucide-chart-column' },
  { label: 'Listas', to: '/lists', icon: 'i-lucide-tags' }
]

const initials = computed(() => {
  const name = user.value?.name ?? ''
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})

// Logout has exactly one effect no matter which page it's triggered
// from (end the session and go to /login) — there's no per-page
// decision to defer to a page component here, unlike the mutations in
// pages/transactions/index.vue. That's why this component performs it
// directly instead of emitting an event, the same narrow exception
// already used in ImportSpreadsheetModal for its own single piece of
// self-contained state.
async function handleLogout(): Promise<void> {
  try {
    await logout()
    await navigateTo('/login')
  } catch {
    toast.add({ title: 'Não foi possível sair. Tente novamente.', color: 'error' })
  }
}

// "Sair" gets `color: 'error'` on purpose — it's the one destructive,
// end-of-session action in this menu, and Nuxt UI's error color gives
// it a distinct red hover/icon tint instead of blending in with the
// "Perfil e configurações" item that now sits above it. The two are
// in separate groups so a divider falls between them: the gap is
// what stops a hurried click on "Configurações" from landing on
// "Sair".
//
// Configurações fica aqui, e não na navegação principal: a barra
// lateral é para os dados (Lançamentos, Resumo, Listas), e conta é
// do usuário, não do conteúdo — é onde as pessoas já procuram por
// convenção.
const accountMenuItems = computed(() => [
  [{
    label: 'Perfil e configurações',
    icon: 'i-lucide-settings',
    to: '/settings',
    onSelect: () => emit('navigate')
  }],
  [{ label: 'Sair', icon: 'i-lucide-log-out', color: 'error' as const, onSelect: handleLogout }]
])
</script>

<template>
  <div class="flex h-full flex-col justify-between gap-6">
    <div class="flex flex-col gap-6">
      <p v-if="brand" class="px-2 text-lg font-semibold">Numo</p>

      <nav class="flex flex-col gap-1" aria-label="Navegação principal">
        <UButton
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          :variant="route.path.startsWith(item.to) ? 'soft' : 'ghost'"
          :aria-current="route.path.startsWith(item.to) ? 'page' : undefined"
          color="neutral"
          block
          class="justify-start rounded-lg transition-colors duration-150 hover:bg-accented"
          @click="emit('navigate')"
        />
      </nav>
    </div>

    <!--
      `hover:bg-accented` (not the theme's default ghost hover) because
      this sits on `bg-elevated` already — the default hover surface is
      the same shade as this aside's own background, so it was
      rendering with basically no visible feedback. `data-[state=open]`
      keeps that same highlight while the menu is open, so the trigger
      doesn't look "dead" the moment you click it, and the chevron
      flips to signal there's a menu here at all (nothing did before).
    -->
    <UDropdownMenu :items="accountMenuItems" :popper="{ placement: 'top-start' }" :ui="{ content: 'w-52' }">
      <UButton
        color="neutral"
        variant="ghost"
        block
        class="group justify-start gap-2 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-accented data-[state=open]:bg-accented"
      >
        <UAvatar :text="initials" size="sm" class="transition-transform duration-150 group-hover:scale-105" />
        <span class="flex flex-col items-start overflow-hidden text-left">
          <span class="w-full truncate text-sm font-medium">{{ user?.name }}</span>
          <span class="w-full truncate text-xs text-muted">{{ user?.email }}</span>
        </span>
        <UIcon
          name="i-lucide-chevron-up"
          class="ms-auto size-4 shrink-0 text-muted transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </UButton>
    </UDropdownMenu>
  </div>
</template>
