import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, CalendarDays, Users, Search, Minus, Plus, Loader2, BedDouble, ChevronDown } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function prettifyCityName(name) {
  if (!name) return '';
  return name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function DatePickerInput({ value, onChange, minDate, placeholder, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayValue = value ? format(value, 'dd/MM/yyyy') : '';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      >
        <CalendarDays className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">{placeholder}</p>
          <p className={`text-sm font-medium ${displayValue ? 'text-gray-800' : 'text-gray-400'}`}>
            {displayValue || 'Selecione'}
          </p>
        </div>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0 sm:static sm:inset-auto">
          <div className="fixed inset-0 bg-black/30 sm:hidden" onClick={() => setOpen(false)} />
          <div className="relative z-[61] sm:absolute sm:top-full sm:left-0 sm:mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 max-w-[calc(100vw-2rem)]">
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(d) => { onChange(d); setOpen(false); }}
              locale={ptBR}
              disabled={minDate ? { before: minDate } : { before: new Date() }}
              modifiersClassNames={{ selected: 'bg-blue-500 text-white rounded-full' }}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GuestDropdown({ adults, rooms, onAdultsChange, onRoomsChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      >
        <Users className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">Hóspedes e quartos</p>
          <p className="text-sm font-medium text-gray-800">
            {adults} hóspede{adults > 1 ? 's' : ''}, {rooms} quarto{rooms > 1 ? 's' : ''}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 min-w-[260px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Hóspedes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => onAdultsChange(Math.max(2, adults - 1))} disabled={adults <= 2} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                <span className="w-5 text-center font-bold text-gray-800">{adults}</span>
                <button type="button" onClick={() => onAdultsChange(Math.min(6, adults + 1))} disabled={adults >= 6} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 transition-all"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BedDouble className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Quartos</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => onRoomsChange(Math.max(1, rooms - 1))} disabled={rooms <= 1} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                <span className="w-5 text-center font-bold text-gray-800">{rooms}</span>
                <button type="button" onClick={() => onRoomsChange(Math.min(4, rooms + 1))} disabled={rooms >= 4} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 transition-all"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchForm({ onSearch }) {
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [cidadeId, setCidadeId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const suggestionsRef = useRef(null);
  const abortRef = useRef(null);
  const cacheRef = useRef(new Map());
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const parseCities = useCallback((data) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      city: prettifyCityName(item.city || item.cidade || item.nomeCidade || item.name || item.nome || ''),
      uf: item.uf || item.estado || '',
      description: item.descricao || item.description || '',
      google_place_id: item.google_place_id || '',
      cidade_id: item.cidade_id || item.id || '',
    }));
  }, []);

  const fetchCities = useCallback(async (term, state) => {
    if (term.length < 3) { setSuggestions([]); setLoadingSuggestions(false); return; }

    const ufKey = (state || '').toLowerCase();
    const cacheKey = `${term.toLowerCase().trim()}|${ufKey}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setShowSuggestions(cached.length > 0);
      setLoadingSuggestions(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/lp/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ cidade: term.trim(), uf: state || '' }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.ok) {
        const parsed = parseCities(data.data);
        cacheRef.current.set(cacheKey, parsed);
        setSuggestions(parsed);
        setShowSuggestions(parsed.length > 0);
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('City search error:', e);
    } finally {
      if (!controller.signal.aborted) setLoadingSuggestions(false);
    }
  }, [parseCities]);

  const handleCityChange = (e) => {
    const val = e.target.value;
    setCidade(val);
    setErrors(prev => ({ ...prev, cidade: '' }));
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setShowSuggestions(false);
      return;
    }

    const ufKey = (uf || '').toLowerCase();
    const cacheKey = `${val.toLowerCase().trim()}|${ufKey}`;
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      setSuggestions(cached);
      setShowSuggestions(cached.length > 0);
      return;
    }

    setLoadingSuggestions(true);
    setShowSuggestions(false);
    debounceRef.current = setTimeout(() => fetchCities(val, uf), 250);
  };

  const selectCity = (item) => {
    setCidade(item.city);
    setUf(item.uf);
    setGooglePlaceId(item.google_place_id || '');
    setCidadeId(item.cidade_id || '');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleCheckInChange = (d) => {
    setCheckIn(d);
    setErrors(prev => ({ ...prev, dates: '' }));
    if (checkOut && d && !isBefore(d, checkOut)) {
      setCheckOut(addDays(d, 1));
    }
  };

  const validate = () => {
    const errs = {};
    if (!cidade.trim()) errs.cidade = 'Informe o destino';
    if (!checkIn || !checkOut) errs.dates = 'Informe as datas';
    else if (!isBefore(checkIn, checkOut)) errs.dates = 'Check-out deve ser após check-in';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSearching(true);
    try {
      const body = {
        cidade: cidade.trim(),
        uf,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        adults,
        children: 0,
        rooms,
        google_place_id: googlePlaceId,
        cidade_id: cidadeId,
      };
      const res = await fetch('/api/lp/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const params = { checkIn, checkOut, adults, rooms, cidade: cidade.trim(), uf };
      if (data.ok && onSearch) {
        const hotels = (data.data || []).map(h => ({
          id: h.id || h.idHotel || '',
          name: prettifyCityName(h.name || h.hotelName || h.nomeHotel || ''),
          image: h.image || h.photo || h.imagemPrincipal || '',
          cityState: h.city?.name && h.state ? `${prettifyCityName(h.city.name)} - ${h.state}` : (h.city_state || h.cidadeEstado || ''),
          price: h.cost?.[0]?.daily || parseFloat(h.price_daily || h.valorDiaria || h.total_price || 0),
          totalPrice: h.total_price || 0,
          dailyCount: h.daily_count || 0,
          street: h.street || '',
          complement: h.complement || '',
          broker: h.broker || '',
          isPreferential: h.is_preferential || false,
          byRequest: h.by_request || false,
          coordinates: h.coordinates || null,
          cost: h.cost || [],
          city: h.city || null,
          country: h.country || null,
          state: h.state || '',
          category_name: h.category_name || null,
          category_low_rate: h.category_low_rate || null,
          category_high_rate: h.category_high_rate || null,
          high_season_months: h.high_season_months || [],
          season_label: h.season_label || null,
        }));
        onSearch(hotels, params);
      } else if (onSearch) {
        onSearch([], params);
      }
    } catch (e) {
      console.error('Search error:', e);
      if (onSearch) onSearch([], { checkIn, checkOut, adults, rooms, cidade: cidade.trim(), uf }, 'Erro ao buscar hospedagens');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8" data-search-form>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-800">Buscar Hospedagens</h2>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mb-4">
            <div className="relative sm:col-span-2 lg:col-span-4" ref={suggestionsRef}>
              <div className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">Destino</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={cidade}
                      onChange={handleCityChange}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Para onde você vai?"
                      className="flex-1 min-w-0 text-sm font-medium text-gray-800 bg-transparent focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
                    />
                    <select
                      value={uf}
                      onChange={(e) => { setUf(e.target.value); if (cidade.length >= 2) fetchCities(cidade, e.target.value); }}
                      className="text-xs text-gray-500 bg-transparent border-none focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="">UF</option>
                      {UF_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {errors.cidade && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.cidade}</p>}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-52 overflow-y-auto z-[60]">
                  {suggestions.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectCity(item)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm transition-colors flex items-center gap-3 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{item.city}</span>
                        <span className="text-gray-400 ml-1">- {item.uf}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {loadingSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[60] flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Buscando cidades...
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <DatePickerInput value={checkIn} onChange={handleCheckInChange} placeholder="Check-in" />
            </div>

            <div className="lg:col-span-2">
              <DatePickerInput value={checkOut} onChange={(d) => { setCheckOut(d); setErrors(prev => ({ ...prev, dates: '' })); }} minDate={checkIn ? addDays(checkIn, 1) : addDays(new Date(), 1)} placeholder="Check-out" />
              {errors.dates && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.dates}</p>}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <GuestDropdown adults={adults} rooms={rooms} onAdultsChange={setAdults} onRoomsChange={setRooms} />
            </div>

            <div className="sm:col-span-2 lg:col-span-1 flex items-stretch">
              <button
                type="submit"
                disabled={searching}
                className="w-full h-full min-h-[56px] bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
              >
                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span className="sm:hidden font-medium">Buscar</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
