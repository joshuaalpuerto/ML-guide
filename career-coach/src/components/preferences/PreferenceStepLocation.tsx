"use client";
import React from 'react';
import { MultiSelect } from '../ui/MultiSelect';
import { LOCATION_OPTIONS } from '@/libs/preferences/constants';

interface Props {
  values: string[];
  onChange: (vals: string[]) => void;
  errors?: string[];
  inPersonOnly?: boolean;
}

export const PreferenceStepLocation: React.FC<Props> = ({ values, onChange, errors, inPersonOnly }) => {
  const opts = inPersonOnly ? ['Estonia'] : [...LOCATION_OPTIONS];
  return (
    <div className="space-y-2">
      <MultiSelect label="Location" options={opts} selected={values.filter(v => opts.includes(v))} onChange={onChange} />
      {errors && errors.length > 0 && (
        <div className="text-xs text-red-600" role="alert">{errors.join(', ')}</div>
      )}
    </div>
  );
};
