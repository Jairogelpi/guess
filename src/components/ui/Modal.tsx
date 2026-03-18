import { Modal as RNModal, View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { brandColors } from '@/constants/brand'
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
              <DecorativeTitle variant="screen" tone="gold" style={styles.title}>
                {title}
              </DecorativeTitle>
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
    backgroundColor: 'rgba(8, 4, 2, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: 'rgba(18, 10, 6, 0.98)',
    borderRadius: radii.xl,
    width: '100%',
    maxHeight: '88%',
    borderWidth: 1.75,
    borderColor: brandColors.goldStrongBorder,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
    gap: 10,
  },
  title: {
    marginBottom: 2,
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
