import { PreferenceDraft, PreferenceValidationResult } from '../../types/user-data';
import { WORK_ARRANGEMENT_OPTIONS, LOCATION_OPTIONS, COMPANY_STAGE_OPTIONS } from './constants';
import { PreferenceErrorCodes } from './errors';

// Phase 2 skeleton: functions to be implemented in User Story phases

export function validateAndNormalizeDraft(partial: Partial<PreferenceDraft>): PreferenceValidationResult {
  const errors: Record<string, string[]> = {};
  const normalized: Partial<PreferenceDraft> = { ...partial };

  // Work Arrangements required
  if (!normalized.workArrangements || normalized.workArrangements.length === 0) {
    errors.workArrangements = [PreferenceErrorCodes.REQUIRED];
  } else {
    // Remove invalid values
    normalized.workArrangements = normalized.workArrangements.filter(v => (WORK_ARRANGEMENT_OPTIONS as readonly string[]).includes(v));
    if (normalized.workArrangements.length === 0) {
      errors.workArrangements = [PreferenceErrorCodes.REQUIRED];
    }
  }

  // Locations required (at least one) for meaningful matching
  if (!normalized.locations || normalized.locations.length === 0) {
    errors.locations = [PreferenceErrorCodes.REQUIRED];
  } else {
    normalized.locations = normalized.locations.filter(v => (LOCATION_OPTIONS as readonly string[]).includes(v));
    if (normalized.locations.length === 0) {
      errors.locations = [PreferenceErrorCodes.REQUIRED];
    }
  }

  // Conditional in-person only rule
  if (normalized.workArrangements && normalized.workArrangements.length === 1 && normalized.workArrangements[0] === 'In-Person') {
    if (normalized.locations && (normalized.locations.includes('EEA'))) {
      errors.locations = [...(errors.locations || []), PreferenceErrorCodes.CONDITIONAL_CONFLICT];
    }
  }

  // Company stages: filter invalid values, duplicates
  if (normalized.companyStages) {
    normalized.companyStages = Array.from(new Set(normalized.companyStages.filter(v => (COMPANY_STAGE_OPTIONS as readonly string[]).includes(v))));
  }

  // Interests logic added in US2

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized,
  };
}

export function enforceConditionalLocationRule(workArrangements: string[], locations: string[]): string[] {
  if (workArrangements.length === 1 && workArrangements[0] === 'In-Person') {
    return locations.filter(l => l === 'Estonia');
  }
  return locations;
}

