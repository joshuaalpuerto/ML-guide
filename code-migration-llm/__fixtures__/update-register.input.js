import React from 'react';
import { useForm } from 'react-hook-form';

function MyForm() {
  const { register, errors } = useForm();

  return (
    <form>
      <input ref={register({ required: true })} name="test" />
      {errors.test && <span>This field is required</span>}

      <input ref={register} name="test1" />

      <input {...register('test2', { required: true })} />

      <input ref={register({ min: 5, max: 10 })} name="test3" />

      <input ref={register} name="items[0].value" />

      <input ref={register({ name: 'test' })} />

      <input {...register({ name: 'test' })} />

      <input {...register({ name: 'test' })} />

      <input
        ref={register({ required: true, min: 5, max: 10 })}
        name="items[1].value"
      />

      <input
        ref={register({
          valueAsNumber: true,
          validate: (value) => parseInt(value) === 2,
        })}
        name="test"
      />
    </form>
  );
}
