import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

function MyForm() {
  const { register, control } = useForm();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'test',
  });

  return (
    <ul>
      {fields.map((item, index) => (
        <li key={item.id}>
          <input {...register(`test.${index}.firstName`)} />
          <button type="button" onClick={() => remove(index)}>
            Delete
          </button>
        </li>
      ))}
      <button
        type="button"
        onClick={() => append({ firstName: 'test' }, { shouldFocus: false })}
      >
        append
      </button>
    </ul>
  );
}
