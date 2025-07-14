import React from 'react';
import { useForm } from 'react-hook-form';

function MyForm() {
  const { formState } = useForm();
  const { touched } = formState;

  return <div>{touched && <p>Some fields were touched</p>}</div>;
}
