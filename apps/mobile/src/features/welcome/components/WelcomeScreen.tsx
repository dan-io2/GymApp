import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.kicker}>GymApp</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Nutrition tracking for lifters
        </Text>
        <Text style={styles.description}>
          Track calories and macros with a fast mobile workflow built for the core food diary
          experience.
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  kicker: {
    color: '#1f7a54',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211b',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
    marginBottom: 16,
  },
  description: {
    color: '#526057',
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 340,
  },
});
