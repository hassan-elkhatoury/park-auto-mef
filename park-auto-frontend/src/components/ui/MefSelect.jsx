import React, {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

function optionLabel(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(optionLabel).join('');
  if (isValidElement(node)) return optionLabel(node.props.children);
  return '';
}

function collectOptions(children) {
  const options = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    options.push({
      value: child.props.value,
      label: optionLabel(child.props.children),
      disabled: Boolean(child.props.disabled),
    });
  });
  return options;
}

export default function MefSelect({
  value,
  onChange,
  children,
  className = '',
  disabled = false,
  name,
  id,
  title,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const [menuPos, setMenuPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const listId = useId();

  const options = useMemo(() => collectOptions(children), [children]);
  const selected = options.find((opt) => String(opt.value) === String(value ?? '')) ?? null;
  const display = selected?.label || 'Sélectionner…';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  const showSearch = options.length > 8;

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const maxH = 280;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const width = Math.max(rect.width, 188);
    setMenuPos({
      left: Math.min(rect.left, window.innerWidth - width - 8),
      width,
      maxHeight: Math.min(maxH, openUp ? spaceAbove : spaceBelow),
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, filtered.length, showSearch]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event) => {
      const t = event.target;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHighlight(-1);
      return;
    }
    const idx = filtered.findIndex((opt) => String(opt.value) === String(value ?? ''));
    setHighlight(idx >= 0 ? idx : filtered.findIndex((opt) => !opt.disabled));
    const id = window.setTimeout(() => searchRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  const emit = (next) => {
    onChange?.({ target: { value: next == null ? '' : String(next), name } });
    setOpen(false);
  };

  const moveHighlight = (dir) => {
    if (!filtered.length) return;
    let i = highlight;
    for (let step = 0; step < filtered.length; step += 1) {
      i = (i + dir + filtered.length) % filtered.length;
      if (!filtered[i].disabled) {
        setHighlight(i);
        return;
      }
    }
  };

  const onTriggerKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const opt = filtered[highlight];
      if (opt && !opt.disabled) emit(opt.value);
    }
  };

  return (
    <div className={`mef-select ${className.includes('w-full') ? 'mef-select--block' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        title={title}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={`mef-select-trigger ${className}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={`mef-select-value ${selected ? '' : 'mef-select-value--placeholder'}`}>
          {display}
        </span>
        <ChevronDown className={`mef-select-chevron ${open ? 'mef-select-chevron--open' : ''}`} />
      </button>

      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          className="mef-select-menu"
          style={{
            left: menuPos.left,
            width: menuPos.width,
            top: menuPos.top,
            bottom: menuPos.bottom,
            maxHeight: menuPos.maxHeight,
          }}
          onKeyDown={onMenuKeyDown}
        >
          {showSearch && (
            <div className="mef-select-search">
              <Search className="mef-select-search-icon" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
                placeholder="Filtrer…"
                className="mef-select-search-input"
              />
            </div>
          )}
          <ul id={listId} role="listbox" className="mef-select-list">
            {filtered.length === 0 && (
              <li className="mef-select-empty">Aucun résultat</li>
            )}
            {filtered.map((opt, index) => {
              const active = String(opt.value) === String(value ?? '');
              const hi = index === highlight;
              return (
                <li key={`${String(opt.value)}-${index}`} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={opt.disabled}
                    className={`mef-select-option${active ? ' is-selected' : ''}${hi ? ' is-highlight' : ''}`}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => !opt.disabled && emit(opt.value)}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="mef-select-check" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
