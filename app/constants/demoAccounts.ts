// app/constants/demoAccounts.ts
//
// Single source of truth for the two demo accounts + password shown on
// the login page — MockAuthRepository seeds its in-memory/localStorage
// accounts from this, and login.vue's hint text reads from the same
// place, so the two can never drift out of sync the way two separate
// hardcoded literals would.
export const DEMO_PASSWORD = 'numo123'

export const DEMO_ACCOUNTS = [
  { id: 'seed-malu', name: 'Malu', email: 'malu@numo.app' },
  { id: 'seed-gabi', name: 'Gabi', email: 'gabi@numo.app' }
] as const
