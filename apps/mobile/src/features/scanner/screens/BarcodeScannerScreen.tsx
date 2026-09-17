import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
  type GestureResponderEvent,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AddFoodPanel } from '@/features/diary/components/AddFoodPanel';
import { FoodDetail } from '@/features/food-search/components/FoodDetail';
import { mapFoodSearchResultToFood } from '@/features/food-search/utils/foodSearchMapping';

import { useBarcodeScanner, type BarcodeScannerStatus } from '../hooks/useBarcodeScanner';

const SUPPORTED_BARCODE_TYPES: BarcodeType[] = ['upc_a', 'upc_e', 'ean13', 'ean8'];

export function BarcodeScannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState === 'background' || AppState.currentState === 'inactive'
      ? AppState.currentState
      : 'active',
  );
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const isCameraReady = Boolean(permission?.granted && isScreenFocused && appState === 'active');
  const handleFirstDetection = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
      // Haptics are best-effort feedback and should never block scanning.
    });
  }, []);
  const scanner = useBarcodeScanner(undefined, {
    isActive: isCameraReady,
    onFirstDetection: handleFirstDetection,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);

    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      return () => {
        setIsScreenFocused(false);
      };
    }, []),
  );

  function openManualBarcodeLookup() {
    router.push('/find-food?mode=barcode');
  }

  function resetScanner() {
    setIsAddingFood(false);
    setCameraError(null);
    scanner.resetScanner();
  }

  if (scanner.food && scanner.status === 'success') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Header onBack={() => router.back()} />

          {isAddingFood ? (
            <View style={styles.addFoodSection}>
              <SecondaryButton label="Back to Product" onPress={() => setIsAddingFood(false)} />
              <AddFoodPanel
                food={mapFoodSearchResultToFood(scanner.food)}
                onAdded={() => router.replace('/diary')}
                userId={user?.id}
              />
            </View>
          ) : (
            <FoodDetail
              backLabel="Scan Again"
              food={scanner.food}
              onAddToDiary={() => setIsAddingFood(true)}
              onBack={resetScanner}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header onBack={() => router.back()} />

        {!permission ? (
          <PermissionPanel
            body="GymApp needs camera access to scan food barcodes with your iPhone camera."
            onAllowCamera={requestPermission}
            onManualLookup={openManualBarcodeLookup}
            title="Camera permission"
          />
        ) : null}

        {permission?.status === 'undetermined' ? (
          <PermissionPanel
            body="Allow camera access so GymApp can detect UPC and EAN barcodes on food packages."
            onAllowCamera={requestPermission}
            onManualLookup={openManualBarcodeLookup}
            title="Scan food barcodes"
          />
        ) : null}

        {permission && !permission.granted && permission.status !== 'undetermined' ? (
          <DeniedPanel onManualLookup={openManualBarcodeLookup} />
        ) : null}

        {permission?.granted ? (
          <View style={styles.scannerSection}>
            <View style={styles.cameraFrame}>
              <CameraView
                active={isCameraReady && scanner.isScanningEnabled}
                barcodeScannerSettings={{
                  barcodeTypes: SUPPORTED_BARCODE_TYPES,
                }}
                enableTorch={torchEnabled}
                facing="back"
                onBarcodeScanned={
                  isCameraReady && scanner.isScanningEnabled
                    ? scanner.handleBarcodeScanned
                    : undefined
                }
                onMountError={(event) => {
                  setCameraError(event.message);
                }}
                style={styles.camera}
              />
              <ScanGuideOverlay
                barcode={scanner.barcode}
                isScanning={scanner.isScanningEnabled}
                status={scanner.status}
              />
            </View>

            <Text style={styles.helpText}>Align the barcode inside the frame.</Text>

            {scanner.barcode ? (
              <View accessibilityLiveRegion="polite" style={styles.detectionCard}>
                <Text style={styles.detectionTitle}>Barcode detected</Text>
                <Text style={styles.detectedText}>{scanner.barcode}</Text>
                {scanner.status === 'looking_up' || scanner.status === 'detected' ? (
                  <Text style={styles.detectionSubtext}>Finding product...</Text>
                ) : null}
              </View>
            ) : null}

            {cameraError ? <AuthMessage message={cameraError} tone="error" /> : null}
            {scanner.errorMessage ? (
              <AuthMessage message={scanner.errorMessage} tone="error" />
            ) : null}

            {scanner.status === 'not_found' || scanner.status === 'error' ? (
              <PrimaryButton label="Scan Again" onPress={resetScanner} />
            ) : null}

            <View style={styles.buttonRow}>
              <SecondaryButton
                accessibilityLabel={torchEnabled ? 'Turn flash off' : 'Turn flash on'}
                label={torchEnabled ? 'Flash On' : 'Flash Off'}
                onPress={() => setTorchEnabled((enabled) => !enabled)}
              />
              <SecondaryButton
                accessibilityLabel="Enter barcode manually"
                label="Enter Barcode Manually"
                onPress={openManualBarcodeLookup}
              />
            </View>

            <View style={styles.troubleCard}>
              <Text style={styles.troubleTitle}>Having trouble?</Text>
              <Text style={styles.troubleText}>
                Try better lighting, hold the package steady, or enter the barcode manually.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScanGuideOverlay({
  barcode,
  isScanning,
  status,
}: {
  barcode: string | null;
  isScanning: boolean;
  status: BarcodeScannerStatus;
}) {
  const scanLineProgress = useMemo(() => new Animated.Value(0), []);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const shouldAnimate = isScanning && status === 'ready' && !reduceMotionEnabled;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!shouldAnimate) {
      scanLineProgress.stopAnimation();
      return;
    }

    scanLineProgress.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineProgress, {
          duration: 1550,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineProgress, {
          duration: 1550,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [scanLineProgress, shouldAnimate]);

  const scanLineTranslateY = scanLineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-54, 54],
  });
  const isDetected = Boolean(barcode && status !== 'ready');

  return (
    <View pointerEvents="none" style={styles.overlay} testID="barcode-scan-overlay">
      <View style={styles.dimTop} />
      <View style={styles.middleOverlayRow}>
        <View style={styles.dimSide} />
        <View style={[styles.scanBox, isDetected && styles.scanBoxDetected]}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          {shouldAnimate ? (
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
              testID="barcode-scan-line"
            />
          ) : null}
          {isDetected ? <Text style={styles.scanBoxText}>Detected</Text> : null}
        </View>
        <View style={styles.dimSide} />
      </View>
      <View style={styles.dimBottom} />
    </View>
  );
}

function Header({ onBack }: { onBack: (event: GestureResponderEvent) => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Back"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        Scan Barcode
      </Text>
    </View>
  );
}

function PermissionPanel({
  body,
  onAllowCamera,
  onManualLookup,
  title,
}: {
  body: string;
  onAllowCamera: () => Promise<unknown>;
  onManualLookup: () => void;
  title: string;
}) {
  return (
    <View style={styles.permissionPanel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelBody}>{body}</Text>
      <PrimaryButton label="Allow Camera" onPress={() => void onAllowCamera()} />
      <SecondaryButton label="Enter Barcode Manually" onPress={onManualLookup} />
    </View>
  );
}

function DeniedPanel({ onManualLookup }: { onManualLookup: () => void }) {
  return (
    <View style={styles.permissionPanel}>
      <Text style={styles.panelTitle}>Camera access is required to scan barcodes.</Text>
      <Text style={styles.panelBody}>
        You can enable camera access in Settings or keep using manual barcode lookup.
      </Text>
      <PrimaryButton label="Open Settings" onPress={() => void Linking.openSettings()} />
      <SecondaryButton label="Enter Barcode Manually" onPress={onManualLookup} />
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  accessibilityLabel,
  label,
  onPress,
}: {
  accessibilityLabel?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  backText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    flex: 1,
  },
  scannerSection: {
    gap: spacing.sm,
  },
  cameraFrame: {
    aspectRatio: 0.72,
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  overlay: {
    bottom: 0,
    elevation: 2,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  dimTop: {
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    flex: 1,
  },
  middleOverlayRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  dimSide: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    flex: 1,
  },
  dimBottom: {
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    flex: 1,
  },
  scanBox: {
    alignItems: 'center',
    aspectRatio: 1.65,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radii.card,
    borderWidth: 1,
    justifyContent: 'center',
    maxWidth: 340,
    overflow: 'hidden',
    width: '78%',
  },
  scanBoxDetected: {
    backgroundColor: 'rgba(118, 227, 166, 0.15)',
    borderColor: colors.accent,
  },
  corner: {
    borderColor: colors.textPrimary,
    height: 34,
    position: 'absolute',
    width: 34,
  },
  cornerTopLeft: {
    borderLeftWidth: 4,
    borderTopWidth: 4,
    left: 8,
    top: 8,
  },
  cornerTopRight: {
    borderRightWidth: 4,
    borderTopWidth: 4,
    right: 8,
    top: 8,
  },
  cornerBottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    bottom: 8,
    left: 8,
  },
  cornerBottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    bottom: 8,
    right: 8,
  },
  scanLine: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 3,
    opacity: 0.92,
    position: 'absolute',
    width: '82%',
  },
  scanBoxText: {
    ...typography.caption,
    color: colors.textPrimary,
    letterSpacing: 0,
  },
  helpText: {
    ...typography.secondary,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detectionCard: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.xxs,
    padding: spacing.sm,
  },
  detectionTitle: {
    ...typography.caption,
    color: colors.success,
    textTransform: 'uppercase',
  },
  detectedText: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  detectionSubtext: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  buttonRow: {
    gap: spacing.xs,
  },
  troubleCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  troubleTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  troubleText: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  permissionPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  panelTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  panelBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    ...typography.bodyStrong,
    color: colors.accentText,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  addFoodSection: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.82,
  },
});
