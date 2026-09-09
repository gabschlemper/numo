<!--
  layouts/auth.vue

  Used by login.vue, signup.vue and forgot-password.vue
  (`definePageMeta({ layout: 'auth' })`) — no sidebar, since there's no
  session yet to show a logged-in nav for. Just centers whatever the
  page renders.
-->
<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <slot />
  </div>
</template>
