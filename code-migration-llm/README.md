# Code Migration LLM: React Hook Form v6 to v7

A sample LLM-powered workflow tool that automatically migrates React Hook Form codebases from version 6 to version 7 using AI-driven code transformations.

## Overview

This project demonstrates how to use Large Language Models (LLMs) for automated code migration tasks. It specifically handles the migration of React Hook Form from v6 to v7, which involves several breaking changes in the API.

## Features

- **🤖 AI-Powered Transformations**: Uses LLM to intelligently transform code patterns
- **🎯 Targeted File Discovery**: Automatically finds files containing React Hook Form usage
- **✅ Test-Driven Development**: Comprehensive fixture-based testing
- **🔄 Transaction Handling**: Tracks processed files for resumable operations
- **📝 Detailed Migration Rules**: Follows comprehensive migration guidelines

## Key Transformations

The tool handles several critical React Hook Form v6 to v7 migrations:

### 1. Register API Changes
**Before (v6):**
```javascript
<input ref={register({ required: true })} name="test" />
```

**After (v7):**
```javascript
<input {...register('test', { required: true })} />
```

### 2. Error Handling Updates
**Before (v6):**
```javascript
const { register, errors } = useForm();
```

**After (v7):**
```javascript
const { register, formState: { errors } } = useForm();
```

### 3. Field Array API Updates
- Updates `useFieldArray` API patterns
- Migrates watch API usage
- Handles setError API changes

## Installation

```bash
npm install
```

## Usage

### Test Mode (Recommended)
Run transformations on fixture files for testing:

```bash
npm start -- --test
```

### Production Mode
Run transformations on actual codebase files:

```bash
npm start -- --prod
```

## Project Structure

```
code-migration-llm/
├── index.js                               # Main transformation logic
├── tokenization.js                        # Token management utilities
├── react_hook_form_v6_to_v7_migration.md # Migration rules and guidelines
├── package.json                           # Project configuration
├── __fixtures__/                          # Test cases
│   ├── *.input.js                        # Input examples
│   └── *.output.js                       # Expected outputs
└── __tests__/                             # Test files
```

## How It Works

1. **File Discovery**: Scans for files containing React Hook Form keywords:
   - `react-hook-form`
   - `useForm`
   - `useFormContext`
   - `formContext`

2. **AI Processing**: Sends code to LLM with migration instructions

3. **Safe Transformation**: Applies transformations while preserving:
   - `FieldController` components (no modifications allowed)
   - `useFormContext()` usage
   - React `forwardRef` patterns

4. **Validation**: Compares results against fixture tests

## Migration Rules

The tool follows strict migration guidelines including:

- ✅ Converting `ref={register()}` to `{...register()}`
- ✅ Moving `errors` to `formState.errors`
- ✅ Updating bracket syntax to dot syntax (`test[2].test` → `test.2.test`)
- ❌ **Never** modifying `FieldController` components
- ❌ **Never** replacing `useFormContext()` with `useForm()`

## Configuration

- **MAX_FILES**: Limits processing to 20 files per run
- **Token Management**: Automatically handles LLM token limits
- **Transaction Safety**: Tracks progress for resumable operations


## Dependencies

- Node.js runtime
- LLM API access for transformations
- Prettier for code formatting

---

**Note**: This is a demonstration project showing LLM-powered code migration. Always review and test AI-generated code changes before applying to production codebases.
