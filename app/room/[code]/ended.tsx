import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { AppHeader } from '@/components/layout/AppHeader'
import { Background } from '@/components/layout/Background'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/theme'
import { buildLeaveRoomConfirmCopy } from '@/lib/leaveRoomConfirm'
import { useConfirmRoomExit } from '@/hooks/useConfirmRoomExit'
import type { RoomPlayer } from '@/types/game'

export default function EndedScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [winner, setWinner] = useState<string | null>(null)

  useConfirmRoomExit({
    enabled: true,
    t,
    onConfirmExit: () => {
      router.replace('/(tabs)')
    },
  })

  useEffect(() => {
    if (!code) return
    supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .single()
      .then(async ({ data: room }) => {
        if (!room) return
        const { data } = await supabase
          .from('room_players')
          .select('*')
          .eq('room_id', room.id)
          .order('score', { ascending: false })
        if (data) {
          setPlayers(data as RoomPlayer[])
          setWinner((data as RoomPlayer[])[0]?.display_name ?? null)
        }
      })
  }, [code])

  function handleGoHome() {
    const copy = buildLeaveRoomConfirmCopy(t)

    Alert.alert(copy.title, copy.message, [
      { text: copy.cancelLabel, style: 'cancel' },
      {
        text: copy.confirmLabel,
        style: 'destructive',
        onPress: () => router.replace('/(tabs)'),
      },
    ])
  }

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <AppHeader title={t('ended.title')} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.trophy}>🏆</Text>
            <DecorativeTitle variant="eyebrow" tone="gold" style={styles.eyebrow}>
              {t('ended.gameOver')}
            </DecorativeTitle>
            {winner && (
              <DecorativeTitle variant="screen" tone="plain" style={styles.winner}>
                {winner}
              </DecorativeTitle>
            )}
            <View style={styles.divider} />
          </View>

          <View style={styles.scoreCard}>
            <DecorativeTitle variant="eyebrow" tone="muted" align="left" style={styles.scoreLabel}>
              {t('ended.finalScore')}
            </DecorativeTitle>
            <ScoreBoard players={players} />
          </View>

          <Button onPress={handleGoHome}>
            {t('ended.goHome')}
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    gap: 24,
    padding: 24,
    paddingTop: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  trophy: {
    fontSize: 64,
  },
  eyebrow: {
    letterSpacing: 3.4,
  },
  winner: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 1.5,
    backgroundColor: colors.gold,
    opacity: 0.6,
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  scoreLabel: {
    paddingHorizontal: 2,
    letterSpacing: 2.6,
  },
})
