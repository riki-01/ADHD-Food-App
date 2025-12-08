/**
 * Always returns 'light' theme for consistency across web platform
 */
export function useColorScheme() {
  return 'light' as const;
}
