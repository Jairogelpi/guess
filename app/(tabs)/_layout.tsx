import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { APP_TAB_ITEMS } from '@/constants/appChrome'
import { Background } from '@/components/layout/Background'
import { colors } from '@/constants/theme'

export default function TabsLayout() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <Background>
      <Tabs
        screenOptions={({ route }) => {
          const activeItem = APP_TAB_ITEMS.find((entry) => entry.route === route.name)
          const floatingBottomInset = Math.max(insets.bottom, 10)

          return {
            headerShown: false,
            sceneStyle: {
              backgroundColor: 'transparent',
            },
            tabBarBackground: () => null,
            tabBarStyle: {
              position: 'absolute',
              left: 18,
              right: 18,
              bottom: floatingBottomInset,
              height: 64,
              paddingBottom: 8,
              paddingTop: 6,
              borderTopWidth: 0,
              backgroundColor: 'transparent',
              elevation: 0,
              shadowOpacity: 0,
              overflow: 'visible',
            },
            tabBarActiveTintColor: colors.gold,
            tabBarInactiveTintColor: 'rgba(255, 228, 186, 0.38)',
            tabBarLabelStyle: styles.tabLabel,
            tabBarItemStyle: styles.tabItem,
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <MaterialCommunityIcons
                  name={activeItem?.icon ?? 'circle-outline'}
                  size={22}
                  color={focused ? colors.gold : color}
                />
              </View>
            ),
          }
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('home.playTitle', { defaultValue: 'Jugar' }) }} />
        <Tabs.Screen name="gallery" options={{ title: t('gallery.title') }} />
        <Tabs.Screen name="profile" options={{ title: t('profile.title') }} />
        <Tabs.Screen name="private" options={{ href: null }} />
        <Tabs.Screen name="quick-match" options={{ href: null }} />
      </Tabs>
    </Background>
  )
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 9,
    fontFamily: 'CinzelDecorative_700Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tabItem: {
    borderRadius: 14,
  },
  iconWrap: {
    width: 40,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(230, 184, 0, 0.14)',
  },
})
