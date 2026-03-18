# Dixit AI Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile Dixit-inspired multiplayer game from scratch using Expo React Native + Supabase with clean architecture and a server-side game arbiter.

**Architecture:** Dumb client (Realtime subscriptions + UI state via Zustand) + smart server (Supabase Edge Functions as sole game arbiter). Client never writes to game-critical tables directly. All phase transitions go through Edge Functions that validate, execute in a Postgres transaction, and broadcast via Realtime.

**Tech Stack:** Expo SDK 55, Expo Router v4, TypeScript strict, NativeWind v4, Supabase (Postgres + Realtime + Auth + Storage + Edge Functions / Deno), Zustand, i18next, Zod, Jest, OpenAI GPT-4o-mini, Pollinations.ai

**Spec:** `docs/superpowers/specs/2026-03-18-dixit-ai-mobile-design.md`

---

## File Map

```
dixit_ai_mobile/
├── app.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── babel.config.js
├── .eslintrc.js
├── .prettierrc
├── app/
│   ├── _layout.tsx                    # Root layout: providers (Supabase, i18n, Zustand)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx                # Splash + enter as guest / sign in
│   │   └── login.tsx                  # Email + password / register
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Tab bar
│   │   ├── index.tsx                  # Home: create / join room
│   │   ├── gallery.tsx                # Personal card gallery
│   │   └── profile.tsx                # Profile tabs
│   └── room/
│       └── [code]/
│           ├── lobby.tsx              # Waiting room + chat
│           ├── game.tsx               # Game phases router
│           └── ended.tsx              # Final scoreboard
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Modal.tsx
│   │   ├── game/
│   │   │   ├── CardGrid.tsx           # Mixed cards for voting (player_id masked by hook)
│   │   │   ├── CardGenerator.tsx      # Prompt input + preview + regenerate
│   │   │   ├── PlayerList.tsx         # Players with avatar + score
│   │   │   ├── ScoreBoard.tsx         # Round/final scores table
│   │   │   └── RoundStatus.tsx        # Round X/Y + phase label
│   │   ├── game-phases/
│   │   │   ├── NarratorPhase.tsx
│   │   │   ├── PlayersPhase.tsx
│   │   │   ├── VotingPhase.tsx
│   │   │   └── ResultsPhase.tsx
│   │   └── layout/
│   │       ├── GameLayout.tsx
│   │       └── ScreenLayout.tsx
│   ├── stores/
│   │   ├── useUIStore.ts              # Toasts, modals, loading (UI only)
│   │   └── useGameStore.ts            # Local cache of game state from Realtime
│   ├── hooks/
│   │   ├── useRoom.ts                 # Realtime: rooms + room_players; navigates to ended
│   │   ├── useRound.ts                # Realtime: rounds + cards (with player_id masking)
│   │   ├── useGameActions.ts          # Calls Edge Functions
│   │   └── useImageGen.ts             # image-generate with retry
│   ├── lib/
│   │   ├── supabase.ts                # Singleton client
│   │   └── api.ts                     # Typed Edge Function wrappers
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── es.json
│   │       └── en.json
│   └── types/
│       └── game.ts                    # Generated: supabase gen types typescript
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 20260318000000_initial.sql
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts
│       │   └── types.ts
│       ├── room-create/index.ts
│       ├── room-join/index.ts
│       ├── room-leave/index.ts
│       ├── game-action/
│       │   ├── index.ts
│       │   └── scoring.ts             # Pure scoring logic (unit testable)
│       └── image-generate/index.ts
└── __tests__/
    ├── scoring.test.ts
    └── integration/
        └── game-action.test.ts
```

---

## Phase 1 — Project Foundation
*Testable milestone: app boots, TypeScript compiles with zero errors, Supabase schema created locally.*

---

### Task 1: Initialize Expo Project

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `tailwind.config.js`, `.eslintrc.js`, `.prettierrc`

- [ ] **Create Expo project**
```bash
cd "C:/Users/jairo/Desktop/PROYECTO GUESSTHEPRONT"
npx create-expo-app@latest dixit_ai_mobile --template blank-typescript
cd dixit_ai_mobile
```

- [ ] **Install core dependencies**
```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar react-native-safe-area-context react-native-screens
```

- [ ] **Install app dependencies**
```bash
npm install @supabase/supabase-js zustand i18next react-i18next expo-localization zod
npm install --save-dev @types/react @types/react-native
```

- [ ] **Install NativeWind v4**
```bash
npm install nativewind tailwindcss
npx tailwindcss init
```

- [ ] **Configure `tailwind.config.js`**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Configure `babel.config.js`**
```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
```

- [ ] **Configure `tsconfig.json`**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- [ ] **Configure `app.json`** — set `scheme: "dixit"` and `plugins: ["expo-router"]`

- [ ] **Configure ESLint + Prettier**
```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin eslint-plugin-react-hooks eslint-plugin-unicorn prettier
```

`.eslintrc.js`:
```js
module.exports = {
  extends: ['expo', 'plugin:unicorn/recommended'],
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'unicorn/filename-case': ['error', { case: 'camelCase' }],
    'unicorn/prevent-abbreviations': 'off',
  },
}
```

- [ ] **Verify TypeScript compiles**
```bash
npx tsc --noEmit
```
Expected: zero errors

- [ ] **Commit**
```bash
git init
git add .
git commit -m "chore: initialize Expo SDK 55 project with TypeScript strict + NativeWind v4"
```

---

### Task 2: Supabase Schema Migration

**Files:**
- Create: `supabase/migrations/20260318000000_initial.sql`

- [ ] **Install Supabase CLI** (if not installed)
```bash
npm install --save-dev supabase
```

- [ ] **Initialize Supabase**
```bash
npx supabase init
npx supabase start
```
Expected: local Supabase running on http://127.0.0.1:54321

- [ ] **Write migration** `supabase/migrations/20260318000000_initial.sql`
```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Jugador',
  avatar_url text,
  is_anon boolean not null default true,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, is_anon)
  values (new.id, (new.raw_app_meta_data->>'provider' = 'anonymous'));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null references profiles(id),
  status text not null default 'lobby' check (status in ('lobby','playing','ended')),
  max_players int not null default 6,
  max_rounds int not null default 8,
  points_to_win int not null default 30,
  current_round int not null default 0,
  narrator_order uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table rooms enable row level security;
create policy "Anyone can read rooms" on rooms for select using (true);
-- Edge Functions use service_role key — no INSERT/UPDATE policy needed for clients

-- room_players
create table room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references profiles(id),
  display_name text not null,
  avatar_url text,
  score int not null default 0,
  is_host boolean not null default false,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (room_id, player_id)
);
alter table room_players enable row level security;
create policy "Players read room_players in their room" on room_players
  for select using (
    exists (
      select 1 from room_players rp
      where rp.room_id = room_players.room_id and rp.player_id = auth.uid()
    )
  );
create policy "Players update own is_active" on room_players
  for update using (player_id = auth.uid())
  with check (player_id = auth.uid());

-- rounds
create table rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number int not null,
  narrator_id uuid not null references profiles(id),
  status text not null default 'narrator_turn'
    check (status in ('narrator_turn','players_turn','voting','results')),
  clue text,
  created_at timestamptz not null default now()
);
alter table rounds enable row level security;
create policy "Players read rounds in their room" on rounds
  for select using (
    exists (
      select 1 from room_players rp
      where rp.room_id = rounds.room_id and rp.player_id = auth.uid()
    )
  );

-- cards
create table cards (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references profiles(id),
  image_url text not null,
  prompt text not null,
  is_played boolean not null default false,
  created_at timestamptz not null default now()
);
-- Prevent two played cards for same player in same round (race condition guard)
create unique index cards_one_played_per_player
  on cards (round_id, player_id) where (is_played = true);

alter table cards enable row level security;
create policy "Players insert own cards" on cards
  for insert with check (
    player_id = auth.uid() and
    exists (
      select 1 from rounds r
      join room_players rp on rp.room_id = r.room_id
      where r.id = cards.round_id and rp.player_id = auth.uid() and rp.is_active = true
    )
  );
create policy "Players read played cards in their room rounds" on cards
  for select using (
    exists (
      select 1 from rounds r
      join room_players rp on rp.room_id = r.room_id
      where r.id = cards.round_id and rp.player_id = auth.uid()
    )
  );

-- votes (Edge Functions only write; clients read)
create table votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  voter_id uuid not null references profiles(id),
  card_id uuid not null references cards(id),
  unique (round_id, voter_id)
);
alter table votes enable row level security;
create policy "Players read votes in their room" on votes
  for select using (
    exists (
      select 1 from rounds r
      join room_players rp on rp.room_id = r.room_id
      where r.id = votes.round_id and rp.player_id = auth.uid()
    )
  );

-- round_scores (Edge Functions only write; clients read)
create table round_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references profiles(id),
  points int not null,
  reason text not null
    check (reason in ('narrator_success','narrator_fail','correct_vote','received_vote','consolation_bonus'))
);
alter table round_scores enable row level security;
create policy "Players read round_scores in their room" on round_scores
  for select using (
    exists (
      select 1 from rounds r
      join room_players rp on rp.room_id = r.room_id
      where r.id = round_scores.round_id and rp.player_id = auth.uid()
    )
  );

-- gallery_cards
create table gallery_cards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references profiles(id) on delete cascade,
  image_url text not null,
  prompt text not null,
  title text not null default '',
  created_at timestamptz not null default now()
);
alter table gallery_cards enable row level security;
create policy "Players manage own gallery" on gallery_cards
  for all using (player_id = auth.uid()) with check (player_id = auth.uid());

-- lobby_messages
create table lobby_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references profiles(id),
  sender_name text not null,
  text text not null,
  created_at timestamptz not null default now()
);
alter table lobby_messages enable row level security;
create policy "Players in room read messages" on lobby_messages
  for select using (
    exists (
      select 1 from room_players rp
      where rp.room_id = lobby_messages.room_id and rp.player_id = auth.uid()
    )
  );
create policy "Players insert own messages" on lobby_messages
  for insert with check (
    player_id = auth.uid() and
    exists (
      select 1 from room_players rp
      where rp.room_id = lobby_messages.room_id and rp.player_id = auth.uid() and rp.is_active = true
    )
  );

-- Enable Realtime on all game tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_players;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table round_scores;
alter publication supabase_realtime add table lobby_messages;
```

- [ ] **Apply migration**
```bash
npx supabase db reset
```
Expected: `Finished supabase db reset` with no errors

- [ ] **Generate TypeScript types**
```bash
npx supabase gen types typescript --local > src/types/game.ts
```
Expected: `src/types/game.ts` with all table types

- [ ] **Commit**
```bash
git add supabase/ src/types/game.ts
git commit -m "feat: add Supabase schema with RLS, Realtime, and generated types"
```

---

### Task 3: Supabase Client + Edge Functions Shared Code

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/api.ts`
- Create: `supabase/functions/_shared/cors.ts`, `supabase/functions/_shared/types.ts`

- [ ] **Create `src/lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/game'
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

- [ ] **Add env config to `app.json`** under `expo.extra`:
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "http://127.0.0.1:54321",
      "supabaseAnonKey": "<local-anon-key from supabase start output>"
    }
  }
}
```

- [ ] **Create `supabase/functions/_shared/cors.ts`**
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}
```

- [ ] **Create `supabase/functions/_shared/types.ts`**
```typescript
export type ActionError = {
  code: string
  message: string
}

export function errorResponse(code: string, message: string, status = 400): Response {
  const body: ActionError = { code, message }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function okResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Create `src/lib/api.ts`** (typed wrappers — expand as Edge Functions are added)
```typescript
import { supabase } from './supabase'

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body })
  if (error) throw error
  return data as T
}

export const api = {
  roomCreate: (payload: { displayName: string }) =>
    callFunction<{ code: string }>('room-create', payload),
  roomJoin: (payload: { code: string; displayName: string }) =>
    callFunction<void>('room-join', payload),
  roomLeave: (payload: { code: string }) =>
    callFunction<void>('room-leave', payload),
  gameAction: (payload: { roomCode: string; action: string; payload?: unknown }) =>
    callFunction<{ ok: true }>('game-action', payload),
  imageGenerate: (payload: { prompt: string }) =>
    callFunction<{ url: string; brief: string }>('image-generate', payload),
}
```

- [ ] **Commit**
```bash
git add src/lib/ supabase/functions/_shared/
git commit -m "feat: Supabase singleton client, api wrappers, Edge Function shared utilities"
```

---

### Task 4: i18n Setup

**Files:**
- Create: `src/i18n/index.ts`, `src/i18n/locales/es.json`, `src/i18n/locales/en.json`

- [ ] **Create `src/i18n/locales/es.json`**
```json
{
  "welcome": {
    "title": "Guess The Pront",
    "subtitle": "El juego de las cartas misteriosas",
    "enterAsGuest": "Entrar como invitado",
    "signIn": "Iniciar sesión"
  },
  "home": {
    "createRoom": "Crear sala",
    "joinRoom": "Unirse",
    "codePlaceholder": "Código de sala",
    "yourName": "Tu nombre"
  },
  "lobby": {
    "waitingForPlayers": "Esperando jugadores...",
    "ready": "Listo",
    "notReady": "No listo",
    "startGame": "¡Empezar!",
    "shareCode": "Compartir código",
    "copied": "¡Copiado!",
    "chat": "Chat",
    "messagePlaceholder": "Escribe un mensaje..."
  },
  "game": {
    "narrator": "Narrador",
    "yourTurn": "Tu turno",
    "round": "Ronda {{current}} de {{total}}",
    "generateCard": "Generar carta",
    "promptPlaceholder": "Describe tu carta...",
    "regenerate": "Regenerar",
    "chooseCard": "Elegir esta carta",
    "writeClue": "Escribe una pista para tu carta",
    "cluePlaceholder": "Una palabra, frase o sonido...",
    "submitClue": "Enviar pista",
    "submitCard": "Jugar esta carta",
    "voting": "¡Vota! ¿Cuál es la carta del narrador?",
    "vote": "Votar",
    "results": "Resultados",
    "nextRound": "Siguiente ronda",
    "points": "{{count}} pts",
    "waiting": "Esperando a los demás..."
  },
  "gallery": {
    "title": "Mi galería",
    "generate": "Generar carta",
    "noCards": "Aún no tienes cartas. ¡Genera tu primera!",
    "titlePlaceholder": "Título de la carta"
  },
  "profile": {
    "title": "Perfil",
    "displayName": "Nombre",
    "email": "Email",
    "password": "Contraseña",
    "save": "Guardar",
    "logout": "Cerrar sesión",
    "deleteAccount": "Eliminar cuenta",
    "upgradeAccount": "Crear cuenta",
    "upgradeSubtitle": "Guarda tu progreso entre sesiones"
  },
  "errors": {
    "ROOM_FULL": "La sala está llena",
    "NOT_YOUR_TURN": "No es tu turno",
    "INVALID_STATE": "Estado de juego inválido",
    "ROOM_NOT_FOUND": "Sala no encontrada",
    "MIN_PLAYERS_REQUIRED": "Se necesitan al menos 3 jugadores",
    "INVALID_CARD": "Carta inválida",
    "generic": "Algo salió mal. Inténtalo de nuevo."
  }
}
```

- [ ] **Create `src/i18n/locales/en.json`** (mirror of es.json with English strings — same keys)

- [ ] **Create `src/i18n/index.ts`**
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import es from './locales/es.json'
import en from './locales/en.json'

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: Localization.getLocales()[0]?.languageCode === 'es' ? 'es' : 'en',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

export default i18n
```

- [ ] **Commit**
```bash
git add src/i18n/
git commit -m "feat: i18n setup with es/en locales via i18next + expo-localization"
```

---

## Phase 2 — Auth & Navigation Shell
*Testable milestone: app opens, anonymous Supabase session created, tab navigation works.*

---

### Task 5: UI Primitives

**Files:**
- Create: `src/components/ui/Button.tsx`, `Input.tsx`, `Avatar.tsx`, `Toast.tsx`, `Modal.tsx`

- [ ] **Create `src/components/ui/Button.tsx`**
```typescript
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  onPress: () => void
  children: ReactNode
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  className?: string
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-orange-500 active:bg-orange-600',
  secondary: 'bg-stone-700 active:bg-stone-800',
  ghost: 'bg-transparent border border-stone-500',
  danger: 'bg-red-600 active:bg-red-700',
}

export function Button({ onPress, children, variant = 'primary', loading, disabled, className = '' }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled ?? loading}
      activeOpacity={0.8}
      className={`rounded-2xl px-5 py-3.5 items-center justify-center flex-row gap-2
        ${variantClasses[variant]}
        ${(disabled ?? loading) ? 'opacity-50' : ''}
        ${className}`}
    >
      {loading && <ActivityIndicator size="small" color="white" />}
      {typeof children === 'string' ? (
        <Text className="text-white font-semibold text-base">{children}</Text>
      ) : children}
    </TouchableOpacity>
  )
}
```

- [ ] **Create `src/components/ui/Input.tsx`**
```typescript
import { TextInput, View, Text } from 'react-native'
import type { TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps & { className?: string }) {
  return (
    <View className="gap-1">
      {label && <Text className="text-stone-300 text-sm font-medium">{label}</Text>}
      <TextInput
        className={`bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white text-base
          ${error ? 'border-red-500' : ''}
          ${className}`}
        placeholderTextColor="#78716c"
        {...props}
      />
      {error && <Text className="text-red-400 text-xs">{error}</Text>}
    </View>
  )
}
```

- [ ] **Create `src/components/ui/Avatar.tsx`**
```typescript
import { Image, View, Text } from 'react-native'

interface AvatarProps {
  uri?: string | null
  name?: string
  size?: number
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = name?.slice(0, 2).toUpperCase() ?? '?'
  return uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-stone-700"
    />
  ) : (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-orange-500 items-center justify-center"
    >
      <Text className="text-white font-bold" style={{ fontSize: size * 0.35 }}>{initials}</Text>
    </View>
  )
}
```

- [ ] **Create `src/stores/useUIStore.ts`**
```typescript
import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'info' | 'error' | 'success'
}

interface UIState {
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Date.now().toString()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
```

- [ ] **Commit**
```bash
git add src/components/ui/ src/stores/useUIStore.ts
git commit -m "feat: UI primitives (Button, Input, Avatar) and UIStore"
```

---

### Task 6: Authentication

**Files:**
- Create: `app/(auth)/_layout.tsx`, `app/(auth)/welcome.tsx`, `app/(auth)/login.tsx`
- Create: `app/_layout.tsx`

- [ ] **Create `app/_layout.tsx`** (root layout)
```typescript
import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import '@/i18n'

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuth = segments[0] === '(auth)'
      if (!session && !inAuth) router.replace('/(auth)/welcome')
      if (session && inAuth) router.replace('/(tabs)')
    })
    return () => subscription.unsubscribe()
  }, [segments])

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  )
}
```

- [ ] **Create `app/(auth)/welcome.tsx`**
```typescript
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { useState } from 'react'

export default function Welcome() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function enterAsGuest() {
    setLoading(true)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) console.error(error)
    setLoading(false)
  }

  return (
    <View className="flex-1 bg-stone-900 items-center justify-center gap-8 px-8">
      <View className="items-center gap-3">
        <Text className="text-orange-400 text-4xl font-bold">{t('welcome.title')}</Text>
        <Text className="text-stone-400 text-base text-center">{t('welcome.subtitle')}</Text>
      </View>
      <View className="w-full gap-3">
        <Button onPress={enterAsGuest} loading={loading}>{t('welcome.enterAsGuest')}</Button>
        <Button onPress={() => router.push('/(auth)/login')} variant="secondary">
          {t('welcome.signIn')}
        </Button>
      </View>
    </View>
  )
}
```

- [ ] **Create `app/(auth)/login.tsx`** — email/password form with sign in + register mode toggle, calls `supabase.auth.signInWithPassword` / `supabase.auth.signUp`

- [ ] **Verify**: run `npx expo start`, open on device/emulator, confirm anonymous sign-in redirects to `/(tabs)`

- [ ] **Commit**
```bash
git add app/
git commit -m "feat: auth flow — welcome screen, anonymous sign-in, login screen"
```

---

### Task 7: Tab Navigation Shell

**Files:**
- Create: `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/gallery.tsx`, `app/(tabs)/profile.tsx`

- [ ] **Create `app/(tabs)/_layout.tsx`**
```typescript
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'

export default function TabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs screenOptions={{ tabBarStyle: { backgroundColor: '#1c1917' }, tabBarActiveTintColor: '#f97316' }}>
      <Tabs.Screen name="index" options={{ title: t('home.createRoom') }} />
      <Tabs.Screen name="gallery" options={{ title: t('gallery.title') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile.title') }} />
    </Tabs>
  )
}
```

- [ ] **Create stub screens** for `index.tsx`, `gallery.tsx`, `profile.tsx` — each returns a `<View>` with a `<Text>` placeholder

- [ ] **Verify**: tab bar renders, switching tabs works

- [ ] **Commit**
```bash
git add app/(tabs)/
git commit -m "feat: tab navigation shell with home, gallery, profile stubs"
```

---

## Phase 3 — Room Management
*Testable milestone: create/join a room, lobby shows real-time player list, lobby chat works.*

---

### Task 8: `room-create` Edge Function

**Files:**
- Create: `supabase/functions/room-create/index.ts`

- [ ] **Write `supabase/functions/room-create/index.ts`**
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const schema = z.object({ displayName: z.string().min(1).max(30) })

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateCode(): string {
  return Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return errorResponse('UNAUTHORIZED', 'Missing auth', 401)

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authError || !user) return errorResponse('UNAUTHORIZED', 'Invalid token', 401)

  const body = schema.safeParse(await req.json())
  if (!body.success) return errorResponse('INVALID_PAYLOAD', body.error.message, 400)

  // Generate unique code
  let code = generateCode()
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from('rooms').select('id').eq('code', code).maybeSingle()
    if (!data) break
    code = generateCode()
  }

  const { error: roomError } = await supabase.from('rooms').insert({
    code,
    host_id: user.id,
    status: 'lobby',
  })
  if (roomError) return errorResponse('DB_ERROR', roomError.message, 500)

  const { error: playerError } = await supabase.from('room_players').insert({
    room_id: (await supabase.from('rooms').select('id').eq('code', code).single()).data!.id,
    player_id: user.id,
    display_name: body.data.displayName,
    is_host: true,
  })
  if (playerError) return errorResponse('DB_ERROR', playerError.message, 500)

  return okResponse({ code })
})
```

- [ ] **Deploy function locally**
```bash
npx supabase functions serve room-create --no-verify-jwt
```

- [ ] **Test manually**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/room-create \
  -H "Authorization: Bearer <anon-token>" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"TestPlayer"}'
```
Expected: `{"code":"XXXXXX"}`

- [ ] **Commit**
```bash
git add supabase/functions/room-create/
git commit -m "feat: room-create Edge Function"
```

---

### Task 9: `room-join` and `room-leave` Edge Functions

**Files:**
- Create: `supabase/functions/room-join/index.ts`, `supabase/functions/room-leave/index.ts`

- [ ] **Write `room-join/index.ts`** — validates room exists + lobby status + capacity + player not already in room → inserts room_players row

- [ ] **Write `room-leave/index.ts`**
```typescript
// Key logic (full function follows same structure as room-create):
// 1. Set room_players.is_active = false for caller
// 2. Count remaining active players
// 3. If 0 remaining → set rooms.status = 'ended', ended_at = now()
// 4. If caller was host and players remain → transfer host to earliest joined_at active player
// 5. If game in progress and active count < 3 → set rooms.status = 'ended', ended_at = now()
```

- [ ] **Commit**
```bash
git add supabase/functions/room-join/ supabase/functions/room-leave/
git commit -m "feat: room-join and room-leave Edge Functions"
```

---

### Task 10: `useRoom` Hook + Home Screen

**Files:**
- Create: `src/hooks/useRoom.ts`, `src/hooks/useGameActions.ts`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Create `src/hooks/useRoom.ts`**
```typescript
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/game'

type Room = Database['public']['Tables']['rooms']['Row']
type Player = Database['public']['Tables']['room_players']['Row']

export function useRoom(code: string | null) {
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    if (!code) return

    // Fetch initial state
    supabase.from('rooms').select('*').eq('code', code).single()
      .then(({ data }) => { if (data) setRoom(data) })

    supabase.from('room_players').select('*').eq('room_id', code)
      .then(({ data }) => { if (data) setPlayers(data) })

    // Subscribe to room changes
    const roomSub = supabase.channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        (payload) => {
          const updated = payload.new as Room
          setRoom(updated)
          // Navigate to ended screen when game ends
          if (updated.status === 'ended') {
            router.replace(`/room/${code}/ended`)
          }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players' },
        () => {
          supabase.from('room_players').select('*').eq('room_id', code)
            .then(({ data }) => { if (data) setPlayers(data) })
        })
      .subscribe()

    return () => { supabase.removeChannel(roomSub) }
  }, [code])

  return { room, players }
}
```

- [ ] **Create `src/hooks/useGameActions.ts`**
```typescript
import { api } from '@/lib/api'
import { useUIStore } from '@/stores/useUIStore'
import { useTranslation } from 'react-i18next'

export function useGameActions() {
  const showToast = useUIStore((s) => s.showToast)
  const { t } = useTranslation()

  function handleError(error: unknown) {
    const code = (error as { error?: { code?: string } })?.error?.code
    const message = code ? (t(`errors.${code}`, t('errors.generic'))) : t('errors.generic')
    showToast(message, 'error')
  }

  return {
    createRoom: async (displayName: string) => {
      try { return await api.roomCreate({ displayName }) }
      catch (e) { handleError(e); return null }
    },
    joinRoom: async (code: string, displayName: string) => {
      try { await api.roomJoin({ code, displayName }); return true }
      catch (e) { handleError(e); return false }
    },
    leaveRoom: async (code: string) => {
      try { await api.roomLeave({ code }) }
      catch (e) { handleError(e) }
    },
    gameAction: async (roomCode: string, action: string, payload?: unknown) => {
      try { await api.gameAction({ roomCode, action, payload }); return true }
      catch (e) { handleError(e); return false }
    },
  }
}
```

- [ ] **Implement `app/(tabs)/index.tsx`** — form with display name input + "Crear sala" button + code input + "Unirse" button. On create: call `createRoom`, navigate to `/room/[code]/lobby`. On join: call `joinRoom`, navigate to `/room/[code]/lobby`.

- [ ] **Verify**: create a room, copy the code, open a second session (web or simulator), join the room

- [ ] **Commit**
```bash
git add src/hooks/ app/(tabs)/index.tsx
git commit -m "feat: useRoom hook, useGameActions, home screen with create/join"
```

---

### Task 11: Lobby Screen

**Files:**
- Create: `app/room/[code]/lobby.tsx`, `src/components/game/PlayerList.tsx`

- [ ] **Create `src/components/game/PlayerList.tsx`**
```typescript
import { FlatList, View, Text } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import type { Database } from '@/types/game'

type Player = Database['public']['Tables']['room_players']['Row']

export function PlayerList({ players }: { players: Player[] }) {
  return (
    <FlatList
      data={players}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <View className="flex-row items-center gap-3 py-2">
          <Avatar uri={item.avatar_url} name={item.display_name} size={36} />
          <Text className="text-white flex-1">{item.display_name}</Text>
          {item.is_host && <Text className="text-orange-400 text-xs">Host</Text>}
          <View className={`w-2.5 h-2.5 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-stone-600'}`} />
        </View>
      )}
    />
  )
}
```

- [ ] **Create `app/room/[code]/lobby.tsx`** — uses `useRoom(code)`. Shows: player list, room code with copy button, start game button (host only, disabled if <3 players), lobby chat (list of messages + input, client-side guard blocks send when room.status = 'playing'), leave button.

- [ ] **Add lobby chat**: subscribe to `lobby_messages` via Realtime; INSERT directly from client (RLS allows it).

- [ ] **Verify**: open lobby in two simulators, confirm players appear in real-time, chat works

- [ ] **Commit**
```bash
git add app/room/ src/components/game/PlayerList.tsx
git commit -m "feat: lobby screen with real-time players, chat, and start game"
```

---

## Phase 4 — Image Generation
*Testable milestone: generate a Dixit-style image from a prompt.*

---

### Task 12: `image-generate` Edge Function

**Files:**
- Create: `supabase/functions/image-generate/index.ts`

- [ ] **Write `supabase/functions/image-generate/index.ts`**
```typescript
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const schema = z.object({ prompt: z.string().min(1).max(500) })

const DIXIT_SYSTEM = `Transform the user's request into a Dixit card image brief.
Style: Marie Cardouat's gouache+watercolor illustration. 2D painterly, no photorealism.
Palette: deep oceanic blues, forest greens, warm earth tones, coral pinks, golden yellows.
Characters: elongated graceful proportions, flowing poses, expressive simplified faces.
Environment: incredibly detailed atmospheric backgrounds with symbolic depth.
Lighting: dramatic directional light with soft edges, luminous colored shadows.
Composition: vertical 2:3 format, rich narrative layers, natural vignetting.
FORBIDDEN: No text, logos, photorealism, CGI, modern devices.
Output: single paragraph under 800 characters describing the exact scene.`

function makePollinationsUrl(prompt: string, seed: number): string {
  const styled = `DIXIT CARD STYLE 2D ILLUSTRATION: ${prompt}. Marie Cardouat gouache watercolor; visible brush strokes; warm vintage palette teal saffron coral olive; elongated proportions; cinematic diffuse light; rich narrative background; no photorealism.`
  const params = new URLSearchParams({ seed: String(seed), model: 'flux-illumin8', width: '768', height: '1152', nologo: 'true' })
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(styled)}?${params}`
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const body = schema.safeParse(await req.json())
  if (!body.success) return errorResponse('INVALID_PAYLOAD', body.error.message, 400)

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) return errorResponse('CONFIG_ERROR', 'Missing OpenAI key', 500)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: DIXIT_SYSTEM },
        { role: 'user', content: body.data.prompt },
      ],
      temperature: 0.3,
    }),
  })
  const json = await response.json() as { choices: Array<{ message: { content: string } }> }
  const brief = json.choices[0]?.message.content ?? body.data.prompt

  const seed = Math.floor(Math.random() * 2_147_483_647)
  const url = makePollinationsUrl(brief, seed)

  return okResponse({ url, brief })
})
```

- [ ] **Set OpenAI secret**
```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-...
```

- [ ] **Test**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/image-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"un gato tocando el piano en la luna"}'
```
Expected: `{"url":"https://image.pollinations.ai/...","brief":"..."}`

- [ ] **Commit**
```bash
git add supabase/functions/image-generate/
git commit -m "feat: image-generate Edge Function with OpenAI brief + Pollinations URL"
```

---

### Task 13: `useImageGen` Hook + `CardGenerator` Component

**Files:**
- Create: `src/hooks/useImageGen.ts`, `src/components/game/CardGenerator.tsx`

- [ ] **Create `src/hooks/useImageGen.ts`**
```typescript
import { useState } from 'react'
import { api } from '@/lib/api'

export function useImageGen() {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [brief, setBrief] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate(prompt: string, attempt = 0): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      const result = await api.imageGenerate({ prompt })
      setUrl(result.url)
      setBrief(result.brief)
    } catch (e) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        return generate(prompt, attempt + 1)
      }
      setError('No se pudo generar la imagen. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return { generate, url, brief, loading, error, reset: () => { setUrl(null); setBrief(null) } }
}
```

- [ ] **Create `src/components/game/CardGenerator.tsx`** — Input for prompt + "Generar" button → shows loading spinner → shows Image with the URL → "Regenerar" button → "Elegir esta carta" button that calls `onSelect(url, prompt)`

- [ ] **Verify**: in a standalone test screen, generate an image and confirm it displays

- [ ] **Commit**
```bash
git add src/hooks/useImageGen.ts src/components/game/CardGenerator.tsx
git commit -m "feat: useImageGen hook with retry + CardGenerator component"
```

---

## Phase 5 — Game Engine (Edge Functions)
*Testable milestone: all game-action transitions tested via integration tests.*

---

### Task 14: Scoring Logic (TDD)

**Files:**
- Create: `supabase/functions/game-action/scoring.ts`, `__tests__/scoring.test.ts`

- [ ] **Install Jest**
```bash
npm install --save-dev jest @types/jest ts-jest
```

`jest.config.js`:
```js
module.exports = { preset: 'ts-jest', testEnvironment: 'node' }
```

- [ ] **Write failing tests first** `__tests__/scoring.test.ts`
```typescript
import { calculateScores } from '../supabase/functions/game-action/scoring'

const p1 = 'player-1', p2 = 'player-2', p3 = 'player-3', narrator = 'narrator'
const narratorCard = 'card-narrator'
const p1Card = 'card-p1', p2Card = 'card-p2', p3Card = 'card-p3'

const basePlayers = [narrator, p1, p2, p3]

describe('calculateScores', () => {
  test('narrator_fail: all guess correctly → narrator 0, others consolation 2', () => {
    const votes = [
      { voter_id: p1, card_id: narratorCard },
      { voter_id: p2, card_id: narratorCard },
      { voter_id: p3, card_id: narratorCard },
    ]
    const playedCards = [
      { id: narratorCard, player_id: narrator },
      { id: p1Card, player_id: p1 },
      { id: p2Card, player_id: p2 },
      { id: p3Card, player_id: p3 },
    ]
    const scores = calculateScores({ narratorId: narrator, players: basePlayers, votes, playedCards })
    expect(scores.find((s) => s.player_id === narrator)?.points).toBe(0)
    expect(scores.find((s) => s.player_id === p1)?.points).toBe(2)
    expect(scores.find((s) => s.player_id === narrator)?.reason).toBe('narrator_fail')
    expect(scores.find((s) => s.player_id === p1)?.reason).toBe('consolation_bonus')
  })

  test('narrator_fail: none guess correctly → narrator 0, others consolation 2', () => {
    const votes = [
      { voter_id: p1, card_id: p2Card },
      { voter_id: p2, card_id: p1Card },
      { voter_id: p3, card_id: p1Card },
    ]
    const playedCards = [
      { id: narratorCard, player_id: narrator },
      { id: p1Card, player_id: p1 },
      { id: p2Card, player_id: p2 },
      { id: p3Card, player_id: p3 },
    ]
    const scores = calculateScores({ narratorId: narrator, players: basePlayers, votes, playedCards })
    expect(scores.find((s) => s.player_id === narrator)?.points).toBe(0)
    expect(scores.find((s) => s.player_id === p1)?.reason).toBe('consolation_bonus')
  })

  test('narrator_success: some guess correctly → narrator 3, correct voters 3', () => {
    const votes = [
      { voter_id: p1, card_id: narratorCard },
      { voter_id: p2, card_id: p1Card },
      { voter_id: p3, card_id: narratorCard },
    ]
    const playedCards = [
      { id: narratorCard, player_id: narrator },
      { id: p1Card, player_id: p1 },
      { id: p2Card, player_id: p2 },
      { id: p3Card, player_id: p3 },
    ]
    const scores = calculateScores({ narratorId: narrator, players: basePlayers, votes, playedCards })
    expect(scores.find((s) => s.player_id === narrator)?.points).toBe(3)
    expect(scores.find((s) => s.player_id === p1)?.points).toBe(3)
    expect(scores.find((s) => s.player_id === p2)?.points).toBe(0)
  })

  test('received_vote: non-narrator cards that got votes earn 1pt per vote', () => {
    const votes = [
      { voter_id: p1, card_id: narratorCard },
      { voter_id: p2, card_id: p3Card },
      { voter_id: p3, card_id: narratorCard },
    ]
    const playedCards = [
      { id: narratorCard, player_id: narrator },
      { id: p1Card, player_id: p1 },
      { id: p2Card, player_id: p2 },
      { id: p3Card, player_id: p3 },
    ]
    const scores = calculateScores({ narratorId: narrator, players: basePlayers, votes, playedCards })
    // p3 received 1 vote from p2 → 1pt received_vote
    const p3Scores = scores.filter((s) => s.player_id === p3)
    const receivedVote = p3Scores.find((s) => s.reason === 'received_vote')
    expect(receivedVote?.points).toBe(1)
  })
})
```

- [ ] **Run tests — verify they FAIL**
```bash
npx jest __tests__/scoring.test.ts
```
Expected: FAIL with "Cannot find module"

- [ ] **Implement `supabase/functions/game-action/scoring.ts`**
```typescript
interface Vote { voter_id: string; card_id: string }
interface PlayedCard { id: string; player_id: string }
interface ScoreEntry { player_id: string; points: number; reason: string }
interface ScoreInput {
  narratorId: string
  players: string[]        // all active non-narrator player_ids + narrator
  votes: Vote[]
  playedCards: PlayedCard[]
}

export function calculateScores({ narratorId, players, votes, playedCards }: ScoreInput): ScoreEntry[] {
  const nonNarrators = players.filter((p) => p !== narratorId)
  const narratorCard = playedCards.find((c) => c.player_id === narratorId)
  if (!narratorCard) return []

  const correctVoters = votes.filter((v) => v.card_id === narratorCard.id).map((v) => v.voter_id)
  const allCorrect = correctVoters.length === nonNarrators.length
  const noneCorrect = correctVoters.length === 0
  const narratorFails = allCorrect || noneCorrect

  const entries: ScoreEntry[] = []

  // Narrator
  entries.push({ player_id: narratorId, points: narratorFails ? 0 : 3, reason: narratorFails ? 'narrator_fail' : 'narrator_success' })

  // Non-narrators: correct vote or consolation
  for (const pid of nonNarrators) {
    if (narratorFails) {
      entries.push({ player_id: pid, points: 2, reason: 'consolation_bonus' })
    } else if (correctVoters.includes(pid)) {
      entries.push({ player_id: pid, points: 3, reason: 'correct_vote' })
    }
  }

  // Received votes (non-narrator cards only)
  const cardToPlayer = new Map(playedCards.filter((c) => c.player_id !== narratorId).map((c) => [c.id, c.player_id]))
  for (const vote of votes) {
    const owner = cardToPlayer.get(vote.card_id)
    if (owner && owner !== vote.voter_id) {
      entries.push({ player_id: owner, points: 1, reason: 'received_vote' })
    }
  }

  return entries
}
```

- [ ] **Run tests — verify they PASS**
```bash
npx jest __tests__/scoring.test.ts
```
Expected: 4 tests pass

- [ ] **Commit**
```bash
git add supabase/functions/game-action/scoring.ts __tests__/scoring.test.ts jest.config.js
git commit -m "feat: Dixit scoring logic with full TDD test coverage"
```

---

### Task 15: `game-action` Edge Function

**Files:**
- Create: `supabase/functions/game-action/index.ts`

- [ ] **Write `supabase/functions/game-action/index.ts`**

The function handles all 5 actions. Structure each action as a separate async handler called from a switch:

```typescript
// Skeleton — fill each case fully
Deno.serve(async (req) => {
  // auth + cors + zod parse { roomCode, action, payload }

  switch (action) {
    case 'start_game': return handleStartGame(supabase, user, roomCode)
    case 'submit_clue': return handleSubmitClue(supabase, user, roomCode, payload)
    case 'submit_card': return handleSubmitCard(supabase, user, roomCode, payload)
    case 'submit_vote': return handleSubmitVote(supabase, user, roomCode, payload)
    case 'next_round': return handleNextRound(supabase, user, roomCode)
    default: return errorResponse('INVALID_ACTION', 'Unknown action', 400)
  }
})
```

- [ ] **Implement `handleStartGame`**:
  1. Verify caller is host + room status = 'lobby'
  2. Count active players — reject if < 3 (`MIN_PLAYERS_REQUIRED`)
  3. Build `narrator_order` from active players sorted by `joined_at`
  4. Update `rooms`: `status='playing'`, `current_round=1`, `narrator_order`
  5. Insert `rounds` row: `round_number=1`, `narrator_id=narrator_order[0]`, `status='narrator_turn'`

- [ ] **Implement `handleSubmitClue`**:
  1. Load current round — verify caller = narrator, status = 'narrator_turn'
  2. Verify `payload.card_id` belongs to current round AND `cards.player_id = caller.id`
  3. Update `cards.is_played = true` for `payload.card_id`
  4. Update `rounds`: `clue = payload.clue`, `status = 'players_turn'`

- [ ] **Implement `handleSubmitCard`**:
  1. Load round — verify status = 'players_turn', caller ≠ narrator
  2. Verify `payload.card_id` belongs to current round AND `cards.player_id = caller.id`
  3. Update `cards.is_played = true`
  4. Count active non-narrator players; count played cards (excluding narrator's)
  5. If all played → update `rounds.status = 'voting'`

- [ ] **Implement `handleSubmitVote`**:
  1. Load round — verify status = 'voting', caller ≠ narrator, no existing vote for caller
  2. Verify `payload.card_id` is a played card in this round
  3. Insert into `votes`
  4. Count active non-narrator players vs votes cast
  5. If all voted → call `calculateScores` → insert `round_scores` → update `room_players.score` for each player → update `rounds.status = 'results'`

- [ ] **Implement `handleNextRound`**:
  1. Load round — if status ≠ 'results' → return 200 no-op (idempotent)
  2. Load room — check game-over: any player score ≥ `points_to_win` OR `current_round >= max_rounds`
  3. If game over → update `rooms.status = 'ended'`, `ended_at = now()`
  4. If continuing → `current_round++`, narrator = `narrator_order[(current_round-1) % narrator_order.length]`, insert new `rounds` row with `status = 'narrator_turn'`

- [ ] **Commit**
```bash
git add supabase/functions/game-action/
git commit -m "feat: game-action Edge Function — start_game, submit_clue, submit_card, submit_vote, next_round"
```

---

## Phase 6 — Game UI
*Testable milestone: full game loop playable from lobby to final scoreboard.*

---

### Task 16: `useRound` Hook + `useGameStore`

**Files:**
- Create: `src/hooks/useRound.ts`, `src/stores/useGameStore.ts`

- [ ] **Create `src/stores/useGameStore.ts`**
```typescript
import { create } from 'zustand'
import type { Database } from '@/types/game'

type Round = Database['public']['Tables']['rounds']['Row']
type Card = Database['public']['Tables']['cards']['Row'] & { player_id: string | null }

interface GameState {
  round: Round | null
  cards: Card[]
  myPlayedCardId: string | null
  setRound: (r: Round) => void
  setCards: (cards: Card[]) => void
  setMyPlayedCardId: (id: string | null) => void
}

export const useGameStore = create<GameState>((set) => ({
  round: null,
  cards: [],
  myPlayedCardId: null,
  setRound: (round) => set({ round }),
  setCards: (cards) => set({ cards }),
  setMyPlayedCardId: (myPlayedCardId) => set({ myPlayedCardId }),
}))
```

- [ ] **Create `src/hooks/useRound.ts`**
```typescript
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/stores/useGameStore'

export function useRound(roomId: string | undefined) {
  const { setRound, setCards } = useGameStore()

  useEffect(() => {
    if (!roomId) return

    // Subscribe to rounds for this room
    const roundSub = supabase.channel(`rounds:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const round = payload.new as Parameters<typeof setRound>[0]
          setRound(round)
          // Refresh cards when round status changes
          refreshCards(round.id, round.status)
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' },
        () => {
          // Re-fetch when any card changes
          supabase.from('rounds').select('id,status').eq('room_id', roomId).order('round_number', { ascending: false }).limit(1).single()
            .then(({ data }) => { if (data) refreshCards(data.id, data.status) })
        })
      .subscribe()

    return () => { supabase.removeChannel(roundSub) }
  }, [roomId])

  async function refreshCards(roundId: string, status: string) {
    const { data } = await supabase.from('cards').select('*').eq('round_id', roundId).eq('is_played', true)
    if (!data) return
    // Mask player_id during voting phase
    const masked = data.map((c) => ({ ...c, player_id: status === 'voting' ? null : c.player_id }))
    setCards(masked)
  }
}
```

- [ ] **Commit**
```bash
git add src/hooks/useRound.ts src/stores/useGameStore.ts
git commit -m "feat: useRound hook with Realtime subscription and narrator card masking"
```

---

### Task 17: Game Phase Components

**Files:**
- Create: `src/components/game-phases/NarratorPhase.tsx`, `PlayersPhase.tsx`, `VotingPhase.tsx`, `ResultsPhase.tsx`
- Create: `src/components/game/CardGrid.tsx`, `RoundStatus.tsx`, `ScoreBoard.tsx`
- Create: `app/room/[code]/game.tsx`

- [ ] **Create `src/components/game/RoundStatus.tsx`**
```typescript
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

interface Props { roundNumber: number; maxRounds: number; phase: string }

const phaseLabels: Record<string, string> = {
  narrator_turn: 'Turno del narrador',
  players_turn: 'Elige tu carta',
  voting: '¡Vota!',
  results: 'Resultados',
}

export function RoundStatus({ roundNumber, maxRounds, phase }: Props) {
  return (
    <View className="flex-row items-center justify-between px-4 py-2 bg-stone-800">
      <Text className="text-stone-400 text-sm">Ronda {roundNumber}/{maxRounds}</Text>
      <Text className="text-orange-400 text-sm font-semibold">{phaseLabels[phase] ?? phase}</Text>
    </View>
  )
}
```

- [ ] **Create `src/components/game/CardGrid.tsx`** — FlatList in 2 columns, each item shows Image with rounded corners. Tappable when in voting mode, highlights selected card.

- [ ] **Create `src/components/game-phases/NarratorPhase.tsx`** — `CardGenerator` + clue input + submit button. On submit: calls `gameAction('submit_clue', { card_id, clue })`.

- [ ] **Create `src/components/game-phases/PlayersPhase.tsx`** — Shows narrator's clue. `CardGenerator` + "Jugar esta carta" button. On submit: inserts card row, calls `gameAction('submit_card', { card_id })`. If not narrator's turn → shows waiting indicator.

- [ ] **Create `src/components/game-phases/VotingPhase.tsx`** — Shows `CardGrid` with played cards (player_id masked). Tap to select + "Votar" button. On vote: calls `gameAction('submit_vote', { card_id })`. Shows waiting if already voted.

- [ ] **Create `src/components/game-phases/ResultsPhase.tsx`** — Shows `CardGrid` with revealed authorship. `ScoreBoard` with round deltas. "Siguiente ronda" button → calls `gameAction('next_round')`.

- [ ] **Create `src/components/game/ScoreBoard.tsx`** — FlatList of players sorted by score descending, showing delta points for this round.

- [ ] **Create `app/room/[code]/game.tsx`**
```typescript
import { useLocalSearchParams } from 'expo-router'
import { useRoom } from '@/hooks/useRoom'
import { useRound } from '@/hooks/useRound'
import { useGameStore } from '@/stores/useGameStore'
import { NarratorPhase } from '@/components/game-phases/NarratorPhase'
import { PlayersPhase } from '@/components/game-phases/PlayersPhase'
import { VotingPhase } from '@/components/game-phases/VotingPhase'
import { ResultsPhase } from '@/components/game-phases/ResultsPhase'
import { RoundStatus } from '@/components/game/RoundStatus'
import { GameLayout } from '@/components/layout/GameLayout'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { room, players } = useRoom(code)
  const [roomId, setRoomId] = useState<string | undefined>()
  const round = useGameStore((s) => s.round)
  useRound(roomId)

  useEffect(() => {
    if (!code) return
    supabase.from('rooms').select('id').eq('code', code).single()
      .then(({ data }) => { if (data) setRoomId(data.id) })
  }, [code])

  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  if (!round || !room || !userId || !code) return null

  const isNarrator = round.narrator_id === userId
  const status = round.status

  return (
    <GameLayout>
      <RoundStatus roundNumber={round.round_number} maxRounds={room.max_rounds} phase={status} />
      {status === 'narrator_turn' && (
        isNarrator
          ? <NarratorPhase roomCode={code} />
          : <PlayersPhase roomCode={code} narratorClue={null} isWaiting />
      )}
      {status === 'players_turn' && (
        <PlayersPhase roomCode={code} narratorClue={round.clue} isWaiting={isNarrator} />
      )}
      {status === 'voting' && <VotingPhase roomCode={code} userId={userId} />}
      {status === 'results' && <ResultsPhase roomCode={code} players={players} />}
    </GameLayout>
  )
}
```

- [ ] **Create `app/room/[code]/ended.tsx`** — fetches final `room_players` scores for this room code, shows `ScoreBoard`, winner announcement, "Volver al inicio" button → `router.replace('/(tabs)')`.

- [ ] **Verify**: play a full game with 3 simulators — narrator turn, players turn, voting, results, next round, game end

- [ ] **Commit**
```bash
git add src/components/game-phases/ src/components/game/ app/room/
git commit -m "feat: full game UI — all 4 phases + ended screen"
```

---

## Phase 7 — Gallery & Profile
*Testable milestone: generate and save cards to gallery, edit profile.*

---

### Task 18: Gallery Screen

**Files:**
- Modify: `app/(tabs)/gallery.tsx`

- [ ] **Implement `app/(tabs)/gallery.tsx`**:
  1. Fetch `gallery_cards` for current user on mount
  2. Show grid with `CardGrid` (read-only mode)
  3. "Generar carta" FAB opens a modal with `CardGenerator`
  4. On card selected: prompt for title → upload image to Supabase Storage → INSERT `gallery_cards` row with Storage URL
  5. Long press card → delete (with confirm dialog)

- [ ] **Upload to Supabase Storage**:
```typescript
async function saveToGallery(imageUrl: string, prompt: string, title: string) {
  // Fetch image blob from Pollinations URL
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  const fileName = `${userId}/${Date.now()}.jpg`

  const { data, error } = await supabase.storage
    .from('gallery')
    .upload(fileName, blob, { contentType: 'image/jpeg' })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(data.path)

  await supabase.from('gallery_cards').insert({ player_id: userId, image_url: publicUrl, prompt, title })
}
```

- [ ] **Create Storage bucket** `gallery` in Supabase dashboard (or via migration) with public access

- [ ] **Commit**
```bash
git add app/(tabs)/gallery.tsx
git commit -m "feat: gallery screen — generate, save to Storage, display, delete cards"
```

---

### Task 19: Profile Screen

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Implement `app/(tabs)/profile.tsx`** with 3 tabs:
  - **Profile**: display name input → `supabase.auth.updateUser({ data: { display_name } })` + update `profiles.username`
  - **Email** (anon upgrade or email change): `supabase.auth.updateUser({ email })` for upgrade; shows email verification reminder
  - **Password**: `supabase.auth.updateUser({ password })` — only shown if user has email

- [ ] **Add logout button**: `supabase.auth.signOut()` → redirects to `/(auth)/welcome`

- [ ] **Add delete account**: confirm dialog → `supabase.auth.admin.deleteUser(userId)` via Edge Function (service role required) → sign out

- [ ] **Commit**
```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: profile screen — display name, email upgrade, password, logout, delete account"
```

---

## Phase 8 — Polish & Production Readiness

---

### Task 20: Error Boundaries + Disconnection UI

- [ ] **Add `src/components/layout/GameLayout.tsx`** with back button guard (disabled during game), safe area, disconnection banner

- [ ] **Add Realtime reconnection toast**: in `useRoom` and `useRound`, listen to channel status changes and show toast when `CHANNEL_ERROR` or `CLOSED`

- [ ] **Commit**
```bash
git commit -m "feat: disconnection banner, back button guard, Realtime reconnection handling"
```

---

### Task 21: Final Integration Test

- [ ] **Full game test with 3 sessions**:
  - Session A creates room
  - Sessions B and C join
  - A starts game
  - Complete 2 full rounds
  - Verify scoreboard matches expected Dixit scoring
  - One player disconnects mid-game — verify game continues
  - Game ends, verify ended.tsx shows correct final scores

- [ ] **TypeScript check**
```bash
npx tsc --noEmit
```
Expected: zero errors

- [ ] **Final commit**
```bash
git add .
git commit -m "feat: Dixit AI Mobile v1 complete — private room multiplayer with AI image generation"
```

---

## Appendix: Environment Variables

| Variable | Where | Value |
|---|---|---|
| `supabaseUrl` | `app.json extra` | `http://127.0.0.1:54321` (local) |
| `supabaseAnonKey` | `app.json extra` | From `supabase start` output |
| `OPENAI_API_KEY` | Supabase secret | Your OpenAI key |
| `SUPABASE_URL` | Auto-set in Edge Functions | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-set in Edge Functions | — |

## Appendix: Key Commands

```bash
npx supabase start          # Start local Supabase
npx supabase db reset       # Re-apply all migrations
npx supabase gen types typescript --local > src/types/game.ts
npx supabase functions serve # Serve all Edge Functions locally
npx expo start              # Start Expo dev server
npx jest                    # Run unit tests
npx tsc --noEmit            # Type check
```
