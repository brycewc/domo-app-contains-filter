import { Input, TextField } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import domo from 'ryuu.js';

const COLUMN = 'Column Name';
const DEBOUNCE_MS = 400;

export function App() {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const applyFilter = useCallback((text: string) => {
    const trimmed = text.trim();
    const filters = trimmed
      ? [
          {
            column: COLUMN,
            operator: 'CONTAINS',
            values: [trimmed],
            dataType: 'STRING',
          },
        ]
      : [];
    domo.requestFiltersUpdate(filters, true);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => applyFilter(value), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [value, applyFilter]);

  return (
    <div className="flex h-full items-center justify-center p-4">
      <TextField value={value} onChange={setValue} className="w-full max-w-sm">
        <Input
          placeholder="Type to filter..."
          aria-label="Column Name Contains Filter"
        />
      </TextField>
    </div>
  );
}
