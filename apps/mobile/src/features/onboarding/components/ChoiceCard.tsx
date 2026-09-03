import { Pressable, StyleSheet, Text, View } from 'react-native';

type ChoiceCardProps<T extends string> = {
  description?: string;
  isSelected: boolean;
  onSelect: (value: T) => void;
  title: string;
  value: T;
};

export function ChoiceCard<T extends string>({
  description,
  isSelected,
  onSelect,
  title,
  value,
}: ChoiceCardProps<T>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelect(value)}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.radio, isSelected && styles.radioSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderColor: '#d5ddd5',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    minHeight: 64,
    padding: 16,
  },
  selected: {
    backgroundColor: '#edf8f1',
    borderColor: '#1f8a5b',
  },
  pressed: {
    opacity: 0.88,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#17211b',
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: '#526057',
    fontSize: 14,
    lineHeight: 20,
  },
  radio: {
    borderColor: '#9aa79d',
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  radioSelected: {
    backgroundColor: '#1f8a5b',
    borderColor: '#1f8a5b',
  },
});
