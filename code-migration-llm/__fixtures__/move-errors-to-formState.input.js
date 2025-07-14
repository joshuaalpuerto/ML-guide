import React from 'react';
import { useForm } from 'react-hook-form';

function MyForm() {
  const { register, handleSubmit, errors } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input name="firstName" ref={register({ required: true })} />
      {errors.firstName && <span>This field is required</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
