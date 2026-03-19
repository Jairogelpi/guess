import { Modal as RNModal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import { colors, radii } from '@/constants/theme'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sheet}
          onPress={() => {}}
        >
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.divider} />
            </View>
          )}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,6,2,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: radii.xl,
    width: '100%',
    maxHeight: '88%',
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 10,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.goldBorder,
  },
  scroll: { flexGrow: 0 },
  content: {
    padding: 20,
    gap: 14,
  },
})
