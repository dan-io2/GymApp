import { StyleSheet, Text, View } from 'react-native';

type AuthMessageProps = {
  message: string;
  tone: 'error' | 'success';
};

export function AuthMessage({ message, tone }: AuthMessageProps) {
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      style={[styles.container, tone === 'error' ? styles.errorContainer : styles.successContainer]}
    >
      <Text style={[styles.text, tone === 'error' ? styles.errorText : styles.successText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorContainer: {
    backgroundColor: '#fff4f2',
    borderColor: '#f3b5ad',
  },
  successContainer: {
    backgroundColor: '#edf8f1',
    borderColor: '#a8d9ba',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#8a1f13',
  },
  successText: {
    color: '#1d6b43',
  },
});
