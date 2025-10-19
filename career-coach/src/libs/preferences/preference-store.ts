import { PreferenceDraft, PreferenceProfile } from '../../types/user-data';
import { emitDraftProgress } from './analytics';

let draft: PreferenceDraft | null = null;
let profile: PreferenceProfile | null = null;

export function initDraft(): PreferenceDraft {
  draft = {
    workArrangements: [],
    locations: [],
    companyStages: [],
    interests: [],
    errors: {},
    updatedAt: new Date().toISOString(),
  };
  return draft;
}

export function getDraft(): PreferenceDraft | null { return draft; }
export function getProfile(): PreferenceProfile | null { return profile; }

export function updateDraft(update: Partial<PreferenceDraft>): PreferenceDraft {
  if (!draft) initDraft();
  draft = {
    ...draft!,
    ...update,
    updatedAt: new Date().toISOString(),
  };
  // Emit progress counts (T029) after each update
  emitDraftProgress({
    arrangements: draft.workArrangements.length,
    locations: draft.locations.length,
    companyStages: draft.companyStages.length,
  });
  return draft;
}

export function confirmProfile(): PreferenceProfile {
  if (!draft) throw new Error('No draft to confirm');
  if (profile) throw new Error('Profile already confirmed');
  profile = {
    workArrangements: draft.workArrangements,
    locations: draft.locations,
    companyStages: draft.companyStages,
    interests: draft.interests,
    confirmedAt: new Date().toISOString(),
    version: 1,
  };
  return profile;
}
