import React from 'react';
import { useForm } from 'react-hook-form';

function MyForm() {
  const { formState } = useForm();
  const { touchedFields } = formState;

  return <div>{touchedFields && <p>Some fields were touched</p>}</div>;
}
