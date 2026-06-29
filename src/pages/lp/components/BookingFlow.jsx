import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2, BedDouble, Users, Calendar, MapPin, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, Shield, Coffee, Wifi,
  ShieldCheck, Ban, Lock, Car, PawPrint, Zap, ArrowUpDown,
  DoorOpen, Accessibility, Eye, ImageOff, Gift,
  Phone, Mail, CreditCard, Check, CircleAlert, Sparkles,
  ChevronRight, Info, X, Wallet
} from 'lucide-react';
import PaymentFlow from './PaymentFlow';
import BookingAlternativesModal from './BookingAlternativesModal';

function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

const AMENITY_ICONS = {
  'internet': Wifi, 'wi-fi': Wifi, 'wifi': Wifi,
  'estacionamento': Car, 'cofre': Lock, 'elevador': ArrowUpDown,
  'pet': PawPrint, 'p.n.e': Accessibility, 'pne': Accessibility,
  'fumante': Ban, 'recepção': DoorOpen, 'recep': DoorOpen,
  'voltagem': Zap, 'ar condicionado': Zap, 'tv': Eye,
  'frigobar': Coffee, 'secador': Shield, 'telefone': Phone,
  'fechadura': Lock, 'tomada': Zap, 'room service': Coffee,
  'restaurante': Coffee, 'piscina': Sparkles,
};

function getAmenityIcon(amenity) {
  const lower = amenity.toLowerCase();
  for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return ShieldCheck;
}

const LOADING_MESSAGES = [
  { text: 'Consultando disponibilidade...', Icon: Eye },
  { text: 'Verificando quartos disponíveis...', Icon: BedDouble },
  { text: 'Calculando tarifas exclusivas...', Icon: Sparkles },
  { text: 'Preparando suas opções...', Icon: CheckCircle2 },
];

function AnimatedLoader({ messages }) {
  const [currentMsg, setCurrentMsg] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMsg(prev => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 8 + 2, 90));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const MsgIcon = messages[currentMsg]?.Icon || Loader2;

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-5 sm:gap-6">
      <div className="relative">
        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/80 flex items-center justify-center shadow-xl shadow-blue-500/10">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/5 to-indigo-400/10 animate-pulse" />
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100 transition-all duration-500">
          <MsgIcon key={currentMsg} className="w-4 h-4 text-blue-500" style={{ animation: 'fadeSlideIn 0.4s ease-out' }} />
        </div>
      </div>

      <div className="text-center">
        <div className="h-7 flex items-center justify-center overflow-hidden">
          <p
            key={currentMsg}
            className="text-[15px] font-semibold text-gray-700"
            style={{ animation: 'fadeSlideIn 0.5s ease-out' }}
          >
            {messages[currentMsg]?.text}
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Isso pode levar alguns segundos</p>
      </div>

      <div className="w-56 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StepIndicator({ currentStep }) {
  const steps = [
    { id: 1, label: 'Apartamento', icon: BedDouble },
    { id: 2, label: 'Revisão', icon: Shield },
    { id: 3, label: 'Pagamento', icon: Wallet },
    { id: 4, label: 'Confirmação', icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center w-full">
      {steps.map((s, idx) => {
        const isActive = currentStep === s.id;
        const isDone = currentStep > s.id;
        const StepIcon = s.icon;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 transition-all duration-500 ${
              isActive ? '' : isDone ? '' : 'opacity-40'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                isDone ? 'bg-emerald-500 text-white scale-100 shadow-md shadow-emerald-500/30' :
                isActive ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30 ring-4 ring-blue-100' :
                'bg-gray-100 text-gray-400'
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
              </div>
              <span className={`hidden sm:inline text-xs font-semibold transition-colors duration-300 ${
                isDone ? 'text-emerald-600' :
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 mx-3 h-0.5 rounded-full overflow-hidden bg-gray-100">
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isDone ? 'w-full bg-emerald-400' :
                  isActive ? 'w-1/2 bg-blue-400' : 'w-0 bg-gray-200'
                }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BookingFlow({ hotel, searchParams, user, open, onClose, onUserUpdate, authOpen = false }) {
  const [step, setStep] = useState(1);
  const [apartments, setApartments] = useState([]);
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingLocator, setBookingLocator] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [error, setError] = useState('');
  const [expandedPolicy, setExpandedPolicy] = useState(false);
  const [alternativesModalOpen, setAlternativesModalOpen] = useState(false);
  const [effectiveDates, setEffectiveDates] = useState(null);
  const [extendedBy, setExtendedBy] = useState(0);

  const applyRates = useCallback((parsed) => {
    const lowRate = hotel.category_low_rate;
    const highRate = hotel.category_high_rate;
    const highMonths = hotel.high_season_months || [];
    const hasRates = (lowRate && lowRate > 0) || (highRate && highRate > 0);
    if (!hasRates || !searchParams?.checkIn) return parsed;
    const checkInMonth = searchParams.checkIn.getMonth() + 1;
    const isHighSeason = highMonths.includes(checkInMonth);
    const appliedRate = isHighSeason ? (highRate || lowRate) : (lowRate || highRate);
    const seasonLabel = isHighSeason ? 'Alta' : 'Baixa';
    if (!appliedRate || appliedRate <= 0) return parsed;
    return parsed.map(apt => {
      const newCost = (apt.cost || []).map(c => ({ ...c, daily: appliedRate }));
      const newTotal = newCost.reduce((sum, c) => sum + (c.daily || 0) + (c.extras || 0), 0);
      return { ...apt, cost: newCost, total_price: newTotal, original_daily: apt.cost?.[0]?.daily || 0, category_name: hotel.category_name, season_label: seasonLabel };
    });
  }, [hotel?.category_low_rate, hotel?.category_high_rate, hotel?.high_season_months, hotel?.category_name, searchParams?.checkIn]);

  const fetchForDates = useCallback(async (startDate, endDate, signal) => {
    const res = await fetch('/api/lp/info-apartment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      signal,
      body: JSON.stringify({
        hotel_id: hotel.id,
        start_date: startDate,
        end_date: endDate,
        adults: searchParams.adults || 2,
        children: searchParams.children || 0,
        children_age: searchParams.childrenAges || [],
      }),
    });
    const data = await res.json();
    if (!data.ok) return [];
    const raw = data.data;
    const list = Array.isArray(raw) ? raw : (raw?.apartments || raw?.data || []);
    return list.map(item => item.apartment || item).filter(Boolean);
  }, [hotel?.id, searchParams?.adults, searchParams?.children, searchParams?.childrenAges]);

  const fetchApartments = useCallback(async () => {
    void searchParams?.children;
    void searchParams?.childrenAges;
    if (!hotel?.id || !searchParams?.checkIn || !searchParams?.checkOut) return;

    setStep(1);
    setApartments([]);
    setSelectedApartment(null);
    setBookingResult(null);
    setBookingLocator(null);
    setPaymentCompleted(false);
    setError('');
    setExpandedPolicy(false);
    setEffectiveDates(null);
    setExtendedBy(0);
    setLoadingApartments(true);

    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 120000);
    try {
      const MAX_EXTRA = 5;
      let parsed = [];
      let usedExtra = 0;

      for (let extra = 0; extra <= MAX_EXTRA; extra++) {
        const checkOut = addDays(searchParams.checkOut, extra);
        const startDate = format(searchParams.checkIn, 'dd/MM/yyyy');
        const endDate = format(checkOut, 'dd/MM/yyyy');
        parsed = await fetchForDates(startDate, endDate, ctrl.signal);
        if (parsed.length > 0) { usedExtra = extra; break; }
      }

      clearTimeout(timeoutId);
      parsed = applyRates(parsed);
      setApartments(parsed);
      setExtendedBy(usedExtra);
      if (parsed.length === 0) {
        setError('Nenhum apartamento encontrado para este hotel nas datas selecionadas.');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('A consulta na Coobmais demorou demais. Clique em "Tentar novamente".');
      } else {
        setError('Erro de conexão ao buscar apartamentos. Clique em "Tentar novamente".');
      }
    } finally {
      setLoadingApartments(false);
    }
  }, [hotel?.id, searchParams?.checkIn, searchParams?.checkOut, searchParams?.adults, fetchForDates, applyRates]);

  useEffect(() => {
    if (open) fetchApartments();
  }, [open, fetchApartments]);

  const handleSelectApartment = (apt) => {
    setSelectedApartment(apt);
    setBookingResult(null);
    setBookingLocator(null);
    setError('');
    setEffectiveDates(null);
    setStep(2);
  };

  const handleSelectAlternative = ({ apt, checkIn, checkOut }) => {
    setSelectedApartment(apt);
    setEffectiveDates({ checkIn, checkOut });
    setAlternativesModalOpen(false);
    setBookingResult(null);
    setBookingLocator(null);
    setError('');
    setStep(2);
  };

  // A disponibilidade (AvailabilityBook) deixou de ser checada aqui: agora ela roda
  // no servidor DEPOIS do pagamento confirmado, junto da confirmação da reserva.
  // O cliente vai direto da revisão para o pagamento.
  const handleReserveAndGoToPayment = () => {
    if (!selectedApartment) return;
    setError('');
    setStep(3);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    setError('');
    setStep(4);
    setConfirmingBooking(true);

    const billId = paymentResult?.bill_id || null;
    let localizador = bookingLocator;

    if (!billId) {
      setConfirmingBooking(false);
      setError('Não foi possível verificar o pagamento. A reserva não foi confirmada.');
      return;
    }

    try {
      if (!localizador) {
        const cleanPhoneConf = (user?.phone || '').replace(/\D/g, '');
        const confirmRes = await fetch('/api/lp/booking-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            booking_code: selectedApartment.booking_code,
            hotel_id: hotel.id,
            bill_id: billId,
            third_guest_name: user?.name || '',
            third_guest_cpf: (user?.cpf || '').replace(/\D/g, ''),
            third_guest_ddd: cleanPhoneConf.substring(0, 2),
            third_guest_cellphone: cleanPhoneConf.substring(2),
            third_guest_email: user?.email || '',
          }),
        });
        const confirmData = await confirmRes.json();
        if (confirmData.ok && confirmData.data?.localizador) {
          localizador = confirmData.data.localizador;
          setBookingLocator(localizador);
        } else {
          console.error('Falha ao confirmar reserva na Coobmais após pagamento:', confirmData);
          setConfirmingBooking(false);
          setError(confirmData.error || confirmData.data?.mensagem || 'Não foi possível confirmar a reserva. O pagamento não foi confirmado.');
          return;
        }
      }

      const saveRes = await fetch('/api/lp/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          hotel_id: hotel.id,
          hotel_name: hotel.name,
          hotel_city: typeof hotel.city === 'object' ? (hotel.city?.name || '') : (hotel.city || searchParams?.destination || ''),
          hotel_state: hotel.state || '',
          hotel_image: hotel.photos?.[0] || hotel.image || '',
          apartment_type: selectedApartment.type || selectedApartment.nomenclature || '',
          apartment_description: selectedApartment.accommodation_description || '',
          booking_code: selectedApartment.booking_code,
          localizador: localizador,
          bill_id: billId,
          check_in: (effectiveDates?.checkIn || searchParams?.checkIn) ? format(effectiveDates?.checkIn || searchParams.checkIn, 'yyyy-MM-dd') : null,
          check_out: (effectiveDates?.checkOut || searchParams?.checkOut) ? format(effectiveDates?.checkOut || searchParams.checkOut, 'yyyy-MM-dd') : null,
          adults: searchParams?.adults || 1,
          children: searchParams?.children || 0,
          total_price: selectedApartment.total_price || 0,
          metadata: JSON.stringify({
            payment_bill_id: billId,
            payment_status: paymentResult?.charge_status || null,
            payment_amount: paymentResult?.amount || null,
          }),
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.ok) {
        console.error('Falha ao registrar reserva após pagamento:', saveData);
        setConfirmingBooking(false);
        setError(saveData.error || 'Não foi possível registrar a reserva. O pagamento não foi confirmado.');
        return;
      }

      try {
        await fetch(`/api/lp/bookings/${localizador}/link-payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ bill_id: billId }),
        });
      } catch (e) {
        console.error('Erro ao vincular pagamento:', e);
      }

      setPaymentCompleted(true);
    } catch (e) {
      console.error('Erro ao confirmar reserva:', e);
      setError('Ocorreu um erro ao confirmar a reserva. Entre em contato com o suporte informando seu pagamento.');
    } finally {
      setConfirmingBooking(false);
    }
  };

  const handlePaymentFailure = useCallback(() => {
    setBookingLocator(null);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!hotel) return null;

  const activeSearchParams = effectiveDates
    ? { ...searchParams, checkIn: effectiveDates.checkIn, checkOut: effectiveDates.checkOut }
    : searchParams;

  const periodStr = activeSearchParams?.checkIn && activeSearchParams?.checkOut
    ? `${format(activeSearchParams.checkIn, 'dd/MM/yyyy')} – ${format(activeSearchParams.checkOut, 'dd/MM/yyyy')}`
    : '';

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!v && !alternativesModalOpen && !authOpen) handleClose(); }} modal={!authOpen}>
      <DialogContent
        className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-0 shadow-2xl bg-white mx-2 sm:mx-auto"
        onInteractOutside={(e) => { if (alternativesModalOpen || authOpen) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (alternativesModalOpen || authOpen) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (alternativesModalOpen || authOpen) e.preventDefault(); }}>
        <DialogHeader className="sr-only">
          <DialogTitle>Reservar hospedagem</DialogTitle>
          <DialogDescription>Fluxo de reserva</DialogDescription>
        </DialogHeader>

        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/20">
                <BedDouble className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-bold text-gray-800 truncate">{hotel.name}</h2>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  {hotel.cityState && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{hotel.cityState}</span>}
                  {periodStr && <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{periodStr}</span>}
                </div>
              </div>
            </div>
            <StepIndicator currentStep={step} />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && !loadingApartments && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <CircleAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                {step === 1 && apartments.length === 0 && (
                  <button
                    onClick={fetchApartments}
                    className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
            {step === 1 && <StepApartments apartments={apartments} loading={loadingApartments} onSelect={handleSelectApartment} extendedBy={extendedBy} checkOut={searchParams?.checkOut} />}
            {step === 2 && selectedApartment && (
              <StepReview
                apartment={selectedApartment}
                hotel={hotel}
                searchParams={activeSearchParams}
                user={user}
                expandedPolicy={expandedPolicy}
                setExpandedPolicy={setExpandedPolicy}
                onConfirm={handleReserveAndGoToPayment}
                onBack={() => { setStep(1); setSelectedApartment(null); setBookingResult(null); setBookingLocator(null); setError(''); }}
                onUserUpdate={onUserUpdate}
              />
            )}
            {step === 3 && (
              <PaymentFlow
                hotel={hotel}
                apartment={selectedApartment}
                searchParams={activeSearchParams}
                user={user}
                bookingLocator={bookingLocator}
                onClose={handleClose}
                onBack={() => { setBookingLocator(null); setStep(2); setError(''); }}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentFailure={handlePaymentFailure}
                onUserUpdate={onUserUpdate}
              />
            )}
            {step === 4 && (
              <StepResult
                apartment={selectedApartment}
                hotel={hotel}
                searchParams={activeSearchParams}
                bookingResult={bookingResult}
                bookingLocator={bookingLocator}
                paymentCompleted={paymentCompleted}
                confirming={confirmingBooking}
                error={error}
                onClose={handleClose}
              />
            )}
          </div>
        </div>

        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
    <BookingAlternativesModal
      open={alternativesModalOpen}
      onClose={() => setAlternativesModalOpen(false)}
      hotel={hotel}
      searchParams={activeSearchParams}
      excludeBookingCode={selectedApartment?.booking_code}
      onSelectAlternative={handleSelectAlternative}
    />
    </>
  );
}

function StepApartments({ apartments, loading, onSelect, extendedBy, checkOut }) {
  if (loading) return <AnimatedLoader messages={LOADING_MESSAGES} />;

  if (apartments.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
        </div>
        <p className="font-bold text-gray-700 text-base mb-1">Sem apartamentos disponíveis</p>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">Tente alterar as datas ou o número de hóspedes.</p>
      </div>
    );
  }

  const available = apartments;

  const extendedCheckOut = extendedBy > 0 && checkOut
    ? format(addDays(checkOut, extendedBy), 'dd/MM/yyyy')
    : null;

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-base font-bold text-gray-800">Escolha seu quarto</h3>
        <p className="text-xs text-gray-400 mt-0.5">{apartments.length} opção(ões) encontrada(s)</p>
      </div>
      {extendedCheckOut && (
        <div className="mb-4 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            Não encontramos quartos nas datas exatas. Os resultados abaixo são para checkout em <span className="font-bold">{extendedCheckOut}</span> ({extendedBy} diária{extendedBy > 1 ? 's' : ''} a mais).
          </p>
        </div>
      )}
      <div className="space-y-3">
        {available.map((apt, i) => (
          <ApartmentCard key={apt.booking_code || i} apt={apt} onSelect={onSelect} index={i} />
        ))}
      </div>
    </div>
  );
}

function ApartmentCard({ apt, onSelect, index }) {
  const [imgErr, setImgErr] = useState(false);
  const isAvailable = apt.availability !== 'sob_consulta';
  const dailyPrice = apt.cost?.[0]?.daily || (apt.total_price / Math.max(apt.daily_count || 1, 1));
  const extrasPerNight = apt.cost?.[0]?.extras || 0;
  const photo = !imgErr && apt.photos?.[0];

  return (
    <div
      onClick={() => onSelect(apt)}
      className="group bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
      style={{ animation: `fadeSlideIn 0.4s ease-out ${index * 0.1}s both` }}
    >
      <div className="flex flex-col sm:flex-row">
        {photo ? (
          <div className="sm:w-44 h-36 sm:h-auto flex-shrink-0 overflow-hidden">
            <img src={photo} alt={apt.type} onError={() => setImgErr(true)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className="hidden sm:flex sm:w-44 items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 flex-shrink-0">
            <ImageOff className="w-6 h-6 text-gray-200" />
          </div>
        )}

        <div className="flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-gray-800">{apt.type || 'Apartamento'}</h4>
                {isAvailable && (
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Disponível
                  </span>
                )}
              </div>
              {apt.nomenclature && <p className="text-[11px] text-gray-400 mt-0.5">{apt.nomenclature}</p>}
              {apt.accommodation_description && apt.accommodation_description !== apt.nomenclature && (
                <p className="text-[11px] text-blue-500 font-medium mt-0.5">{apt.accommodation_description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2.5">
            {apt.adults && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{apt.adults} adulto(s)</span>}
            {apt.daily_count && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.daily_count} noite(s)</span>}
            {apt.policies?.pension?.type && <span className="flex items-center gap-1 text-blue-500"><Coffee className="w-3 h-3" />{apt.policies.pension.type}</span>}
          </div>

          {apt.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {apt.amenities.slice(0, 5).map((a, j) => {
                const Icon = getAmenityIcon(a);
                return (
                  <span key={j} className="text-[9px] text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <Icon className="w-2.5 h-2.5 text-gray-400" />{a}
                  </span>
                );
              })}
              {apt.amenities.length > 5 && <span className="text-[9px] text-blue-500 font-medium px-1.5 py-0.5">+{apt.amenities.length - 5}</span>}
            </div>
          )}

          {apt.policies?.free && (
            <p className="text-[10px] text-emerald-600 flex items-center gap-1 mb-2.5 font-medium">
              <Gift className="w-3 h-3" /> {apt.policies.free}
            </p>
          )}

          <div className="flex items-end justify-between pt-3 border-t border-gray-50">
            <div>
              {apt.category_name && (
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mb-1">
                  {apt.category_name}{apt.season_label ? ` · ${apt.season_label} temporada` : ''}
                </p>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-gray-400">R$</span>
                <span className="text-xl font-bold text-gray-800">{formatCurrency(dailyPrice)}</span>
                <span className="text-[10px] text-gray-400">/noite</span>
              </div>
              <p className="text-[10px] text-blue-500 font-bold">Total R$ {formatCurrency(apt.total_price)}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/30 transition-all active:scale-[0.97]">
              Selecionar <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepReview({ apartment, hotel, searchParams, user, expandedPolicy, setExpandedPolicy, onConfirm, onBack, onUserUpdate }) {
  const cancellationText = stripHtml(apartment.policies?.cancellation || '');
  const cancellationLines = cancellationText.split('\n').filter(l => l.trim().length > 3);
  const dailyPrice = apartment.cost?.[0]?.daily || (apartment.total_price / Math.max(apartment.daily_count || 1, 1));

  const checkInMonth = searchParams?.checkIn ? new Date(searchParams.checkIn).getMonth() + 1 : null;
  const highSeasonMonths = hotel?.high_season_months || [];
  const isHighSeason = checkInMonth ? highSeasonMonths.includes(checkInMonth) : false;
  const crmDaily = (hotel?.category_low_rate || hotel?.category_high_rate)
    ? parseFloat(isHighSeason ? hotel.category_high_rate : hotel.category_low_rate) || null
    : null;
  const apiExtras = apartment.cost?.[0]?.extras || 0;
  const crmNoShow = crmDaily !== null ? crmDaily + apiExtras : null;
  const extrasPerNight = apartment.cost?.[0]?.extras || 0;
  const totalExtras = (apartment.cost || []).reduce((sum, c) => sum + (c.extras || 0), 0);
  const totalDailies = (apartment.cost || []).reduce((sum, c) => sum + (c.daily || 0), 0);
  const infoExtras = Array.isArray(apartment.info_extras) ? apartment.info_extras : [];
  const hasExtras = totalExtras > 0 || apiExtras > 0 || infoExtras.length > 0;
  const nightsCount = apartment.daily_count || apartment.cost?.length || 1;

  const hasCpf = !!(user?.cpf && user.cpf.replace(/\D/g, '').length === 11);
  const hasBirthDate = !!(user?.birth_date);
  const [cpfInput, setCpfInput] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [savingCpf, setSavingCpf] = useState(false);

  const formatCpfMask = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
            .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
            .replace(/(\d{3})(\d{3})/, '$1.$2')
            .replace(/(\d{3})/, '$1');
  };

  const isValidCpfInput = (cpf) => {
    const c = cpf.replace(/\D/g, '');
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(c[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(c[10]);
  };

  const handleConfirmWithCpf = async () => {
    let hasError = false;
    if (!hasCpf) {
      const cleaned = cpfInput.replace(/\D/g, '');
      if (cleaned.length !== 11) { setCpfError('Informe o CPF completo (11 dígitos).'); hasError = true; }
      else if (!isValidCpfInput(cpfInput)) { setCpfError('CPF inválido. Verifique os dígitos.'); hasError = true; }
    }
    if (!hasBirthDate) {
      if (!birthDateInput) { setBirthDateError('Informe sua data de nascimento.'); hasError = true; }
      else {
        const age = (new Date() - new Date(birthDateInput)) / (365.25 * 24 * 3600 * 1000);
        if (age < 18) { setBirthDateError('Você precisa ter pelo menos 18 anos.'); hasError = true; }
        if (age > 110) { setBirthDateError('Data de nascimento inválida.'); hasError = true; }
      }
    }
    if (hasError) return;

    const patchBody = {};
    if (!hasCpf) patchBody.cpf = cpfInput.replace(/\D/g, '');
    if (!hasBirthDate) patchBody.birth_date = birthDateInput;

    if (Object.keys(patchBody).length > 0) {
      setSavingCpf(true);
      try {
        const res = await fetch('/api/lp/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(patchBody),
        });
        const data = await res.json();
        if (!data.success) {
          if (res.status === 409) {
            setCpfError('__cpf_duplicado__');
          } else if (res.status === 400) {
            setCpfError('CPF inválido segundo nossos registros. Verifique e tente novamente.');
          } else {
            setCpfError('Não foi possível salvar os dados. Tente novamente.');
          }
          setSavingCpf(false);
          return;
        }
        if (onUserUpdate) onUserUpdate({ ...user, ...(patchBody.cpf ? { cpf: patchBody.cpf } : {}), ...(patchBody.birth_date ? { birth_date: patchBody.birth_date } : {}) });
      } catch {
        setCpfError('Erro de conexão ao salvar dados. Tente novamente.');
        setSavingCpf(false);
        return;
      }
      setSavingCpf(false);
    }
    onConfirm();
  };

  const formatCpf = (cpf) => {
    if (!cpf) return 'N/A';
    const c = cpf.replace(/\D/g, '');
    return c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-all hover:scale-105">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div>
          <h3 className="text-base font-bold text-gray-800">Revise sua reserva</h3>
          <p className="text-[11px] text-gray-400">Confira os detalhes antes de confirmar</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl p-5 border border-blue-100/60 mb-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-3">
          <BedDouble className="w-3.5 h-3.5" /> Detalhes do quarto
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Tipo" value={apartment.type || 'Apartamento'} />
          <InfoItem label="Categoria" value={apartment.nomenclature || apartment.type} />
          {apartment.accommodation_description && (
            <InfoItem label="Configuração" value={apartment.accommodation_description} />
          )}
          <InfoItem label="Período" value={
            searchParams?.checkIn && searchParams?.checkOut
              ? `${format(searchParams.checkIn, 'dd/MM/yyyy')} – ${format(searchParams.checkOut, 'dd/MM/yyyy')}`
              : 'N/A'
          } />
          <InfoItem label="Hóspedes" value={`${apartment.adults || 2} adulto(s)`} />
          <InfoItem label="Diárias" value={`${apartment.daily_count || 1} noite(s)`} />
          {apartment.policies?.pension?.type && (
            <InfoItem label="Pensão" value={apartment.policies.pension.type} highlight />
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-blue-100/50">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] text-blue-600 font-medium">Diária</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700">R$ {formatCurrency(dailyPrice)}</p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5">x{nightsCount}</span>
            </div>
          </div>
          {infoExtras.length > 0 && infoExtras.map((ie, idx) => (
            <div key={idx} className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] text-blue-600 font-medium">{ie.description}</p>
              <p className="text-sm font-semibold text-gray-700">R$ {formatCurrency(ie.total_value)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-blue-100/40">
            <p className="text-[10px] text-blue-500 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-800">R$ {formatCurrency(apartment.total_price)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Hóspede principal</p>
          <p className="text-sm font-bold text-gray-800 mb-2">{user?.name || 'N/A'}</p>
          <div className="space-y-1.5">
            {hasCpf ? (
              <p className="text-xs text-gray-500 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-gray-300" />{formatCpf(user.cpf)}</p>
            ) : (
              <div className="mt-2">
                <label className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <CreditCard className="w-3 h-3" /> CPF obrigatório para reservar
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpfInput}
                  onChange={(e) => { setCpfInput(formatCpfMask(e.target.value)); setCpfError(''); }}
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${cpfError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                  maxLength={14}
                />
                {cpfError === '__cpf_duplicado__' ? (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-[12px] font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                      <CircleAlert className="w-3.5 h-3.5 flex-shrink-0" /> CPF já cadastrado em outra conta
                    </p>
                    <p className="text-[11px] text-amber-600 leading-relaxed">
                      Este CPF está vinculado a outro cadastro. Se é seu CPF, faça login com a conta que o possui ou entre em contato com o suporte para regularizar.
                    </p>
                  </div>
                ) : cpfError ? (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><CircleAlert className="w-3 h-3" />{cpfError}</p>
                ) : null}
              </div>
            )}
            {!hasBirthDate && (
              <div className="mt-2">
                <label className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Data de nascimento obrigatória
                </label>
                <input
                  type="date"
                  value={birthDateInput}
                  onChange={(e) => { setBirthDateInput(e.target.value); setBirthDateError(''); }}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  min="1920-01-01"
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${birthDateError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                />
                {birthDateError && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><CircleAlert className="w-3 h-3" />{birthDateError}</p>}
              </div>
            )}
            {hasBirthDate && (
              <p className="text-xs text-gray-500 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-gray-300" />{new Date(user.birth_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
            )}
            {user?.email && <p className="text-xs text-gray-500 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-300" />{user.email}</p>}
            {user?.phone && <p className="text-xs text-gray-500 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-300" />{user.phone}</p>}
          </div>
        </div>

        <div className="space-y-3">
          {apartment.policies?.free && (
            <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Cortesia</p>
                <p className="text-xs text-emerald-600 font-medium">{apartment.policies.free}</p>
              </div>
            </div>
          )}

          {apartment.cost?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Diárias</p>
              <div className="flex gap-1 flex-wrap">
                {apartment.cost.map((c, i) => (
                  <div key={i} className="text-center bg-gray-50 rounded-lg py-1.5 px-2 min-w-[64px] border border-gray-100">
                    <p className="text-[8px] text-gray-300 font-bold">D{i + 1}</p>
                    <p className="text-[10px] font-bold text-gray-700 leading-tight">{formatCurrency(c.daily)}</p>
                  </div>
                ))}
              </div>
              {infoExtras.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100 space-y-1">
                  {infoExtras.map((ie, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 font-medium">{ie.description}</span>
                      <span className="text-amber-600 font-semibold">R$ {formatCurrency(ie.total_value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {cancellationLines.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 mb-5 overflow-hidden">
          <button onClick={() => setExpandedPolicy(!expandedPolicy)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              <Info className="w-3 h-3" /> Política de cancelamento
            </span>
            <ChevronRight className={`w-3.5 h-3.5 text-gray-300 transition-transform duration-300 ${expandedPolicy ? 'rotate-90' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${expandedPolicy ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-4 pb-3 space-y-1.5">
              {cancellationLines.map((line, i) => (
                <p key={i} className="text-[11px] text-gray-500 leading-relaxed flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-300 flex-shrink-0 mt-1.5" />{line}
                </p>
              ))}
              <div className="mt-2 pt-2 border-t border-amber-100">
                <p className="text-[11px] text-amber-700 font-bold mb-1">No-show</p>
                <p className="text-[11px] text-amber-600 leading-relaxed">
                  Para saber o valor do no-show, contate nosso time pelo WhatsApp:{' '}
                  <a
                    href={(() => {
                      const hotelName = hotel?.name || '';
                      const cityState = hotel?.cityState || [typeof hotel?.city === 'object' ? hotel?.city?.name : hotel?.city, hotel?.state].filter(Boolean).join('/');
                      const checkInStr = searchParams?.checkIn ? format(searchParams.checkIn, 'dd/MM/yyyy') : '';
                      const checkOutStr = searchParams?.checkOut ? format(searchParams.checkOut, 'dd/MM/yyyy') : '';
                      const msg = `Olá, preciso saber mais sobre a política de no-show da minha reserva:\nHotel: ${hotelName}${cityState ? `\nCidade/Estado: ${cityState}` : ''}${checkInStr ? `\nCheck-in: ${checkInStr}` : ''}${checkOutStr ? `\nCheck-out: ${checkOutStr}` : ''}`;
                      return `https://wa.me/555130273375?text=${encodeURIComponent(msg)}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline hover:text-amber-700"
                  >
                    +55 54 99457-6992
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleConfirmWithCpf}
        disabled={savingCpf || (!hasCpf && cpfInput.replace(/\D/g, '').length !== 11) || (!hasBirthDate && !birthDateInput)}
        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all active:scale-[0.99] text-sm ring-1 ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {savingCpf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
        {savingCpf ? 'Salvando CPF...' : 'Prosseguir para Pagamento'}
      </button>
      <p className="text-[10px] text-gray-400 text-center mt-2.5 flex items-center justify-center gap-1">
        <Lock className="w-2.5 h-2.5" /> Ao prosseguir, você aceita as políticas de cancelamento
      </p>
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] text-blue-500/80 font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? 'text-blue-600' : 'text-gray-700'}`}>{value}</p>
    </div>
  );
}

function StepResult({ apartment, hotel, searchParams, bookingResult, bookingLocator, paymentCompleted, confirming, error, onClose }) {
  if (confirming && !error && !paymentCompleted) {
    return (
      <div className="text-center py-10" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
        <div className="relative mx-auto mb-5 w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Confirmando sua reserva…</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">Estamos verificando o pagamento e confirmando a hospedagem. Não feche esta janela.</p>
      </div>
    );
  }

  if (paymentCompleted && bookingLocator && !error) {
    return (
      <div className="text-center py-6" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
        <div className="relative mx-auto mb-5 w-20 h-20">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-0.5">Reserva Confirmada!</h3>
        <p className="text-sm text-gray-500">{hotel.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{apartment?.type || 'Apartamento'} · {apartment?.daily_count} noite(s)</p>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl px-6 py-5 max-w-xs mx-auto mt-5 mb-5 shadow-xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Seu localizador</p>
          <p className="text-3xl font-bold text-white tracking-[0.15em] font-mono">{bookingLocator}</p>
          <p className="text-[10px] text-gray-500 mt-2">Guarde este código para consultas</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 max-w-xs mx-auto mb-5 text-left space-y-2 border border-gray-100">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Total</span>
            <span className="font-bold text-gray-700">R$ {formatCurrency(apartment?.total_price)}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Período</span>
            <span className="text-gray-600">
              {searchParams?.checkIn && searchParams?.checkOut
                ? `${format(searchParams.checkIn, 'dd/MM')} – ${format(searchParams.checkOut, 'dd/MM/yyyy')}`
                : 'N/A'}
            </span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Pagamento</span>
            <span className="font-bold text-emerald-600">Aprovado</span>
          </div>
        </div>

        <button onClick={onClose} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-10 py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm">
          Fechar
        </button>
      </div>
    );
  }

  const errorMsg = error || bookingResult?.data?.mensagem || 'Não foi possível concluir a reserva.';

  return (
    <div className="text-center py-8" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1">Não foi possível concluir o pagamento</h3>
      <p className="text-xs text-gray-500 mb-2 max-w-sm mx-auto leading-relaxed">{errorMsg}</p>
      <p className="text-xs text-emerald-600 font-medium mb-6 max-w-sm mx-auto">Sua reserva foi liberada e nenhum valor foi cobrado. Tente novamente com outro quarto ou outra forma de pagamento.</p>
      <button onClick={onClose} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm">
        Fechar
      </button>
    </div>
  );
}
