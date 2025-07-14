## General

- Do not replace `useFormContext()` with `useForm()`
- Do not replace `ref` passed from `React.forwardRef`.

## CRITICAL: `FieldController` Component Restriction

**You are STRICTLY PROHIBITED from making ANY modifications to the `FieldController` component.** This component is a controlled component which manages its internal state, and any changes to it may break the code. Leave the `FieldController` component EXACTLY as it is provided.

## register

`register` method is no longer occurred at `ref`, instead invoke the function itself and spread the props into the input. The function itself will return the following props: `onChange`, `onBlur`, `name` and `ref`.

```
- <input ref={register({ required: true })} name="test" />
+ <input {...register('test', { required: true })} />
```

On top of that, for better type support, we have removed bracket syntax and replaced with dot syntax.

```
- test[2].test
+ test.2.test
```

### Custom register

You will no longer need the name attribute for custom register, you can supply the name of the input straight way.

```
- register({ name: 'test' })
+ register('test')
```

### ValueAs

`valueAs` will be invoked before `validate` function.

```
- <input ref={register({ valueAsNumber: true, validate: (value) => parseInt(value) === 2 ) })} name="test" />
+ <input {...register('test', { valueAsNumber: true, validate: (value) => value === 2 ) }} /> // no longer need to parse again
```

### Missing `ref`

`register` works for any uncontrolled inputs , however, there are components which expose `ref` name differently.

```
const { ref, ...rest } = register('test') // invoke this before render
<Input {...rest} inputRef={ref} />
```

---

## Controller:

We made some change to align consistently with `useController`'s API.

- `as` prop has been removed, and we will consistently be using `render` prop in v7.
- `render` prop will return an object which contains `field` and `fieldState`.

```
- <Controller as={<input />} />
+ <Controller render={({ field }) => <input {...field} />}
- <Controller render={(props, meta) => <input {...props} />} />
+ <Controller render={({ field, fieldState }) => <input {...field} />} />
```

NOTE: You must not change or modify `FieldController` components.

### ValueAs

The Controller component `rules` prop no longer supports `setValueAs` or `valueAs*` for `useController`. Do these value transformations in your controlled component.

---

## reset

In V7, we made some changes in our API to keep them more consistent and declarative. `Reset`'s second option is the exact reason.

```
- reset(values, { isDirty: true })
+ // second argument is still optional
+ reset(values, {
+   keepDefaultValues: true, // new
+   keepValues: true, // new
+   keepDirty: true,
+ })
```

---

## errors

`errors` object has been moved into formState object. This will info hook form that `errors` object is been subscribed.

```
- const { errors } = useForm();
+ const { formState: { errors } } = useForm();
```

NOTE: You must not change how `errors` is declared if it is from function argument.

---

## watch

watch an array of inputs will return `array` instead `object`

```
- const { test, test1 } = watch(['test', 'test1']);
+ const [test, test1] = watch(['test', 'test1']);
```

---

## trigger

Manually triggers form or input validation. This method is also useful when you have depedant validation as react hook form

```
- await trigger("test") // Returns true|false
+ await trigger("test") // Returns void
```

---

## setError

We have fixed the `setError` function to be consistent with the rest of the APIs.

```
- setError('test', { type: 'type', message: 'issue', shouldFocus: true })
+ setError('test', { type: 'type', message: 'issue' }, { shouldFocus: true })
```

---

## touched

Renamed `touched` to `touchedFields`.

```
- const { touched } = formState;
+ const { touchedFields } = formState;
```

---

## resolver

We made some huge improvement on resolver, and the third argument now need to host more value than just a single boolean.

```
- resolver: (values: any, context?: object) => Promise<ResolverResult> | ResolverResult
+ resolver: (
  +    values: any,
+    context?: object,
+    options: {
  +       criteriaMode?: 'firstError' | 'all',
+       names?: string[],
+       fields: { [name]: field } // Support nested field
+    }
+  ) => Promise<ResolverResult> | ResolverResult
```

---

## useFieldArray

We are offering better focus management in `useFieldArray`, so if you want to disable the focus behaviour, you will have to adjust the option as well.

```
- append({ test: 'test' }, false);
+ append({ test: 'test' }, { shouldFocus: false });
```

`useFieldArray` no longer need to supply with a generic, formValues type will inherited from `useForm`.

```
- useFieldArray<FieldArrayValues>();
+ useFieldArray();
```

---

## useTypedController

This component is getting deprecated, use `useController` instead.

```
- <TypedController
-   as="textarea"
-   name={['nested', 'object', 'test']}
-   defaultValue=""
-   rules={{ required: true }}
- />
+ <Controller
+   name={'nested.object.test'}
+   defaultValue=""
+   rules={{ required: true }}
+   render={({ field }) => <textarea {...field} />}
+ />);
```

## Types

We have made quite a few rename on the type for a better name and consistency. please refer to the TS page for the updated type names.

---

## shouldUnregister

In V7, the new default for the `useForm`option: `shouldUnregister` is false. Previously it was defaulted to true.

**Important:** input value and reference will no longer get removed after unmount unless `shouldUnregister` is true.
