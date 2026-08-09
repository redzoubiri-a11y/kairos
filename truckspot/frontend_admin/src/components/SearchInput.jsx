import { useEffect, useRef, useState } from 'react';

/**
 * Keeps the typed text local and only reports upward after `delay` ms of quiet,
 * so filter changes do not fire a request per keystroke.
 */
export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Rechercher…',
  delay = 350,
}) {
  const [draft, setDraft] = useState(value);
  const latestOnChange = useRef(onChange);
  const isFirstRun = useRef(true);

  useEffect(() => {
    latestOnChange.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      if (draft !== value) latestOnChange.current(draft);
    }, delay);
    return () => clearTimeout(timer);
  }, [draft, delay, value]);

  return (
    <div className="search">
      <span className="search__icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" strokeLinecap="round" />
        </svg>
      </span>
      <input
        className="input"
        type="search"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        aria-label={placeholder}
      />
      {draft && (
        <button
          type="button"
          className="search__clear"
          onClick={() => setDraft('')}
          aria-label="Effacer la recherche"
        >
          ✕
        </button>
      )}
    </div>
  );
}
