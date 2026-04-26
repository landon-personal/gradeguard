/**
 * Haptic feedback utility — uses Vibration API where available (Android/some Chromebooks)
 * and falls back to nothing silently.
 */
export const haptic = {
  light: () => navigator.vibrate?.([10]),
  medium: () => navigator.vibrate?.([20]),
  success: () => navigator.vibrate?.([10, 50, 10]),
  error: () => navigator.vibrate?.([30, 30, 30]),
};