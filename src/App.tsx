import { Input, TextField } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import domo from 'ryuu.js';

const COLUMN = 'Column Name';
const OPERATOR = 'CONTAINS';
const DEBOUNCE_MS = 400;

// Flip to true to log what the dashboard actually delivers vs. what we send.
const DEBUG = false;

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
  // *replaces* the whole set, so we merge into this instead of overwriting.
  const dashboardFiltersRef = useRef<PageFilter[]>([]);
  // Whether onFiltersUpdated has delivered the current page filters at least
  // once. Until then we do NOT touch the page — otherwise the debounce fires
  // on load with an empty ref and wipes every existing filter.
  const readyRef = useRef(false);
  // Whether this app currently has its own filter on the page, so we know to
  // clean it up (and avoid pointless empty updates) when the input is cleared.
  const appliedRef = useRef(false);
  // Debounced text waiting to be applied once we're ready.
  const pendingTextRef = useRef('');

  const flush = useCallback(() => {
    // Don't send anything until we know the page's current filters.
    if (!readyRef.current) return;

    const trimmed = pendingTextRef.current.trim();
    // Nothing typed and we've contributed nothing: leave the page untouched.
    if (!trimmed && !appliedRef.current) return;

    // Keep every existing filter except our own prior one, then append ours.
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

    appliedRef.current = trimmed.length > 0;
    if (DEBUG) console.debug('[contains-filter] sending', merged);
    domo.requestFiltersUpdate(merged, true);
  }, []);

  // Track the dashboard's current filters. onFiltersUpdated fires once on
  // registration with the current state, and again after each update we push.
  useEffect(() => {
    const unsubscribe = domo.onFiltersUpdated((filters) => {
      dashboardFiltersRef.current = (
        Array.isArray(filters) ? filters : []
      ) as PageFilter[];
      if (DEBUG) console.debug('[contains-filter] received', filters);

      // First delivery: we now know the page state. Apply any queued input.
      const wasReady = readyRef.current;
      readyRef.current = true;
      if (!wasReady && pendingTextRef.current.trim()) flush();
    });
    return unsubscribe;
  }, [flush]);

  // Debounce the input, then flush (which no-ops until we're ready).
  useEffect(() => {
    pendingTextRef.current = value;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [value, flush]);

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
