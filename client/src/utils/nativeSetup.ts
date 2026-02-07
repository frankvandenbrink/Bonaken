import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function setupNative() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setBackgroundColor({ color: '#2c1810' });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (e) {
    console.warn('Status bar setup failed:', e);
  }
}
