import { Pressable, StyleSheet, Text, View } from 'react-native';

const ACTIONS = ['Find Food', "Today's Diary", 'Scan Barcode'] as const;

type QuickActionsProps = {
  onDiary: () => void;
  onFindFood: () => void;
  onScanBarcode: () => void;
};

export function QuickActions({ onDiary, onFindFood, onScanBarcode }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actions}>
        {ACTIONS.map((action) => {
          const isFindFood = action === 'Find Food';
          const isDiary = action === "Today's Diary";

          return (
            <Pressable
              accessibilityHint={
                isFindFood
                  ? 'Open food search and manual lookup'
                  : isDiary
                    ? "Open today's food diary"
                    : 'Open camera barcode scanner'
              }
              accessibilityLabel={action}
              accessibilityRole="button"
              key={action}
              onPress={isFindFood ? onFindFood : isDiary ? onDiary : onScanBarcode}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Text style={styles.actionTitle}>{action}</Text>
              <Text style={styles.actionMeta}>Open</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    color: '#17211b',
    fontSize: 18,
    fontWeight: '900',
  },
  actions: {
    gap: 10,
  },
  action: {
    alignItems: 'center',
    backgroundColor: '#eaf2ec',
    borderColor: '#cfe0d4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  actionTitle: {
    color: '#17211b',
    fontSize: 16,
    fontWeight: '900',
  },
  actionMeta: {
    color: '#1f8a5b',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
