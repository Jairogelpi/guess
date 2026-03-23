import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import i18n from '@/i18n'
import { colors, fonts } from '@/constants/theme'

interface Props {
  children: React.ReactNode
  /** Shown in console logs to identify which phase crashed. */
  phaseName: string
}

interface State {
  hasError: boolean
}

/**
 * Class-based error boundary wrapping individual game phases.
 * If a phase component throws during render, this catches it and shows
 * a fallback instead of crashing the entire game screen.
 */
export class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[GameErrorBoundary] Phase "${this.props.phaseName}" crashed:`,
      error,
      info.componentStack,
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{i18n.t('errors.phaseCrashTitle')}</Text>
          <Text style={styles.subtitle}>{i18n.t('errors.phaseCrashBody')}</Text>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.title,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
})
