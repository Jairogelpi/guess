import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Share,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useGameActions } from '@/hooks/useGameActions'
import { useConfirmRoomExit } from '@/hooks/useConfirmRoomExit'
import { useUIStore } from '@/stores/useUIStore'
import {
  areAllGuestsReady,
  getBlockingLobbyPlayers,
  getLobbyHydrationPhase,
  getLobbyStartState,
  getPlayersNeededToStart,
} from '@/lib/lobbyState'
import { Button } from '@/components/ui/Button'
import { Background } from '@/components/layout/Background'
import { AppHeader } from '@/components/layout/AppHeader'
import { PlayerList } from '@/components/game/PlayerList'
import { ChatPanel } from '@/components/game/ChatPanel'
import { Avatar } from '@/components/ui/Avatar'
import { colors, fonts, radii } from '@/constants/theme'
import { buildLeaveRoomConfirmCopy } from '@/lib/leaveRoomConfirm'
import type { RoomPlayer } from '@/types/game'

export default function LobbyScreen() {
  const { code, quickMatch } = useLocalSearchParams<{ code: string; quickMatch?: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const { room, players, hydratingPlayers, roomNotFound, roomLoadFailed, refresh } = useRoom(code ?? null)
  const { leaveRoom, gameAction } = useGameActions()
  const { userId } = useAuth()
  const [starting, setStarting] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<RoomPlayer | null>(null)
  const autoStartTriggered = useRef(false)

  const hydrationPhase = getLobbyHydrationPhase({
    roomResolved: room !== null,
    hydratingPlayers,
    roomNotFound,
    roomLoadFailed,
  })

  const isHost = !!(room?.host_id && userId && room.host_id === userId)
  const activeCount = players.length
  const allGuestsReady = areAllGuestsReady(players)
  const blockingPlayers = getBlockingLobbyPlayers(players)
  const currentPlayer = players.find((player) => player.player_id === userId) ?? null
  const startState = getLobbyStartState({ isHost, activeCount, hydratingPlayers, allGuestsReady })
  const playersNeeded = getPlayersNeededToStart(activeCount)
  const canStart = isHost && !hydratingPlayers && activeCount >= 3 && allGuestsReady
  const isQuickMatchHandoff = quickMatch === '1'

  const { allowNextNavigation } = useConfirmRoomExit({
    enabled: !!code,
    t,
    onConfirmExit: async () => {
      if (!code) return
      await leaveRoom(code)
      router.replace('/(tabs)')
    },
  })

  useEffect(() => {
    if (room?.status === 'playing') {
      allowNextNavigation()
      router.replace(`/room/${code}/game`)
      return
    }

    if (room?.status === 'ended') {
      allowNextNavigation()
      router.replace(`/room/${code}/ended`)
    }
  }, [allowNextNavigation, code, room?.status, router])

  useEffect(() => {
    if (!code || !isQuickMatchHandoff || !isHost || !canStart || starting || autoStartTriggered.current) {
      return
    }

    autoStartTriggered.current = true
    setStarting(true)

    void gameAction(code, 'start_game')
      .then(async (ok) => {
        if (ok) {
          allowNextNavigation()
          router.replace(`/room/${code}/game`)
        } else {
          autoStartTriggered.current = false
          await refresh()
        }
      })
      .finally(() => {
        setStarting(false)
      })
  }, [allowNextNavigation, canStart, code, gameAction, isHost, isQuickMatchHandoff, refresh, router, starting])

  async function handleStart() {
    if (!code || !canStart) return

    setStarting(true)
    try {
      const ok = await gameAction(code, 'start_game')
      if (ok) {
        allowNextNavigation()
        router.replace(`/room/${code}/game`)
      } else {
        await refresh()
      }
    } finally {
      setStarting(false)
    }
  }

  async function handleReadyToggle(nextReady: boolean) {
    if (!code || !currentPlayer || currentPlayer.is_host) return
    const ok = await gameAction(code, 'set_ready', { ready: nextReady })
    if (ok) {
      await refresh()
    }
  }

  async function handleLeave() {
    if (!code) return
    const copy = buildLeaveRoomConfirmCopy(t)

    Alert.alert(copy.title, copy.message, [
      { text: copy.cancelLabel, style: 'cancel' },
      {
        text: copy.confirmLabel,
        style: 'destructive',
        onPress: () => {
          void leaveRoom(code).then(() => {
            router.replace('/(tabs)')
          })
        },
      },
    ])
  }

  async function handleCopyCode() {
    if (!code) return
    const clipboard = globalThis.navigator?.clipboard
    if (clipboard?.writeText) {
      await clipboard.writeText(code)
    } else {
      await Share.share({ message: code })
    }
    showToast(t('lobby.codeCopied'), 'success')
  }

  async function handleShare() {
    if (!code) return
    const deepLink = Linking.createURL(`/room/${code}/lobby`)
    await Share.share({
      message: `${t('lobby.inviteMessage', { code })}\n${deepLink}`,
      url: deepLink,
    })
  }

  if (hydrationPhase === 'room-unresolved') {
    return (
      <Background>
        <SafeAreaView style={styles.centeredScreen} edges={['bottom']}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>{t('lobby.preparation')}</Text>
        </SafeAreaView>
      </Background>
    )
  }

  if (hydrationPhase === 'room-not-found') {
    return (
      <Background>
        <SafeAreaView style={styles.centeredScreen} edges={['bottom']}>
          <Text style={styles.errorTitle}>{t('lobby.notFound')}</Text>
          <Button onPress={() => router.replace('/(tabs)')} variant="ghost">
            {t('common.back')}
          </Button>
        </SafeAreaView>
      </Background>
    )
  }

  if (hydrationPhase === 'room-load-failed') {
    return (
      <Background>
        <SafeAreaView style={styles.centeredScreen} edges={['bottom']}>
          <Text style={styles.errorTitle}>{t('lobby.loadFailed')}</Text>
          <Button onPress={() => router.replace('/(tabs)')} variant="ghost">
            {t('common.back')}
          </Button>
        </SafeAreaView>
      </Background>
    )
  }

  const statusCopy = hydratingPlayers
    ? t('lobby.preparation')
    : startState === 'host_preparation'
      ? t('lobby.preparation')
      : startState === 'host_waiting_for_more_players'
        ? t('lobby.hostWaiting', { count: playersNeeded })
        : startState === 'host_waiting_for_ready_players'
          ? t('lobby.hostWaitingReady', {
            names: blockingPlayers.map((player) => player.display_name).join(', '),
          })
          : startState === 'host_ready'
            ? t('lobby.hostReady')
            : currentPlayer?.is_ready
              ? t('lobby.readySubmitted')
              : t('lobby.guestWaiting')

  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <AppHeader title={t('lobby.title')} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>{t('lobby.roomCode')}</Text>
              <TouchableOpacity
                onPress={handleCopyCode}
                activeOpacity={0.76}
                style={styles.codeBlock}
              >
                <Text style={styles.codeText}>{code}</Text>
                <Text style={styles.copyHint}>{t('lobby.tapToShare')}</Text>
              </TouchableOpacity>
              <Button
                onPress={handleShare}
                variant="secondary"
              >
                {t('lobby.shareInviteLink')}
              </Button>
              <View style={styles.rulePill}>
                <Text style={styles.ruleText}>{t('lobby.roomRules')}</Text>
              </View>
              <Text style={styles.statusCopy}>{statusCopy}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>
                {t('lobby.playerCount', { count: activeCount })}
              </Text>
              {hydratingPlayers ? (
                <View style={styles.rosterPrep}>
                  <ActivityIndicator color={colors.goldDim} size="small" />
                  <Text style={styles.rosterPrepText}>{t('lobby.preparation')}</Text>
                </View>
              ) : players.length > 0 ? (
                <PlayerList players={players} onPlayerPress={setSelectedPlayer} />
              ) : (
                <View style={styles.rosterPrep}>
                  <Text style={styles.rosterPrepText}>{t('lobby.preparation')}</Text>
                </View>
              )}
            </View>

            <View style={styles.actionCard}>
              {hydratingPlayers ? (
                <View style={styles.actionPrep}>
                  <ActivityIndicator color={colors.gold} size="small" />
                  <Text style={styles.helperText}>{t('lobby.preparation')}</Text>
                </View>
              ) : isHost ? (
                <>
                  <Text style={styles.helperText}>{statusCopy}</Text>
                  <Button
                    onPress={handleStart}
                    loading={starting}
                    disabled={!canStart}
                    testID="lobby-start-game-button"
                  >
                    {t('lobby.startGame')}
                  </Button>
                  {!canStart && (
                    <Text style={styles.hintText}>
                      {activeCount < 3 ? t('errors.MIN_PLAYERS_REQUIRED') : t('errors.PLAYERS_NOT_READY')}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.waitingText}>{statusCopy}</Text>
                  {!currentPlayer?.is_ready ? (
                    <>
                      <Text style={styles.helperText}>{t('lobby.guestReadyHint')}</Text>
                      <Button onPress={() => void handleReadyToggle(true)} variant="secondary" testID="lobby-ready-button">
                        {t('lobby.readyUp')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Text style={styles.helperText}>{t('lobby.guestHint')}</Text>
                      <Button onPress={() => void handleReadyToggle(false)} variant="ghost" testID="lobby-unready-button">
                        {t('lobby.undoReady')}
                      </Button>
                    </>
                  )}
                </>
              )}
            </View>

            {room?.id && (
              <ChatPanel
                roomId={room.id}
                roomStatus={room.status}
                currentPlayer={currentPlayer}
                players={players}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button onPress={handleLeave} variant="ghost">
              {t('lobby.leave')}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={!!selectedPlayer}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPlayer(null)}
        >
          <View style={styles.profileModal}>
            <View style={styles.modalContent}>
              <View style={styles.largeAvatarGlow}>
                <Avatar
                  uri={selectedPlayer?.profiles?.avatar_url}
                  name={selectedPlayer?.display_name}
                  size={180}
                  borderColor={colors.gold}
                />
              </View>
              <Text style={styles.profileName}>{selectedPlayer?.display_name}</Text>
              {selectedPlayer?.is_host && (
                <View style={styles.modalHostPill}>
                  <Text style={styles.modalHostBadge}>HOST</Text>
                </View>
              )}
              <Button
                onPress={() => setSelectedPlayer(null)}
                variant="secondary"
                style={{ marginTop: 24, paddingVertical: 10 }}
              >
                {t('common.back')}
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: fonts.title,
  },
  errorTitle: {
    color: colors.goldLight,
    fontSize: 22,
    fontFamily: fonts.titleHeavy,
    textAlign: 'center',
  },
  scroll: {
    gap: 14,
    padding: 16,
    paddingBottom: 8,
  },
  heroCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.4)',
    borderRadius: radii.xl,
    padding: 24,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  eyebrow: {
    color: colors.goldLight,
    fontSize: 15,
    letterSpacing: 6,
    fontFamily: fonts.titleHeavy,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  codeBlock: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(10, 5, 0, 0.5)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.goldDim,
    width: '100%',
  },
  codeText: {
    color: colors.goldLight,
    fontSize: 54,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(230, 184, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  copyHint: {
    color: colors.goldDim,
    fontSize: 12,
    letterSpacing: 3,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  shareButton: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  shareButtonText: {
    color: colors.goldLight,
    fontSize: 13,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  rulePill: {
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ruleText: {
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: fonts.titleHeavy,
    textTransform: 'uppercase',
  },
  statusCopy: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.title,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.3)',
    borderRadius: radii.xl,
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    color: colors.goldLight,
    fontSize: 13,
    letterSpacing: 4,
    fontFamily: fonts.titleHeavy,
    textTransform: 'uppercase',
  },
  rosterPrep: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  rosterPrepText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.title,
  },
  actionCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.3)',
    borderRadius: radii.xl,
    padding: 20,
    gap: 12,
  },
  actionPrep: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.title,
    lineHeight: 20,
    textAlign: 'center',
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.title,
    textAlign: 'center',
  },
  waitingText: {
    color: colors.goldLight,
    fontSize: 18,
    fontFamily: fonts.titleHeavy,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  profileModal: {
    width: '100%',
    backgroundColor: colors.surfaceDeep,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.45)',
    overflow: 'hidden',
  },
  modalContent: {
    paddingVertical: 42,
    alignItems: 'center',
    gap: 20,
  },
  largeAvatarGlow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    borderRadius: 999,
  },
  profileName: {
    color: colors.goldLight,
    fontSize: 28,
    fontFamily: fonts.titleHeavy,
    textAlign: 'center',
    marginTop: 8,
  },
  modalHostPill: {
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(230, 184, 0, 0.08)',
  },
  modalHostBadge: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2.5,
  },
})
