import React from 'react';
import { useForm } from 'react-hook-form';

function MyForm() {
  const {
    register,
    formState: { errors },
  } = useForm();

  return (
    <form>
      <input {...register('test', { required: true })} />
      {errors.test && <span>This field is required</span>}

      <input {...register('test1')} />

      <input {...register('test2', { required: true })} />

      <input {...register('test3', { min: 5, max: 10 })} />

      <input {...register('items.0.value')} />

      <input {...register('test')} />

      <input {...register('test')} />

      <input {...register('test')} />

      <input
        {...register('items.1.value', { required: true, min: 5, max: 10 })}
      />

      <input
        {...register('test', {
          valueAsNumber: true,
          validate: (value) => value === 2,
        })}
      />
    </form>
  );
}
