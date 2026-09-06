import { Easing, type WithTimingConfig } from 'react-native-reanimated';

import { DURATION } from './tokens';

/**
 * One signature curve carries ~80% of the app's motion. Entrances decelerate
 * into place, exits accelerate away, nothing overshoots — the archive is
 * precise, not playful.
 */
export const EASE = {
  /** Signature: on-screen changes, presses, colour. */
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  /** Entrances: fast departure, gentle landing. */
  out: Easing.bezier(0.05, 0.7, 0.1, 1),
  /** Exits: gentle start, quick departure. */
  in: Easing.bezier(0.3, 0, 1, 1),
} as const;

export const TIMING = {
  quick: { duration: DURATION.quick, easing: EASE.standard } satisfies WithTimingConfig,
  press: { duration: DURATION.quick, easing: EASE.standard } satisfies WithTimingConfig,
  release: { duration: 220, easing: EASE.out } satisfies WithTimingConfig,
  standard: { duration: DURATION.standard, easing: EASE.standard } satisfies WithTimingConfig,
  enter: { duration: DURATION.standard + 60, easing: EASE.out } satisfies WithTimingConfig,
  exit: { duration: 180, easing: EASE.in } satisfies WithTimingConfig,
  slow: { duration: DURATION.slow, easing: EASE.standard } satisfies WithTimingConfig,
} as const;
