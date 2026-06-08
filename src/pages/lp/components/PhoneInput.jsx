import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

const COUNTRIES = [
  { code: 'BR', dial: '55',  flag: '🇧🇷', label: 'Brasil' },
  { code: 'US', dial: '1',   flag: '🇺🇸', label: 'EUA' },
  { code: 'CA', dial: '1',   flag: '🇨🇦', label: 'Canadá' },
  { code: 'AR', dial: '54',  flag: '🇦🇷', label: 'Argentina' },
  { code: 'CL', dial: '56',  flag: '🇨🇱', label: 'Chile' },
  { code: 'CO', dial: '57',  flag: '🇨🇴', label: 'Colômbia' },
  { code: 'UY', dial: '598', flag: '🇺🇾', label: 'Uruguai' },
  { code: 'PY', dial: '595', flag: '🇵🇾', label: 'Paraguai' },
  { code: 'PE', dial: '51',  flag: '🇵🇪', label: 'Peru' },
  { code: 'BO', dial: '591', flag: '🇧🇴', label: 'Bolívia' },
  { code: 'EC', dial: '593', flag: '🇪🇨', label: 'Equador' },
  { code: 'VE', dial: '58',  flag: '🇻🇪', label: 'Venezuela' },
  { code: 'MX', dial: '52',  flag: '🇲🇽', label: 'México' },
  { code: 'PT', dial: '351', flag: '🇵🇹', label: 'Portugal' },
  { code: 'ES', dial: '34',  flag: '🇪🇸', label: 'Espanha' },
  { code: 'GB', dial: '44',  flag: '🇬🇧', label: 'Reino Unido' },
  { code: 'DE', dial: '49',  flag: '🇩🇪', label: 'Alemanha' },
  { code: 'FR', dial: '33',  flag: '🇫🇷', label: 'França' },
  { code: 'IT', dial: '39',  flag: '🇮🇹', label: 'Itália' },
  { code: 'AU', dial: '61',  flag: '🇦🇺', label: 'Austrália' },
];

function parseStoredPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return { country: COUNTRIES[0], local: '' };

  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (c.dial.length >= 3 && digits.startsWith(c.dial)) {
      return { country: c, local: digits.slice(c.dial.length) };
    }
  }
  if (digits.startsWith('55') && digits.length >= 12) {
    return { country: COUNTRIES.find(c => c.code === 'BR'), local: digits.slice(2) };
  }
  return { country: COUNTRIES[0], local: digits };
}

function formatBR(digits) {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
}

function formatLocal(country, raw) {
  if (country.code === 'BR') return formatBR(raw);
  return raw.replace(/\D/g, '');
}

export default function PhoneInput({
  defaultValue = '',
  onChange,
  variant = 'auth',
  readOnly = false,
  className = '',
}) {
  const initialParsed = parseStoredPhone(defaultValue);
  const [country, setCountry] = useState(initialParsed.country);
  const [local, setLocal] = useState(formatLocal(initialParsed.country, initialParsed.local));
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const notify = (c, l) => {
    if (onChange) onChange(c.dial + l.replace(/\D/g, ''));
  };

  const handleCountry = (c) => {
    setCountry(c);
    setOpen(false);
    const reformatted = formatLocal(c, local);
    setLocal(reformatted);
    notify(c, reformatted);
  };

  const handleLocal = (e) => {
    const v = formatLocal(country, e.target.value);
    setLocal(v);
    notify(country, v);
  };

  useEffect(() => {
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const Dropdown = () => (
    <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-[300] w-60 max-h-52 overflow-y-auto">
      {COUNTRIES.map(c => (
        <button
          key={c.code}
          type="button"
          onClick={() => handleCountry(c)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-blue-50 transition-colors text-left ${c.code === country.code ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
        >
          <span className="text-base leading-none">{c.flag}</span>
          <span className="flex-1">{c.label}</span>
          <span className="text-slate-400">+{c.dial}</span>
        </button>
      ))}
    </div>
  );

  if (variant === 'profile') {
    return (
      <div className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 ${!readOnly ? 'focus-within:border-blue-200 focus-within:bg-blue-50/30' : ''} transition-all ${className}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shrink-0 border border-blue-100/50">
          <Phone className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Telefone</p>
          {readOnly ? (
            <p className="text-sm font-semibold text-slate-700 truncate">
              {country.flag} +{country.dial} {local || '—'}
            </p>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="relative" ref={dropRef}>
                <button
                  type="button"
                  onClick={() => setOpen(v => !v)}
                  className="flex items-center gap-1 text-sm hover:text-blue-600 transition-colors"
                >
                  <span className="text-base leading-none">{country.flag}</span>
                  <span className="text-[11px] font-bold text-slate-500">+{country.dial}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {open && <Dropdown />}
              </div>
              <span className="text-slate-300 text-sm">|</span>
              <input
                type="tel"
                value={local}
                onChange={handleLocal}
                inputMode="tel"
                placeholder={country.code === 'BR' ? '(11) 91234-5678' : 'número'}
                maxLength={country.code === 'BR' ? 15 : 20}
                className="flex-1 min-w-0 text-sm font-semibold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-300 placeholder:font-normal"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-stretch border border-gray-200 rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent overflow-visible ${className}`}>
      <div className="relative shrink-0" ref={dropRef}>
        <button
          type="button"
          onClick={() => !readOnly && setOpen(v => !v)}
          className="h-full flex items-center gap-1.5 px-3 border-r border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors rounded-l-xl"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-xs font-bold text-gray-600">+{country.dial}</span>
          {!readOnly && <ChevronDown className="w-3 h-3 text-gray-400" />}
        </button>
        {open && <Dropdown />}
      </div>
      <input
        type="tel"
        value={local}
        onChange={handleLocal}
        inputMode="tel"
        placeholder={country.code === 'BR' ? '(11) 91234-5678' : 'número'}
        maxLength={country.code === 'BR' ? 15 : 20}
        readOnly={readOnly}
        className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent border-none outline-none placeholder:text-gray-300"
        required
      />
    </div>
  );
}
