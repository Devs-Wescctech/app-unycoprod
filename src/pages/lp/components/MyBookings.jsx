import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, X, AlertTriangle, Loader2, Building2, CreditCard, CheckCircle2, XCircle, ChevronRight, RefreshCw, Copy, Check } from 'lucide-react';
import { format, differenceInCalendarDays, isPast, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmada', color: 'emerald', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  completed: { label: 'Concluída', color: 'blue', icon: CheckCircle2, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  cancelled: { label: 'Cancelada', color: 'red', icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  pending: { label: 'Pendente', color: 'amber', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.bg} ${config.text} ${config.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

const PAYMENT_STATUS_CONFIG = {
  paid: { label: 'Pago', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  pending: { label: 'Pgto Pendente', bg: 'bg-amber-50', text: 'text-amber-600' },
  waiting: { label: 'Aguardando', bg: 'bg-amber-50', text: 'text-amber-600' },
  processing: { label: 'Processando', bg: 'bg-blue-50', text: 'text-blue-600' },
  canceled: { label: 'Pgto Cancelado', bg: 'bg-red-50', text: 'text-red-500' },
  cancelled: { label: 'Pgto Cancelado', bg: 'bg-red-50', text: 'text-red-500' },
  review: { label: 'Em Revisao', bg: 'bg-amber-50', text: 'text-amber-600' },
  charge_underpaid: { label: 'Pago Parcial', bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const PAYMENT_METHOD_LABELS = {
  credit_card: 'Cartão',
  bank_slip: 'Boleto',
  pix: 'Pix',
};

function PaymentBadge({ status, method }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-600">
        <CreditCard className="w-3 h-3" /> Pgto Pendente
      </span>
    );
  }
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
  const methodLabel = PAYMENT_METHOD_LABELS[method] || '';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${config.bg} ${config.text}`}>
      <CreditCard className="w-3 h-3" />
      {config.label}{methodLabel ? ` · ${methodLabel}` : ''}
    </span>
  );
}

function BookingCard({ booking, onCancel, onDetails }) {
  const [copied, setCopied] = useState(false);
  const checkIn = booking.check_in ? new Date(booking.check_in) : null;
  const checkOut = booking.check_out ? new Date(booking.check_out) : null;
  const nights = checkIn && checkOut ? differenceInCalendarDays(checkOut, checkIn) : 0;
  const status = booking.display_status || booking.status;
  const isUpcoming = checkIn && isFuture(checkIn);
  const isActive = checkIn && checkOut && (isToday(checkIn) || (checkIn <= new Date() && checkOut >= new Date()));

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.localizador || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${isActive ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'}`}>
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-48 h-36 sm:h-auto flex-shrink-0">
          {booking.hotel_image ? (
            <img src={booking.hotel_image} alt={booking.hotel_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-gray-300" />
            </div>
          )}
          {isActive && (
            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Hospedado
            </div>
          )}
        </div>

        <div className="flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-base truncate">{booking.hotel_name || 'Hotel'}</h3>
              {(booking.hotel_city || booking.hotel_state) && (
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {[(() => {
                    let city = booking.hotel_city || '';
                    if (city.startsWith('{')) { try { city = JSON.parse(city).name || city; } catch {} }
                    return city;
                  })(), booking.hotel_state].filter(Boolean).join(' - ')}
                </p>
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Check-in</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">
                {checkIn ? format(checkIn, "dd MMM yyyy", { locale: ptBR }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Check-out</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">
                {checkOut ? format(checkOut, "dd MMM yyyy", { locale: ptBR }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Noites</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{nights || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Hóspedes</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400" />
                {booking.adults || 1}{booking.children > 0 ? ` + ${booking.children}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {booking.localizador && (
                <button onClick={handleCopy} className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors group" title="Copiar localizador">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Loc.</span>
                  <span className="text-xs font-bold text-gray-700 font-mono tracking-wider">{booking.localizador}</span>
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />}
                </button>
              )}
              <PaymentBadge status={booking.payment_status} method={booking.payment_method} />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-bold text-gray-800">
                R$ {Number(booking.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {status === 'confirmed' && isUpcoming && (
                <button
                  onClick={() => onCancel(booking)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CancelConfirmModal({ booking, onConfirm, onClose, cancelling }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Cancelar Reserva</h3>
          <p className="text-sm text-gray-500 mb-1">
            Tem certeza que deseja cancelar sua reserva no
          </p>
          <p className="text-sm font-semibold text-gray-700 mb-1">{booking.hotel_name}?</p>
          {booking.localizador && (
            <p className="text-xs text-gray-400 mb-4">Localizador: <span className="font-mono font-bold">{booking.localizador}</span></p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={cancelling}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              Manter
            </button>
            <button
              onClick={onConfirm}
              disabled={cancelling}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelling ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelando...</> : 'Cancelar Reserva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <Calendar className="w-9 h-9 text-blue-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">Nenhuma reserva encontrada</h3>
      <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
        Quando você realizar uma reserva, ela aparecerá aqui. Explore nossos destinos e encontre a hospedagem perfeita!
      </p>
    </div>
  );
}

export default function MyBookings({ onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lp/bookings', { credentials: 'same-origin' });
      const data = await res.json();
      if (data.ok) {
        setBookings(data.data || []);
      } else {
        setError(data.error || 'Erro ao carregar reservas');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/lp/bookings/${cancelTarget.id}/cancel`, {
        method: 'PATCH',
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (data.ok) {
        setCancelTarget(null);
        fetchBookings();
      } else {
        setError(data.error || 'Erro ao cancelar reserva');
        setCancelTarget(null);
      }
    } catch {
      setError('Erro ao cancelar. Tente novamente.');
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };


  const filtered = bookings.filter(b => {
    const s = b.display_status || b.status;
    if (filter === 'all') return true;
    if (filter === 'upcoming') return s === 'confirmed' && b.check_in && isFuture(new Date(b.check_in));
    if (filter === 'completed') return s === 'completed';
    if (filter === 'cancelled') return s === 'cancelled';
    return true;
  });

  const counts = {
    all: bookings.length,
    upcoming: bookings.filter(b => (b.display_status || b.status) === 'confirmed' && b.check_in && isFuture(new Date(b.check_in))).length,
    completed: bookings.filter(b => (b.display_status || b.status) === 'completed').length,
    cancelled: bookings.filter(b => (b.display_status || b.status) === 'cancelled').length,
  };

  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'upcoming', label: 'Próximas' },
    { key: 'completed', label: 'Concluídas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-50 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-2 sm:mx-4" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Minhas Reservas</h2>
              <p className="text-xs text-gray-400">{bookings.length} reserva{bookings.length !== 1 ? 's' : ''} no total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchBookings} disabled={loading} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Atualizar">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {bookings.length > 0 && (
          <div className="bg-white border-b border-gray-100 px-5 py-2.5 flex gap-1 overflow-x-auto flex-shrink-0">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filter === f.key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                {f.label}
                {counts[f.key] > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {counts[f.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            filter !== 'all' ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">Nenhuma reserva {filters.find(f => f.key === filter)?.label.toLowerCase() || ''}</p>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            filtered.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={setCancelTarget}
                onDetails={() => {}}
              />
            ))
          )}
        </div>
      </div>

      {cancelTarget && (
        <CancelConfirmModal
          booking={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          cancelling={cancelling}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}