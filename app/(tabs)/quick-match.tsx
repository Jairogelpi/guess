import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { MatchFoundCountdown } from '@/components/matchmaking/MatchFoundCountdown'
import { PlayerCountPreferencePicker } from '@/components/matchmaking/PlayerCountPreferencePicker'
import { QuickMatchSearchingState } from '@/components/matchmaking/QuickMatchSearchingState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useGameActions } from '@/hooks/useGameActions'
import { useQuickMatch } from '@/hooks/useQuickMatch'
import { fonts, radii } from '@/constants/theme'

const COUNTDOWN_TOTAL_MS = 5_000
const MATCH_FOUND_COPY = 'partida encontrada'

export default function QuickMatchScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { userId } = useAuth()
  const { gameAction } = useGameActions()
  const { cancel, countdownRemainingMs, enqueue, matchedPlayers, phase, roomStatus, submitting, ticket } = useQuickMatch()
  const [displayName, setDisplayName] = useState('')
  const [preferredPlayerCount, setPreferredPlayerCount] = useState(4)
  const startRequestedRef = useRef(false)

  const trimmedName = displayName.trim()
  const progress = useMemo(
    () => (phase === 'matched' ? 1 - countdownRemainingMs / COUNTDOWN_TOTAL_MS : 0),
    [countdownRemainingMs, phase],
  )
  const matchedRoomCode = ticket?.matched_room_code ?? null
  const isHost = matchedPlayers.some((player) => player.playerId === userId && player.isHost)
  const countdownFinished = phase === 'matched' && countdownRemainingMs === 0

  useEffect(() => {
    if (roomStatus === 'playing' && matchedRoomCode) {
      router.replace(`/room/${matchedRoomCode}/game`)
    }
  }, [matchedRoomCode, roomStatus, router])

  useEffect(() => {
    if (!countdownFinished || !matchedRoomCode || !isHost || roomStatus === 'playing' || startRequestedRef.current) {
      return
    }

    startRequestedRef.current = true
    void gameAction(matchedRoomCode, 'start_game').then((ok) => {
      if (ok) {
        router.replace(`/room/${matchedRoomCode}/game`)
        return
      }

      startRequestedRef.current = false
    })
  }, [countdownFinished, gameAction, isHost, matchedRoomCode, roomStatus, router])

  async function handleEnqueue() {
    if (!trimmedName) return
    await enqueue({ displayName: trimmedName, preferredPlayerCount })
  }

  return (
    <>
      <AppHeader title={t('home.quickMatch', { defaultValue: 'Partida rapida' })} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.title}>{t('home.quickMatch', { defaultValue: 'Partida rapida' })}</Text>
              <Text style={styles.copy}>
                {t('home.quickMatchFlexibleCopy', {
                  defaultValue: 'Elige tu preferencia de jugadores. Intentaremos respetarla y ampliaremos un poco la busqueda si hace falta.',
                })}
              </Text>
            </View>

            <Input
              label={t('home.yourName')}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={30}
              autoCapitalize="words"
              testID="quick-match-display-name-input"
            />

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>preferencia de jugadores</Text>
              <PlayerCountPreferencePicker value={preferredPlayerCount} onChange={setPreferredPlayerCount} />
            </View>

            {phase === 'matched' ? (
              <>
                <Text style={styles.matchFoundCopy}>{MATCH_FOUND_COPY}</Text>
                <MatchFoundCountdown players={matchedPlayers} progress={progress} />
                <View style={styles.card}>
                  <Text style={styles.searchingTitle}>preparando partida</Text>
                  <Text style={styles.copy}>
                    {countdownFinished
                      ? isHost
                        ? 'Estamos lanzando la partida para todos los jugadores.'
                        : 'Los jugadores ya se han encontrado. Espera unos segundos mientras arranca la partida.'
                      : 'Jugadores encontrados. La partida comenzara en cuanto termine la cuenta atras.'}
                  </Text>
                </View>
              </>
            ) : null}

            {phase === 'searching' ? (
              <QuickMatchSearchingState
                preferredPlayerCount={ticket?.preferred_player_count ?? preferredPlayerCount}
                onCancel={() => void cancel()}
                submitting={submitting}
              />
            ) : (
              <Button
                onPress={() => void handleEnqueue()}
                loading={submitting}
                disabled={!trimmedName}
                testID="quick-match-enqueue-button"
              >
                {t('home.quickMatch', { defaultValue: 'Partida rapida' })}
              </Button>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 120,
  },
  card: {
    gap: 12,
    backgroundColor: 'rgba(18, 8, 4, 0.78)',
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(189, 148, 102, 0.42)',
  },
  title: {
    color: '#fff1d9',
    fontFamily: fonts.titleHeavy,
    fontSize: 22,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  copy: {
    color: '#e7d5c1',
    fontFamily: fonts.title,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  sectionLabel: {
    color: '#f4e6d0',
    fontSize: 12,
    letterSpacing: 2.5,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
  },
  searchingTitle: {
    color: '#fff1d9',
    fontFamily: fonts.titleHeavy,
    fontSize: 17,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  matchFoundCopy: {
    color: '#e6b870',
    fontFamily: fonts.title,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
})
