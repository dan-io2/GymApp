import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

type OnboardingTextInputProps = {
  accessibilityHint?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  value: string;
};

export function OnboardingTextInput({
  accessibilityHint,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  suffix,
  value,
}: OnboardingTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityHint={accessibilityHint}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8a968d"
          style={styles.input}
          value={value}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: '#17211b',
    fontSize: 15,
    fontWeight: '800',
  },
  inputRow: {
    alignItems: 'center',
    borderColor: '#d5ddd5',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 14,
  },
  input: {
    color: '#17211b',
    flex: 1,
    fontSize: 17,
    minHeight: 54,
  },
  suffix: {
    color: '#526057',
    fontSize: 15,
    fontWeight: '700',
  },
});
