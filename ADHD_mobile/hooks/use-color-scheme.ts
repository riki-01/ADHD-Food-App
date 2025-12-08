/**
 * Always returns 'light' theme for consistency across the app
 */
export function useColorScheme() {
  return 'light' as const;
}
