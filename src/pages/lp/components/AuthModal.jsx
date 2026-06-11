import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LogIn, UserPlus, Eye, EyeOff, Loader2, CircleAlert, CheckCircle2 } from 'lucide-react';
import PhoneInput from './PhoneInput';

function UnycoLogoBlue() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="90" height="25" viewBox="0 0 251.536 69.351">
      <path d="M245.447,81.235h14.214c1.421,3.131,3.886,4.365,8.434,4.365,6.254,0,9-2.941,9-10.057V70.894a13.369,13.369,0,0,1-11.655,6.262c-9.854,0-20.374-6.642-20.374-23.814V29.814h14.215V53.342c0,7.4,3.6,10.532,8.907,10.532,5.117,0,8.906-3.32,8.906-10.532V29.814h14.215V75.069c0,16.317-10.424,22.864-23.216,22.864C257.008,97.933,247.818,92.809,245.447,81.235ZM354.334,73.1s0,0,0,0c-.2-.15-.379-.285-.524-.4l-.068-.054-.051-.041c-.152-.121-.327-.262-.535-.439l-.261-.223A47.629,47.629,0,0,1,347.973,67l9.411-10.011a30.322,30.322,0,0,0,5.277,5.21c.3.228.595.442.89.649a11.277,11.277,0,0,0,6.263,1.786c6.444,0,10.8-4.648,10.8-11.384s-4.357-11.385-10.8-11.385a10.824,10.824,0,0,0-8.055,3.268L338.507,71.118a25.056,25.056,0,0,1-17.82,6.8c-14.783,0-25.205-10.436-25.205-24.666S305.9,28.581,320.687,28.581c1.147,0,2.97.07,4.06.194V42.321a18.012,18.012,0,0,0-4.06-.457c-6.444,0-10.8,4.648-10.8,11.385s4.359,11.384,10.8,11.384a10.814,10.814,0,0,0,8.065-3.281l23.253-25.984a25.057,25.057,0,0,1,17.809-6.786c14.783,0,25.205,10.435,25.205,24.667S384.6,77.915,369.815,77.915A25.718,25.718,0,0,1,354.334,73.1Zm-210.849-19V29.814H157.7V54.1c0,7.4,3.6,10.531,8.907,10.531s8.907-3.131,8.907-10.531V29.814h14.215V54.1c0,15.749-9.288,23.813-23.122,23.813S143.484,69.945,143.484,54.1ZM226.3,76.681V52.394c0-7.4-3.6-10.531-8.907-10.531s-8.907,3.13-8.907,10.531V76.681H194.276V52.394c0-15.749,9.286-23.813,23.121-23.813s23.121,7.969,23.121,23.813V76.681Z" transform="translate(-143.484 -28.581)" fill="#1d4ed8"/>
    </svg>
  );
}

export default function AuthModal({ initialTab = 'login', onClose, onSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
            .replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
            .replace(/(\d{2})(\d{1,5})/, '($1) $2');
  };

  const afterAuth = async () => {
    const [sessionRes, configRes] = await Promise.all([
      fetch('/api/lp/session', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({})),
      fetch('/api/config/public').then(r => r.json()).catch(() => ({})),
    ]);
    const user = sessionRes?.user || null;
    const subscription = sessionRes?.subscription || null;
    const plansEnabled = configRes?.config?.plans_enabled !== false;
    onSuccess(user, subscription, plansEnabled);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginForm.email || !loginForm.password) { setError('Preencha e-mail e senha.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/lp/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'E-mail ou senha inválidos.'); setLoading(false); return; }
      await afterAuth();
      onClose();
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const { name, phone, email, password, confirm } = regForm;
    if (!name || !phone || !email || !password) { setError('Preencha todos os campos obrigatórios.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (password.length < 8) { setError('Senha deve ter pelo menos 8 caracteres.'); return; }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Senha fraca. Use maiúsculas, minúsculas, números e um símbolo (ex: @#$!).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/lp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: name.trim(), phone: phone.replace(/\D/g, ''), email, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Erro ao criar conta.'); setLoading(false); return; }
      await afterAuth();
      if (data.redirect && data.redirect !== '/') {
        window.location.href = data.redirect;
        return;
      }
      onClose();
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pt-8 pb-5 px-6 text-center border-b border-gray-100">
          <UnycoLogoBlue />
          <p className="text-base font-bold text-gray-800 mt-3">
            {tab === 'login' ? 'Seja bem-vindo de volta!' : 'Crie sua conta grátis'}
          </p>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === 'login' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LogIn className="w-3.5 h-3.5 inline mr-1.5" />Entrar
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === 'register' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />Cadastrar
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 text-red-600 text-[12px] font-medium mb-4">
              <CircleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">E-mail</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando…</> : <><LogIn className="w-4 h-4" /> Entrar</>}
              </button>
              <p className="text-xs text-center text-gray-400 pt-1">
                Não tem conta?{' '}
                <button type="button" onClick={() => { setTab('register'); setError(''); }} className="text-blue-500 font-semibold hover:underline">
                  Cadastre-se grátis
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nome completo</label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Telefone</label>
                <PhoneInput
                  defaultValue={regForm.phone}
                  onChange={digits => setRegForm(p => ({ ...p, phone: digits }))}
                  variant="auth"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">E-mail</label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regForm.password}
                    onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mín. 8 chars, maiúsc, núm e símbolo"
                    autoComplete="new-password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Confirmar senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={regForm.confirm}
                    onChange={e => setRegForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 pr-10 ${regForm.confirm && regForm.confirm !== regForm.password ? 'border-red-300' : 'border-gray-200'}`}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {regForm.confirm && regForm.confirm === regForm.password && (
                    <CheckCircle2 className="absolute right-9 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta…</> : <><UserPlus className="w-4 h-4" /> Criar conta</>}
              </button>
              <p className="text-xs text-center text-gray-400 pt-1">
                Já tem conta?{' '}
                <button type="button" onClick={() => { setTab('login'); setError(''); }} className="text-blue-500 font-semibold hover:underline">
                  Entrar
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
