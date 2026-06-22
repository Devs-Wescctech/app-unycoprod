import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard, Loader2, CheckCircle2, AlertTriangle,
  Lock, ArrowLeft, Shield, Wallet, ChevronDown, QrCode, Copy, Check, Clock, User as UserIcon, MapPin
} from 'lucide-react';

function isValidCPF(cpf) {
  const c = (cpf || '').replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10]);
}
function maskCPF(v) { const n = (v || '').replace(/\D/g, '').slice(0, 11); return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); }
function maskPhone(v) { const n = (v || '').replace(/\D/g, '').slice(0, 11); if (n.length <= 10) return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2'); return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2'); }
function maskCEP(v) { const n = (v || '').replace(/\D/g, '').slice(0, 8); return n.replace(/(\d{5})(\d)/, '$1-$2'); }

function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtBR(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function detectCardBrand(number) {
  const n = (number || '').replace(/\s/g, '');
  if (/^4/.test(n)) return { code: 'visa', name: 'Visa' };
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return { code: 'mastercard', name: 'MasterCard' };
  if (/^3[47]/.test(n)) return { code: 'american_express', name: 'Amex' };
  if (/^6(?:011|5)/.test(n)) return { code: 'discover', name: 'Discover' };
  return null;
}

function formatCardNumber(value) {
  const v = value.replace(/\D/g, '').slice(0, 16);
  return v.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value) {
  const v = value.replace(/\D/g, '').slice(0, 4);
  if (v.length > 2) return v.slice(0, 2) + '/' + v.slice(2);
  return v;
}

const PAYMENT_MESSAGES = [
  { text: 'Processando pagamento...', Icon: Shield },
  { text: 'Validando dados...', Icon: Lock },
  { text: 'Comunicando com operadora...', Icon: CreditCard },
  { text: 'Finalizando transação...', Icon: CheckCircle2 },
];

function PaymentLoader() {
  const [currentMsg, setCurrentMsg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMsg(prev => (prev + 1) % PAYMENT_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const MsgIcon = PAYMENT_MESSAGES[currentMsg].Icon;

  return (
    <div className="flex flex-col items-center justify-center py-14 gap-5">
      <div className="relative">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100/80 flex items-center justify-center shadow-xl shadow-emerald-500/10">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
          <MsgIcon className="w-4 h-4 text-emerald-500" style={{ animation: 'fadeSlideIn 0.4s ease-out' }} />
        </div>
      </div>
      <div className="text-center">
        <p key={currentMsg} className="text-sm font-semibold text-gray-700" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
          {PAYMENT_MESSAGES[currentMsg].text}
        </p>
        <p className="text-xs text-gray-400 mt-1">Não feche esta janela</p>
      </div>
    </div>
  );
}

function isProfileComplete(u) {
  if (!u) return false;
  return !!(u.cpf && u.phone && u.cep && u.address && u.numero && u.bairro && u.cidade && u.estado);
}

export default function PaymentFlow({ hotel, apartment, searchParams, user, bookingLocator, onClose, onBack, onPaymentSuccess, onPaymentFailure, onUserUpdate }) {
  const [step, setStep] = useState(() => (isProfileComplete(user) ? 'choose' : 'complete-data'));
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pixCopied, setPixCopied] = useState(false);
  const [pixExpired, setPixExpired] = useState(false);
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const POLL_MAX_MS = 15 * 60 * 1000;
  const POLL_INTERVAL_MS = 5000;

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [installments, setInstallments] = useState(1);

  const [profileForm, setProfileForm] = useState({
    cpf: user?.cpf || '',
    phone: user?.phone || '',
    cep: user?.cep || '',
    address: user?.address || '',
    numero: user?.numero || '',
    bairro: user?.bairro || '',
    cidade: user?.cidade || '',
    estado: user?.estado || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm(p => ({
        cpf: p.cpf || user.cpf || '',
        phone: p.phone || user.phone || '',
        cep: p.cep || user.cep || '',
        address: p.address || user.address || '',
        numero: p.numero || user.numero || '',
        bairro: p.bairro || user.bairro || '',
        cidade: p.cidade || user.cidade || '',
        estado: p.estado || user.estado || '',
      }));
    }
  }, [user]);

  const handleCepBlur = useCallback(async () => {
    const cep = (profileForm.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data && !data.erro) {
        setProfileForm(p => ({
          ...p,
          address: data.logradouro || p.address,
          bairro: data.bairro || p.bairro,
          cidade: data.localidade || p.cidade,
          estado: data.uf || p.estado,
        }));
      }
    } catch (_) {} finally { setCepLoading(false); }
  }, [profileForm.cep]);

  const handleSaveProfile = useCallback(async () => {
    setError('');
    if (!isValidCPF(profileForm.cpf)) return setError('CPF inválido');
    if ((profileForm.phone || '').replace(/\D/g, '').length < 10) return setError('Telefone inválido');
    if ((profileForm.cep || '').replace(/\D/g, '').length !== 8) return setError('CEP inválido');
    if (!profileForm.address.trim()) return setError('Endereço obrigatório');
    if (!profileForm.numero.trim()) return setError('Número obrigatório');
    if (!profileForm.bairro.trim()) return setError('Bairro obrigatório');
    if (!profileForm.cidade.trim()) return setError('Cidade obrigatória');
    if (!profileForm.estado.trim() || profileForm.estado.length !== 2) return setError('Estado (UF) obrigatório');

    setProfileSaving(true);
    try {
      const res = await fetch('/api/lp/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Erro ao salvar dados');
        return;
      }
      if (onUserUpdate && data.user) onUserUpdate(data.user);
      setStep('choose');
    } catch (_) {
      setError('Erro de conexão ao salvar dados');
    } finally {
      setProfileSaving(false);
    }
  }, [profileForm, onUserUpdate]);

  const totalAmount = apartment?.total_price || 0;
  const brand = detectCardBrand(cardNumber);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
  }, []);

  const validateCard = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.length < 13 || num.length > 16) return 'Número do cartão inválido';
    if (!cardExpiry || cardExpiry.length < 5) return 'Validade inválida (MM/AA)';
    const [mm, yy] = cardExpiry.split('/');
    const month = parseInt(mm);
    if (month < 1 || month > 12) return 'Mês inválido';
    const year = parseInt('20' + yy);
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return 'Cartão expirado';
    if (!cardCvv || cardCvv.length < 3) return 'CVV inválido';
    if (!cardHolder.trim()) return 'Nome do titular obrigatório';
    if (!brand) return 'Bandeira do cartão não reconhecida';
    return null;
  };

  const handlePayment = useCallback(async (method) => {
    setError('');
    setProcessing(true);

    try {
      const body = {
        payment_method_code: method,
        customer_name: user?.name || 'Cliente',
        customer_email: user?.email || '',
        customer_cpf: user?.cpf || '',
        customer_phone: user?.phone || '',
        customer_address: (user?.cep && user?.address) ? {
          zipcode: user.cep,
          street: user.address,
          number: user.numero || '',
          neighborhood: user.bairro || '',
          city: user.cidade || '',
          state: user.estado || '',
        } : undefined,
        amount: totalAmount,
        description: `Hospedagem - ${hotel?.name || 'Hotel'} - ${apartment?.type || 'Apartamento'}`,
        booking_locator: bookingLocator || '',
        hotel_name: hotel?.name || '',
        hotel_id: hotel?.id,
        booking_code: apartment?.booking_code,
        check_in: fmtBR(searchParams?.checkIn),
        check_out: fmtBR(searchParams?.checkOut),
        adults: searchParams?.adults || 2,
        children: searchParams?.children || 0,
        installments: method === 'cartao_unyco' ? installments : 1,
      };

      if (method === 'cartao_unyco') {
        body.card_number = cardNumber.replace(/\s/g, '');
        body.card_expiration = cardExpiry;
        body.card_cvv = cardCvv;
        body.card_holder_name = cardHolder;
        body.card_company_code = brand?.code || 'visa';
      }

      const res = await fetch('/api/vindi/create-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.ok) {
        const isPaid = data.data?.charge_status === 'paid';
        if (method === 'pix_unyco') {
          setResult(data.data);
          setStep('pix-display');
          startPixPolling(data.data.bill_id);
        } else if (isPaid && onPaymentSuccess) {
          onPaymentSuccess(data.data);
        } else if (!isPaid) {
          if (onPaymentFailure) onPaymentFailure(data.data);
          setError('Pagamento não foi aprovado. A reserva foi liberada — escolha outro quarto ou forma de pagamento.');
          setStep('error');
        }
      } else {
        if (onPaymentFailure) onPaymentFailure(null);
        setError(data.error || 'Erro ao processar pagamento');
        setStep('error');
      }
    } catch (e) {
      if (onPaymentFailure) onPaymentFailure(null);
      setError('Erro de conexão. Tente novamente.');
      setStep('error');
    } finally {
      setProcessing(false);
    }
  }, [user, totalAmount, hotel, apartment, installments, cardNumber, cardExpiry, cardCvv, cardHolder, brand, bookingLocator, onPaymentSuccess, onPaymentFailure]);

  const startPixPolling = useCallback((billId) => {
    stopPolling();
    setPixExpired(false);
    const FINAL_NEGATIVE = ['canceled', 'cancelled', 'charge_canceled_dev', 'failed', 'expired'];

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setPixExpired(true);
      if (onPaymentFailure) onPaymentFailure({ bill_id: billId, charge_status: 'expired' });
    }, POLL_MAX_MS);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/vindi/bill/${billId}`, { credentials: 'same-origin' });
        const data = await res.json();
        if (!data.ok) return;
        const status = data.data?.charge_status || data.data?.status;
        if (status === 'paid') {
          stopPolling();
          if (onPaymentSuccess) onPaymentSuccess({ ...result, ...data.data, bill_id: billId, charge_status: 'paid' });
        } else if (FINAL_NEGATIVE.includes(status)) {
          stopPolling();
          setPixExpired(true);
          if (onPaymentFailure) onPaymentFailure({ bill_id: billId, charge_status: status });
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS);
  }, [onPaymentSuccess, onPaymentFailure, result, stopPolling]);

  const handleCopyPix = () => {
    const code = result?.pix?.qrcode_original_path;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    });
  };

  const handleCreditCardSubmit = () => {
    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    handlePayment('cartao_unyco');
  };

  const handleChooseMethod = (method) => {
    setError('');
    setPaymentMethod(method);
    if (method === 'cartao_unyco') {
      setStep('form');
    } else if (method === 'pix_unyco') {
      handlePayment('pix_unyco');
    }
  };


  if (processing) return <PaymentLoader />;

  if (step === 'error') {
    return (
      <div className="text-center py-8" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Erro no Pagamento</h3>
        <p className="text-sm text-red-500 mb-5 max-w-sm mx-auto">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { stopPolling(); if (onBack) { onBack(); } else { setStep('choose'); } setError(''); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl transition-all text-sm">
            Voltar e tentar de novo
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'complete-data') {
    const missing = {
      cpf: !user?.cpf,
      phone: !user?.phone,
      address: !(user?.cep && user?.address && user?.numero && user?.bairro && user?.cidade && user?.estado),
    };
    return (
      <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
        <div className="flex items-center gap-3 mb-5">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-all hover:scale-105">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <div>
            <h3 className="text-base font-bold text-gray-800">Complete seus dados</h3>
            <p className="text-xs text-gray-500 mt-0.5">Precisamos dessas informações para emitir o pagamento</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Seu cadastro está incompleto. Preencha {[missing.cpf && 'CPF', missing.phone && 'telefone', missing.address && 'endereço'].filter(Boolean).join(', ')} para continuar.
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5"><UserIcon className="w-3 h-3 inline mr-1" />CPF *</label>
              <input
                type="text"
                value={maskCPF(profileForm.cpf)}
                onChange={(e) => setProfileForm(p => ({ ...p, cpf: e.target.value.replace(/\D/g, '') }))}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                disabled={!!user?.cpf}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Telefone *</label>
              <input
                type="text"
                value={maskPhone(profileForm.phone)}
                onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5"><MapPin className="w-3 h-3 inline mr-1" />CEP *</label>
              <div className="relative">
                <input
                  type="text"
                  value={maskCEP(profileForm.cep)}
                  onChange={(e) => setProfileForm(p => ({ ...p, cep: e.target.value.replace(/\D/g, '') }))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
                {cepLoading && <Loader2 className="w-3.5 h-3.5 absolute right-2 top-2.5 animate-spin text-gray-400" />}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Endereço *</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Rua, avenida..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Número *</label>
              <input
                type="text"
                value={profileForm.numero}
                onChange={(e) => setProfileForm(p => ({ ...p, numero: e.target.value }))}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bairro *</label>
              <input
                type="text"
                value={profileForm.bairro}
                onChange={(e) => setProfileForm(p => ({ ...p, bairro: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cidade *</label>
              <input
                type="text"
                value={profileForm.cidade}
                onChange={(e) => setProfileForm(p => ({ ...p, cidade: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">UF *</label>
              <input
                type="text"
                value={profileForm.estado}
                onChange={(e) => setProfileForm(p => ({ ...p, estado: e.target.value.toUpperCase().slice(0, 2) }))}
                placeholder="SP"
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {profileSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <>Salvar e continuar</>}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'choose') {
    return (
      <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
        <div className="flex items-center gap-3 mb-5">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-all hover:scale-105">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <div>
            <h3 className="text-base font-bold text-gray-800">Forma de pagamento</h3>
            <p className="text-[11px] text-gray-400">Escolha como deseja pagar sua reserva</p>
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-700">Total a pagar</span>
          </div>
          <span className="text-lg font-bold text-gray-800">R$ {formatCurrency(totalAmount)}</span>
        </div>

        <div className="space-y-3 mb-4">
          <button
            onClick={() => handleChooseMethod('pix_unyco')}
            className="w-full bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-2xl p-4 flex items-center gap-4 transition-all text-left active:scale-[0.99] group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">Pix</p>
              <p className="text-[11px] text-gray-500">Aprovação imediata, sem taxas</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Instantâneo</span>
          </button>

          <button
            onClick={() => handleChooseMethod('cartao_unyco')}
            className="w-full bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-2xl p-4 flex items-center gap-4 transition-all text-left active:scale-[0.99] group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">Cartão de Crédito</p>
              <p className="text-[11px] text-gray-500">Parcele em até 6x</p>
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Em até 6x</span>
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
          <Shield className="w-2.5 h-2.5" /> Pagamento seguro processado pela Vindi
        </p>
      </div>
    );
  }

  if (step === 'pix-display') {
    const pix = result?.pix || {};
    return (
      <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => {
            stopPolling();
            const billId = result?.bill_id;
            if (billId && onPaymentFailure) onPaymentFailure({ bill_id: billId, charge_status: 'abandoned' });
            setResult(null);
            setPixExpired(false);
            if (onBack) onBack(); else setStep('choose');
          }} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-all hover:scale-105">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h3 className="text-base font-bold text-gray-800">Pague com Pix</h3>
            <p className="text-[11px] text-gray-400">Aponte a câmera do seu app bancário</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5 mb-4 text-center">
          {pix.qrcode_path ? (
            <img
              src={pix.qrcode_path}
              alt="QR Code Pix"
              className="w-56 h-56 mx-auto rounded-xl bg-white p-2 shadow-md"
            />
          ) : (
            <div className="w-56 h-56 mx-auto rounded-xl bg-white flex items-center justify-center shadow-md">
              <QrCode className="w-24 h-24 text-gray-300" />
            </div>
          )}
          {pixExpired ? (
            <>
              <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Pix expirado ou cancelado</span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500 max-w-xs mx-auto">A reserva foi liberada e nenhum valor foi cobrado. Refaça a reserva para gerar um novo Pix.</p>
              <button
                onClick={() => { setResult(null); setPixExpired(false); if (onBack) onBack(); else setStep('choose'); }}
                className="mt-3 inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar e refazer reserva
              </button>
            </>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-center gap-2 text-emerald-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs font-semibold">Aguardando pagamento…</span>
              </div>
              <p className="text-[10px] text-emerald-600/70 mt-1">A confirmação é automática assim que cair</p>
            </>
          )}
        </div>

        {pix.qrcode_original_path && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Pix Copia e Cola</p>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-[11px] font-mono text-gray-700 break-all line-clamp-2 leading-snug">
                {pix.qrcode_original_path}
              </p>
              <button
                onClick={handleCopyPix}
                className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${pixCopied ? 'bg-emerald-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                title="Copiar código Pix"
              >
                {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            O Pix expira em alguns minutos. Após pagar, sua reserva será confirmada automaticamente.
          </p>
        </div>

        <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-700">Total a pagar</span>
          </div>
          <span className="text-lg font-bold text-gray-800">R$ {formatCurrency(totalAmount)}</span>
        </div>
      </div>
    );
  }

  if (step === 'form' && paymentMethod === 'cartao_unyco') {
    return (
      <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setStep('choose'); setError(''); }} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-all hover:scale-105">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h3 className="text-base font-bold text-gray-800">Pagamento</h3>
            <p className="text-[11px] text-gray-400">Preencha os dados do cartão de crédito</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 mb-5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <CreditCard className="w-8 h-8 text-gray-400" />
            {brand && <span className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full">{brand.name}</span>}
          </div>
          <p className="text-lg font-mono text-white tracking-[0.2em] mb-4">
            {cardNumber || '•••• •••• •••• ••••'}
          </p>
          <div className="flex justify-between text-xs text-gray-400">
            <div>
              <p className="text-[9px] uppercase tracking-wider mb-0.5">Titular</p>
              <p className="text-white font-medium text-sm">{cardHolder || 'NOME DO TITULAR'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider mb-0.5">Validade</p>
              <p className="text-white font-medium">{cardExpiry || 'MM/AA'}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Número do cartão</label>
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              maxLength={19}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Nome do titular</label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              placeholder="NOME COMO NO CARTÃO"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Validade</label>
              <input
                type="text"
                inputMode="numeric"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="MM/AA"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                maxLength={5}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">CVV</label>
              <input
                type="text"
                inputMode="numeric"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                maxLength={4}
              />
            </div>
          </div>

          {totalAmount >= 100 && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Parcelas</label>
              <div className="relative">
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all pr-10"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>
                      {n}x de R$ {formatCurrency(totalAmount / n)}{n === 1 ? ' (à vista)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-700">Total a pagar</span>
          </div>
          <span className="text-lg font-bold text-gray-800">R$ {formatCurrency(totalAmount)}</span>
        </div>

        <button
          onClick={handleCreditCardSubmit}
          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all active:scale-[0.99] text-sm"
        >
          <Lock className="w-4 h-4" /> Pagar R$ {formatCurrency(totalAmount)}
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
          <Shield className="w-2.5 h-2.5" /> Pagamento seguro processado pela Vindi
        </p>
      </div>
    );
  }

  return null;
}
