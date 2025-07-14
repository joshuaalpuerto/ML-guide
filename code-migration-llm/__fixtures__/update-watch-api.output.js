import React from 'react';
import { useForm } from 'react-hook-form';

function MyForm() {
  const { watch } = useForm();
  const [test, test1] = watch(['test', 'test1']);

  return (
    <div>
      {test} - {test1}
    </div>
  );
}
