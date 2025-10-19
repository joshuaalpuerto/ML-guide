import { PreferenceDraft, PreferenceValidationResult } from '../../types/user-data';
import { WORK_ARRANGEMENT_OPTIONS, LOCATION_OPTIONS, COMPANY_STAGE_OPTIONS, MAX_INTERESTS, MAX_INTEREST_LENGTH } from './constants';
import { PreferenceErrorCodes } from './errors';

// Phase 2 skeleton: functions to be implemented in User Story phases

export function validateAndNormalizeDraft(partial: Partial<PreferenceDraft>): PreferenceValidationResult {
  // Skeleton only: real logic added in T018, T034, T042 etc.
  const errors: Record<string, string[]> = {};
  return {
    valid: Object.values(errors).every(arr => arr.length === 0),
    errors,
    normalized: partial,
  };
}

export function enforceConditionalLocationRule(workArrangements: string[], locations: string[]): string[] {
  // Placeholder: will implement in T025
  return locations;
}
