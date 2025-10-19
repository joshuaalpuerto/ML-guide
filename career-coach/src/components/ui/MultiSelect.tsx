"use client";
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const toggleValue = (value: string) => {
    const next = selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value];
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(o => !o);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx('border rounded px-3 py-2 text-left bg-white dark:bg-gray-900', disabled && 'opacity-50 cursor-not-allowed')}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={handleKeyDown}
      >
        <span className="text-sm font-medium">{label}</span>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {selected.length > 0 ? selected.join(', ') : 'None selected'}
        </div>
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          className="border rounded p-2 space-y-1 bg-white dark:bg-gray-900 shadow-sm max-h-48 overflow-y-auto"
        >
          {options.map(opt => {
            const isSelected = selected.includes(opt);
            return (
              <li
                key={opt}
                role="option"
                aria-selected={isSelected}
                className={clsx('px-2 py-1 rounded cursor-pointer text-sm flex justify-between items-center',
                  isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800')}
                onClick={() => toggleValue(opt)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleValue(opt);
                  }
                }}
                tabIndex={0}
              >
                <span>{opt}</span>
                {isSelected && <span className="text-xs">✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
