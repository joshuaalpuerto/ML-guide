"use client";
import React from 'react';

interface Props {
  errors?: string[];
}

export const PreferenceValidationMessages: React.FC<Props> = ({ errors }) => {
  if (!errors || errors.length === 0) return null;
  return (
    <ul className="text-xs text-red-600 space-y-1" role="alert" aria-live="polite">
      {errors.map((e, idx) => (
        <li key={idx}>{e}</li>
      ))}
    </ul>
  );
};
