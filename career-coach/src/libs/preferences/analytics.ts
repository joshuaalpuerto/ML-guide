import { PREFERENCES_EVENTS } from './events';

// Simple emitter abstraction (Phase 2). Real implementation may integrate with existing logging/analytics.
export function emitPreferenceEvent(event: string, payload?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.debug('[preferences-event]', event, payload || {});
}

export function emitStarted() { emitPreferenceEvent(PREFERENCES_EVENTS.STARTED); }
export function emitStepCompleted(step: string) { emitPreferenceEvent(PREFERENCES_EVENTS.STEP_COMPLETED, { step }); }
export function emitReviewOpened() { emitPreferenceEvent(PREFERENCES_EVENTS.REVIEW_OPENED); }
export function emitConfirmed(summary: { arrangements: number; locations: number; companyStages: number; interests: number; }) {
  emitPreferenceEvent(PREFERENCES_EVENTS.CONFIRMED, summary);
}
export function emitAbandoned(reason?: string) { emitPreferenceEvent(PREFERENCES_EVENTS.ABANDONED, { reason }); }
