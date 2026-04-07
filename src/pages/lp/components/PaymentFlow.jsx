import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Loader2, CheckCircle2, AlertTriangle,
  Lock, ArrowLeft, Shield, Wallet, ChevronDown
} from 'lucide-react';

function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export default function PaymentFlow({ hotel, apartment, searchParams, user, onClose, onBack, onPaymentSuccess }) {
  const [step, setStep] = useState('form');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [installments, setInstallments] = useState(1);

  const totalAmount = apartment?.total_price || 0;
  const brand = detectCardBrand(cardNumber);

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
        amount: totalAmount,
        description: `Hospedagem - ${hotel?.name || 'Hotel'} - ${apartment?.type || 'Apartamento'}`,
        booking_locator: '',
        hotel_name: hotel?.name || '',
        installments: method === 'credit_card' ? installments : 1,
      };

      if (method === 'credit_card') {
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
        if (isPaid && onPaymentSuccess) {
          onPaymentSuccess(data.data);
        } else if (!isPaid) {
          setError('Pagamento não foi aprovado. Tente novamente.');
          setStep('error');
        }
      } else {
        setError(data.error || 'Erro ao processar pagamento');
        setStep('error');
      }
    } catch (e) {
      setError('Erro de conexão. Tente novamente.');
      setStep('error');
    } finally {
      setProcessing(false);
    }
  }, [user, totalAmount, hotel, apartment, installments, cardNumber, cardExpiry, cardCvv, cardHolder, brand, onPaymentSuccess]);

  const handleCreditCardSubmit = () => {
    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    handlePayment('credit_card');
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
          <button onClick={() => { setStep(paymentMethod ? 'form' : 'choose'); setError(''); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl transition-all text-sm">
            Tentar novamente
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'form' && paymentMethod === 'credit_card') {
    return (
      <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
        <div className="flex items-center gap-3 mb-5">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-all hover:scale-105">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
          )}
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
