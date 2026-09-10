<!--
  layouts/default.vue

  Wraps every authenticated page (today, just /transactions) with the
  navigation. Pages themselves stay unaware this exists — they render
  exactly as they did before there was a sidebar, just inside a
  narrower content area now.

  Two containers, one `AppNav`: a docked column from `lg` up, and a
  slideover behind a menu button below that. The mobile header is
  `sticky` rather than fixed so it never overlaps the page's own
  content, and the drawer closes itself on navigation (the
  `@navigate` handler) — leaving it open over the destination is the
  classic mobile-drawer annoyance.

  `h-dvh`, not `h-screen`: on mobile browsers `100vh` is the viewport
  *without* the address bar, so the last rows of the table end up
  underneath it and the page gains a phantom scroll. `dvh` tracks the
  chrome as it collapses.
-->
<script setup lang="ts">
const navOpen = ref(false)
</script>

<template>
  <div class="flex h-dvh">
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-20 flex shrink-0 items-center gap-2 border-b border-default bg-elevated px-3 py-2 lg:hidden"
      >
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          aria-label="Abrir menu de navegação"
          @click="navOpen = true"
        />
        <p class="text-base font-semibold">Numo</p>
      </header>

      <main class="min-w-0 flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>

    <USlideover v-model:open="navOpen" side="left" title="Numo" :ui="{ content: 'max-w-[17rem]' }">
      <template #body>
        <AppNav :brand="false" class="min-h-full" @navigate="navOpen = false" />
      </template>
    </USlideover>
  </div>
</template>
