import NetInfo from '@react-native-community/netinfo';

/**
 * Check if device is offline
 */
export async function isOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !state.isConnected;
}

/**
 * Subscribe to network state changes
 */
export function subscribeToNetwork(callback: (isConnected: boolean) => void) {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected ?? false);
  });
}
