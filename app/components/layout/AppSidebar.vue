<!--
  AppSidebar.vue

  The docked container for `AppNav`, shown from `lg` up only. Below
  that the same nav is reached through the header's menu button (see
  `layouts/default.vue`) — a fixed 224px column is a quarter of a
  tablet and half a phone, spent on a single nav link.
-->
<template>
  <aside class="hidden h-full w-56 shrink-0 flex-col border-r border-default bg-elevated p-4 lg:flex">
    <AppNav />
  </aside>
</template>
