<!--
  layouts/default.vue

  Wraps every authenticated page (today, just /transactions) with the
  persistent lateral navigation. Pages themselves stay unaware this
  exists — they render exactly as they did before there was a
  sidebar, just inside a narrower content area now.
-->
<template>
  <div class="flex h-screen">
    <AppSidebar />
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
