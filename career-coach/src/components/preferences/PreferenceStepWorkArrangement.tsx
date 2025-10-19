"use client";
import React from 'react';
import { MultiSelect } from '../ui/MultiSelect';
import { WORK_ARRANGEMENT_OPTIONS } from '@/libs/preferences/constants';

interface Props {
  values: string[];
  onChange: (vals: string[]) => void;
  errors?: string[];
}

export const PreferenceStepWorkArrangement: React.FC<Props> = ({ values, onChange, errors }) => {
  return (
    <div className="space-y-2">
      <MultiSelect label="Work Arrangement" options={[...WORK_ARRANGEMENT_OPTIONS]} selected={values} onChange={onChange} />
      {errors && errors.length > 0 && (
        <div className="text-xs text-red-600" role="alert">{errors.join(', ')}</div>
      )}
    </div>
  );
};
