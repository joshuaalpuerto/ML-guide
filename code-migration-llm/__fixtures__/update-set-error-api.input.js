import React from 'react';
import { useForm } from 'react-hook-form';

function MyForm() {
  const { register, handleSubmit, setError } = useForm();

  const onSubmit = (data) => {
    setError('test', {
      type: 'required',
      message: 'This field is required.',
      shouldFocus: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input name="test" ref={register({ required: true })} />
      <button type="submit">Submit</button>
    </form>
  );
}
