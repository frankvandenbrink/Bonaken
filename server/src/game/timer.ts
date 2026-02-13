import type { GameState } from 'shared';

interface ActiveTimer {
  gameId: string;
  timeout: NodeJS.Timeout;
  deadline: number;
}

const activeTimers = new Map<string, ActiveTimer>();

/**
 * Start een beurt-timer voor een spel
 * @param gameId - Het spel ID
 * @param seconds - Aantal seconden
 * @param onExpire - Callback wanneer de timer afloopt
 * @returns De deadline timestamp (ms)
 */
export function startTimer(
  gameId: string,
  seconds: number,
  onExpire: () => void
): number {
  // Cancel bestaande timer
  cancelTimer(gameId);

  const deadline = Date.now() + seconds * 1000;

  const timeout = setTimeout(() => {
    activeTimers.delete(gameId);
    onExpire();
  }, seconds * 1000);

  activeTimers.set(gameId, { gameId, timeout, deadline });

  return deadline;
}

/**
 * Cancel een actieve timer
 */
export function cancelTimer(gameId: string): void {
  const timer = activeTimers.get(gameId);
  if (timer) {
    clearTimeout(timer.timeout);
    activeTimers.delete(gameId);
  }
}

/**
 * Haal resterende tijd op (ms), of null als geen timer
 */
export function getRemainingTime(gameId: string): number | null {
  const timer = activeTimers.get(gameId);
  if (!timer) return null;
  return Math.max(0, timer.deadline - Date.now());
}

/**
 * Haal deadline op, of null als geen timer
 */
export function getDeadline(gameId: string): number | null {
  const timer = activeTimers.get(gameId);
  return timer?.deadline ?? null;
}

/**
 * Check of een spel een timer heeft
 */
export function hasTimer(gameId: string): boolean {
  return activeTimers.has(gameId);
}

/**
 * Verwijder alle timers (cleanup)
 */
export function clearAllTimers(): void {
  for (const timer of activeTimers.values()) {
    clearTimeout(timer.timeout);
  }
  activeTimers.clear();
}
