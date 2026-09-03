import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function OnboardingPlaceholderScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.kicker}>Profile setup</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {"Let's set up your nutrition goals"}
        </Text>
        <Text style={styles.description}>
          Your account is ready. The full nutrition onboarding flow will collect your measurements,
          activity level, and goal in the next onboarding task.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8f3',
  },
  container: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  kicker: {
    color: '#1f7a54',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211b',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  description: {
    color: '#526057',
    fontSize: 16,
    lineHeight: 24,
  },
});
