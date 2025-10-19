// Error codes enumeration (Phase 2)
export const PreferenceErrorCodes = {
  REQUIRED: 'REQUIRED',
  INVALID_VALUE: 'INVALID_VALUE',
  CONDITIONAL_CONFLICT: 'CONDITIONAL_CONFLICT',
  TOKEN_TOO_LONG: 'TOKEN_TOO_LONG',
  TOKEN_LIMIT_EXCEEDED: 'TOKEN_LIMIT_EXCEEDED'
} as const;

export type PreferenceErrorCode = typeof PreferenceErrorCodes[keyof typeof PreferenceErrorCodes];
