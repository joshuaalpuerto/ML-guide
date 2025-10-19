import { initDraft, updateDraft, getDraft } from '../preferences/preference-store';
import { validateAndNormalizeDraft, enforceConditionalLocationRule } from '../preferences/preference-normalizer';
import { emitStarted, emitStepCompleted, emitConfirmed } from '../preferences/analytics';

type PreferenceStepKey = 'workArrangements' | 'locations' | 'companyStages';

interface PreferenceState {
  active: boolean;
  currentStepIndex: number;
  steps: PreferenceStepKey[];
  draft: ReturnType<typeof getDraft>;
  errors: Record<string, string[]>;
  completed: boolean;
}

let preferenceFlowActive = false;
let currentStepIndex = 0;
const steps: PreferenceStepKey[] = ['workArrangements', 'locations', 'companyStages'];

export function startPreferencesFlow() {
  if (!preferenceFlowActive) {
    initDraft();
    preferenceFlowActive = true;
    currentStepIndex = 0;
    emitStarted();
  }
}

export function getPreferenceState(): PreferenceState {
  const draft = getDraft();
  const validation = draft ? validateAndNormalizeDraft(draft) : { errors: {}, valid: false, normalized: {} } as any;
  return {
    active: preferenceFlowActive,
    currentStepIndex,
    steps,
    draft,
    errors: validation.errors,
    completed: isFlowCompleted(validation)
  };
}

function isFlowCompleted(validation: { valid: boolean; errors: Record<string, string[]> }) {
  // For US1, completion means required fields valid (workArrangements + locations) regardless of companyStages
  return preferenceFlowActive && validation.valid && currentStepIndex >= steps.length;
}

export function updatePreferenceStep(step: PreferenceStepKey, values: string[]) {
  const draft = getDraft() || initDraft();
  // Auto-removal when switching to in-person only (T025)
  if (step === 'workArrangements') {
    const prunedLocations = enforceConditionalLocationRule(values, draft.locations);
    updateDraft({ workArrangements: values, locations: prunedLocations });
  } else if (step === 'locations') {
    updateDraft({ locations: values });
  } else if (step === 'companyStages') {
    updateDraft({ companyStages: values });
  }
}

export function advancePreferenceStep() {
  const draft = getDraft();
  if (!draft) return;
  const validation = validateAndNormalizeDraft(draft);
  const currentStep = steps[currentStepIndex];
  // If current step fields no errors, emit step completion and move forward
  if (!validation.errors[currentStep]) {
    emitStepCompleted(currentStep);
    currentStepIndex += 1;
  }
  // If reached end, emit confirmed summary (draft only for US1; real confirmation in later stories)
  if (currentStepIndex >= steps.length) {
    const profileSummary = {
      arrangements: draft.workArrangements.length,
      locations: draft.locations.length,
      companyStages: draft.companyStages.length,
      interests: draft.interests.length,
    };
    emitConfirmed(profileSummary);
  }
}

