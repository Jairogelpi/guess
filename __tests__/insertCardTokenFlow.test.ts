import fs from 'node:fs'
import path from 'node:path'

const gameActionSource = fs.readFileSync(
  path.join(__dirname, '..', 'supabase', 'functions', 'game-action', 'index.ts'),
  'utf8',
)

const migrationSource = fs.readFileSync(
  path.join(__dirname, '..', 'supabase', 'migrations', '20260402183000_fix_generation_token_trigger.sql'),
  'utf8',
)

test('insert_card maps token exhaustion to a clean domain error', () => {
  expect(gameActionSource).toContain("error.message.includes('NO_TOKENS_LEFT')")
  expect(gameActionSource).toContain("errorResponse('NO_TOKENS_LEFT'")
})

test('generation token trigger no longer charges the first generated card in a round', () => {
  expect(migrationSource).toContain('count(*)')
  expect(migrationSource).toContain('v_existing_generated_cards')
  expect(migrationSource).toContain('IF v_existing_generated_cards > 0')
})
