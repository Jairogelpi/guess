import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { Button } from '@/components/ui/Button'
import { Background } from '@/components/layout/Background'
import { colors } from '@/constants/theme'
import type { RoomPlayer } from '@/types/game'

export default function EndedScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [winner, setWinner] = useState<string | null>(null)

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

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Trophy */}
          <View style={styles.hero}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.eyebrow}>{t('ended.gameOver')}</Text>
            {winner && <Text style={styles.winner}>{winner}</Text>}
            <View style={styles.divider} />
          </View>

          {/* Final scoreboard */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>{t('ended.finalScore')}</Text>
            <ScoreBoard players={players} />
          </View>

          <Button onPress={() => router.replace('/(tabs)')}>
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
    paddingTop: 40,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  trophy: {
    fontSize: 64,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: '600',
  },
  winner: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
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
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
})
