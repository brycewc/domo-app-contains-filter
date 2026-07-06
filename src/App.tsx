import { Input, TextField } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import domo from 'ryuu.js';

const COLUMN = 'Column Name';
const OPERATOR = 'CONTAINS';
const DEBOUNCE_MS = 400;

// Structural shape of a page filter (ryuu.js doesn't re-export its Filter type
// from the package entry, so we mirror the fields we read/merge here).
interface PageFilter {
  column: string;
  operator: string;
  values: unknown[];
  dataType: string;
  dataSourceId?: string;
  label?: string;
}

// True for a filter this app owns, so we can replace it on each keystroke
// instead of stacking a new one every time.
const isOwnFilter = (f: PageFilter) =>
  f.column === COLUMN && f.operator === OPERATOR;

export function App() {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Latest filter set applied on the parent dashboard. requestFiltersUpdate
  // *replaces* the whole set, so we keep a live copy to merge into.
  const dashboardFiltersRef = useRef<PageFilter[]>([]);

  // Track the dashboard's current filters. onFiltersUpdated also fires once on
  // registration with the current state, and again after we push an update.
  useEffect(() => {
    const unsubscribe = domo.onFiltersUpdated((filters) => {
      dashboardFiltersRef.current = (
        Array.isArray(filters) ? filters : []
      ) as PageFilter[];
    });
    return unsubscribe;
  }, []);

  const applyFilter = useCallback((text: string) => {
    const trimmed = text.trim();

    // Preserve every filter already on the page except the one this app
    // previously added, then append ours (if any) — i.e. append, don't replace.
    const others = dashboardFiltersRef.current.filter((f) => !isOwnFilter(f));
    const merged: PageFilter[] = trimmed
      ? [
          ...others,
          {
            column: COLUMN,
            operator: OPERATOR,
            values: [trimmed],
            dataType: 'STRING',
          },
        ]
      : others;

    domo.requestFiltersUpdate(merged, true);
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
