<!--
  AppSidebar.vue

  The persistent lateral navigation `layouts/default.vue` wraps every
  authenticated page in. Its only two concerns: which page you're on
  (nav links) and who's logged in (the avatar menu at the bottom) —
  nothing here decides what a nav destination does once you're there,
  same separation as the rest of the component layer.
-->
<script setup lang="ts">
const { user, logout } = useAuth()
const toast = useToast()
const route = useRoute()

const NAV_ITEMS = [
  { label: 'Lançamentos', to: '/transactions', icon: 'i-lucide-list' }
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
// it a distinct red hover/icon tint instead of blending in with a
// future "Perfil" or "Configurações" item that would sit here too.
const accountMenuItems = computed(() => [
  [{ label: 'Sair', icon: 'i-lucide-log-out', color: 'error' as const, onSelect: handleLogout }]
])
</script>

<template>
  <aside class="flex h-full w-56 shrink-0 flex-col justify-between border-r border-default bg-elevated p-4">
    <div class="flex flex-col gap-6">
      <p class="px-2 text-lg font-semibold">Numo</p>

      <nav class="flex flex-col gap-1">
        <UButton
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          :variant="route.path.startsWith(item.to) ? 'soft' : 'ghost'"
          color="neutral"
          block
          class="justify-start rounded-lg transition-colors duration-150 hover:bg-accented"
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
  </aside>
</template>
