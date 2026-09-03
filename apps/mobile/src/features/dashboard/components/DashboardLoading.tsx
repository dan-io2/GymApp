import { StyleSheet, Text, View } from 'react-native';

export function DashboardLoading() {
  return (
    <View accessibilityLabel="Loading nutrition dashboard" style={styles.container}>
      <Text style={styles.kicker}>Loading</Text>
      <View style={styles.heroBlock} />
      <View style={styles.row}>
        <View style={styles.smallBlock} />
        <View style={styles.smallBlock} />
        <View style={styles.smallBlock} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  kicker: {
    color: '#1f8a5b',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroBlock: {
    backgroundColor: '#e2e9e4',
    borderRadius: 8,
    height: 168,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  smallBlock: {
    backgroundColor: '#e8eee9',
    borderRadius: 8,
    flex: 1,
    height: 114,
  },
});
