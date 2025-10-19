// Preference flow analytics event constants
// Phase 1 bootstrap
export const PREFERENCES_EVENTS = {
  STARTED: 'preferences_started',
  STEP_COMPLETED: 'preferences_step_completed',
  REVIEW_OPENED: 'preferences_review_opened',
  CONFIRMED: 'preferences_confirmed',
  ABANDONED: 'preferences_abandoned'
} as const;

export type PreferenceEventKey = keyof typeof PREFERENCES_EVENTS;
