import { readFileSync } from 'fs'
import { resolve } from 'path'

import type { Database, MatchmakingQueueStatus, MatchmakingQueueTicket } from '../src/types/game'

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260405100000_quick_matchmaking_schema.sql')

function expectSql(migration: string, pattern: RegExp) {
  expect(pattern.test(migration)).toBe(true)
}

function expectConstraint(migration: string, name: string, fragments: string[]) {
  const constraintPattern = new RegExp(
    `${name}[\\s\\S]*?check \\([\\s\\S]*?${fragments.map((fragment) => fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\S]*?')}[\\s\\S]*?\\)`,
  )
  expectSql(migration, constraintPattern)
}

function expectStatement(migration: string, pattern: RegExp) {
  expectSql(migration, pattern)
}

type ExpectExactStatuses<T extends readonly string[]> = Exclude<MatchmakingQueueStatus, T[number]> extends never
  ? Exclude<T[number], MatchmakingQueueStatus> extends never
    ? T
    : never
  : never

describe('matchmaking schema contract', () => {
  it('declares the matchmaking queue table, indexes, and RLS policy fragments', () => {
    const migration = readFileSync(migrationPath, 'utf8')

    expectStatement(migration, /create table if not exists public\.matchmaking_queue[\s\S]*player_id uuid not null references public\.profiles\(id\)[\s\S]*display_name text not null[\s\S]*status text not null default 'searching'[\s\S]*countdown_starts_at timestamptz null[\s\S]*cancelled_at timestamptz null/)
    expectConstraint(migration, 'matchmaking_queue_status_check', ["status in ('searching', 'matched', 'cancelled', 'expired')"])
    expectConstraint(migration, 'matchmaking_queue_preferred_player_count_range_check', ['preferred_player_count between 3 and 6'])
    expectConstraint(migration, 'matchmaking_queue_min_player_count_range_check', ['min_player_count between 3 and 6'])
    expectConstraint(migration, 'matchmaking_queue_max_player_count_range_check', ['max_player_count between 3 and 6'])
    expectConstraint(migration, 'matchmaking_queue_min_preferred_order_check', ['min_player_count <= preferred_player_count'])
    expectConstraint(migration, 'matchmaking_queue_preferred_max_order_check', ['preferred_player_count <= max_player_count'])
    expectConstraint(migration, 'matchmaking_queue_searching_lifecycle_check', [
      "status <> 'searching'",
      'matched_room_id is null',
      'matched_room_code is null',
      'countdown_starts_at is null',
      'cancelled_at is null',
    ])
    expectConstraint(migration, 'matchmaking_queue_matched_lifecycle_check', [
      "status <> 'matched'",
      'matched_room_id is not null',
      'matched_room_code is not null',
      'countdown_starts_at is not null',
      'cancelled_at is null',
    ])
    expectConstraint(migration, 'matchmaking_queue_cancelled_lifecycle_check', [
      "status <> 'cancelled'",
      'cancelled_at is not null',
      'countdown_starts_at is null',
      'matched_room_id is null',
      'matched_room_code is null',
    ])
    expectConstraint(migration, 'matchmaking_queue_expired_lifecycle_check', [
      "status <> 'expired'",
      'countdown_starts_at is null',
      'matched_room_id is null',
      'matched_room_code is null',
      'cancelled_at is null',
    ])
    expectStatement(migration, /create index if not exists matchmaking_queue_search_idx\s+on public\.matchmaking_queue \(status, search_expanded, preferred_player_count, created_at\)\s+where status = 'searching'/)
    expectStatement(migration, /create index if not exists matchmaking_queue_range_idx\s+on public\.matchmaking_queue \(status, min_player_count, max_player_count, preferred_player_count, created_at desc\)\s+where status in \('searching', 'matched'\)/)
    expectStatement(migration, /create index if not exists matchmaking_queue_expires_idx\s+on public\.matchmaking_queue \(status, expires_at, created_at\)\s+where status in \('searching', 'matched', 'expired'\)/)
    expectStatement(migration, /create unique index if not exists matchmaking_queue_one_active_ticket_per_player\s+on public\.matchmaking_queue \(player_id\)\s+where status in \('searching', 'matched'\)/)
    expectStatement(migration, /create or replace function public\.matchmaking_queue_sync_fields\(\)[\s\S]*new\.updated_at := now\(\);[\s\S]*if new\.matched_room_id is null then[\s\S]*new\.matched_room_code := null;[\s\S]*select r\.code[\s\S]*into new\.matched_room_code[\s\S]*raise exception using[\s\S]*MATCHED_ROOM_NOT_FOUND[\s\S]*end;\s*\$\$;/)
    expectStatement(migration, /create trigger matchmaking_queue_sync_fields\s+before insert or update on public\.matchmaking_queue\s+for each row execute function public\.matchmaking_queue_sync_fields\(\);/)
    expectStatement(migration, /alter table public\.matchmaking_queue enable row level security/)
    expectStatement(migration, /create policy matchmaking_queue_select_own on public\.matchmaking_queue\s+for select/)
    expectStatement(migration, /create policy matchmaking_queue_manage_service_role on public\.matchmaking_queue\s+for all\s+to service_role/)
  })

  it('keeps the migration-backed queue table types and status aliases in sync', () => {
    type MatchmakingQueueTable = Database['public']['Tables']['matchmaking_queue']

    const statuses: ExpectExactStatuses<['searching', 'matched', 'cancelled', 'expired']> = [
      'searching',
      'matched',
      'cancelled',
      'expired',
    ]
    const queueTable: MatchmakingQueueTable = {
      Row: {
        cancelled_at: null,
        countdown_starts_at: null,
        created_at: '2026-04-05T10:00:00Z',
        display_name: 'Player One',
        expires_at: '2026-04-05T10:10:00Z',
        id: 'queue-id',
        matched_room_code: null,
        matched_room_id: null,
        max_player_count: 6,
        min_player_count: 3,
        player_id: 'player-id',
        preferred_player_count: 4,
        search_expanded: false,
        status: 'searching',
        updated_at: '2026-04-05T10:00:00Z',
      },
      Insert: {
        display_name: 'Player One',
        expires_at: '2026-04-05T10:10:00Z',
        max_player_count: 6,
        min_player_count: 3,
        player_id: 'player-id',
        preferred_player_count: 4,
      },
      Update: {
        status: 'matched',
      },
      Relationships: [
        {
          foreignKeyName: 'matchmaking_queue_matched_room_id_fkey',
          columns: ['matched_room_id'],
          isOneToOne: false,
          referencedRelation: 'rooms',
          referencedColumns: ['id'],
        },
        {
          foreignKeyName: 'matchmaking_queue_player_id_fkey',
          columns: ['player_id'],
          isOneToOne: false,
          referencedRelation: 'profiles',
          referencedColumns: ['id'],
        },
      ],
    }

    const ticket: MatchmakingQueueTicket = queueTable.Row

    expect(statuses).toEqual(['searching', 'matched', 'cancelled', 'expired'])
    expect(ticket.status).toBe('searching')
    expect(typeof ticket.display_name).toBe('string')
  })
})
