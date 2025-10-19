"use client";
import React from 'react';
import { MultiSelect } from '../ui/MultiSelect';
import { COMPANY_STAGE_OPTIONS } from '@/libs/preferences/constants';

interface Props {
  values: string[];
  onChange: (vals: string[]) => void;
}

export const PreferenceStepCompanyStage: React.FC<Props> = ({ values, onChange }) => {
  return (
    <div className="space-y-2">
      <MultiSelect label="Company Stage (optional)" options={[...COMPANY_STAGE_OPTIONS]} selected={values} onChange={onChange} />
    </div>
  );
};
