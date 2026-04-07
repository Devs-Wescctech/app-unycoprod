import { useState, useEffect, useRef } from 'react';
import { User, Heart, Calendar, HelpCircle, LogOut, Menu, X, ChevronDown, ChevronRight, MapPin, Shield, Phone, Mail, Star, Sparkles, ExternalLink, MessageCircle, Crown, Globe, Compass, Award, Clock, CreditCard, Settings, Bell, Home, Briefcase, Trash2 } from 'lucide-react';
import MyBookings from './MyBookings';

function UnycoLogo({ fill = '#fff', width = 120, height = 33 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 251.536 69.351">
      <path d="M245.447,81.235h14.214c1.421,3.131,3.886,4.365,8.434,4.365,6.254,0,9-2.941,9-10.057V70.894a13.369,13.369,0,0,1-11.655,6.262c-9.854,0-20.374-6.642-20.374-23.814V29.814h14.215V53.342c0,7.4,3.6,10.532,8.907,10.532,5.117,0,8.906-3.32,8.906-10.532V29.814h14.215V75.069c0,16.317-10.424,22.864-23.216,22.864C257.008,97.933,247.818,92.809,245.447,81.235ZM354.334,73.1s0,0,0,0c-.2-.15-.379-.285-.524-.4l-.068-.054-.051-.041c-.152-.121-.327-.262-.535-.439l-.261-.223A47.629,47.629,0,0,1,347.973,67l9.411-10.011a30.322,30.322,0,0,0,5.277,5.21c.3.228.595.442.89.649a11.277,11.277,0,0,0,6.263,1.786c6.444,0,10.8-4.648,10.8-11.384s-4.357-11.385-10.8-11.385a10.824,10.824,0,0,0-8.055,3.268L338.507,71.118a25.056,25.056,0,0,1-17.82,6.8c-14.783,0-25.205-10.436-25.205-24.666S305.9,28.581,320.687,28.581c1.147,0,2.97.07,4.06.194V42.321a18.012,18.012,0,0,0-4.06-.457c-6.444,0-10.8,4.648-10.8,11.385s4.359,11.384,10.8,11.384a10.814,10.814,0,0,0,8.065-3.281l23.253-25.984a25.057,25.057,0,0,1,17.809-6.786c14.783,0,25.205,10.435,25.205,24.667S384.6,77.915,369.815,77.915A25.718,25.718,0,0,1,354.334,73.1Zm-210.849-19V29.814H157.7V54.1c0,7.4,3.6,10.531,8.907,10.531s8.907-3.131,8.907-10.531V29.814h14.215V54.1c0,15.749-9.288,23.813-23.122,23.813S143.484,69.945,143.484,54.1ZM226.3,76.681V52.394c0-7.4-3.6-10.531-8.907-10.531s-8.907,3.13-8.907,10.531V76.681H194.276V52.394c0-15.749,9.286-23.813,23.121-23.813s23.121,7.969,23.121,23.813V76.681Z" transform="translate(-143.484 -28.581)" fill={fill}/>
    </svg>
  );
}

export { UnycoLogo };

export default function LPHeader({ user, onLogout }) {
  const userName = user?.name || user?.nome || 'Membro';
  const userEmail = user?.email || '';
  const userPhone = user?.phone || user?.telefone || '';
  const userCpf = user?.cpf || '';
  const userPlan = user?.plan || user?.plano || 'Membro Unyco';
  const firstName = userName.split(' ')[0];
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [plansEnabled, setPlansEnabled] = useState(true);

  useEffect(() => {
    fetch('/api/config/public').then(r => r.json())
      .then(data => { if (data?.config?.plans_enabled === false) setPlansEnabled(false); })
      .catch(() => {});
  }, []);
  const [activeView, setActiveView] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState(null);
  const [bookingCount, setBookingCount] = useState(0);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/lp/bookings', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.ok) setBookingCount((data.data || []).length);
      } catch {}
    };
    fetchCount();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/lp/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {}
    if (onLogout) onLogout();
    window.location.href = '/lp/index.html';
  };

  const scrollToSearch = () => {
    setMobileOpen(false);
    setActiveNav('destinos');
    const el = document.querySelector('[data-search-form]') || document.querySelector('.search-form-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'destinos', label: 'Destinos', icon: Compass, action: scrollToSearch },
    { id: 'reservas', label: 'Minhas Reservas', icon: Calendar, action: () => { setMobileOpen(false); setActiveNav('reservas'); setActiveView('reservas'); }, badge: bookingCount > 0 ? bookingCount : null },
    { id: 'ajuda', label: 'Ajuda', icon: HelpCircle, action: () => { setMobileOpen(false); setActiveNav('ajuda'); setActiveView('ajuda'); } },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0b1c3f]/95 backdrop-blur-xl shadow-lg border-b border-white/10'
          : 'bg-transparent'
      }`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-20 -left-20 w-60 h-60 bg-blue-300/[0.06] rounded-full blur-3xl transition-opacity duration-700 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute -top-10 -right-10 w-40 h-40 bg-sky-300/[0.04] rounded-full blur-3xl transition-opacity duration-700 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-[72px]">
            <a href="/" className="flex items-center gap-3.5 shrink-0 group">
              <div className="relative">
                <UnycoLogo width={110} height={30} />
                <div className="absolute -bottom-1.5 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-yellow-400/8 to-amber-500/10 border border-amber-400/15 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 animate-shimmer" />
                <Crown className="w-3 h-3 text-amber-400 relative" />
                <span className="text-[10px] font-bold text-amber-300/90 uppercase tracking-[0.12em] relative">Exclusivo para membros</span>
              </div>
            </a>

            <nav className="hidden md:flex items-center">
              <div className="flex items-center bg-white/[0.04] rounded-full px-1 py-1 border border-white/[0.06] backdrop-blur-md">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 group relative ${
                      activeNav === item.id
                        ? 'text-white bg-white/[0.1] shadow-sm'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 transition-colors duration-300 ${
                      activeNav === item.id ? 'text-blue-400' : 'text-white/30 group-hover:text-blue-400/80'
                    }`} />
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-blue-500/80 text-white text-[10px] font-bold leading-none">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </nav>

            <div className="flex items-center gap-2.5">
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full transition-all duration-300 group ${
                    profileOpen
                      ? 'bg-white/[0.12] ring-1 ring-white/15 shadow-lg shadow-black/20'
                      : 'hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="hidden sm:flex flex-col items-end mr-0.5">
                    <span className="text-white/85 text-[13px] font-medium leading-tight group-hover:text-white transition-colors">
                      {firstName}
                    </span>
                    {plansEnabled && <span className="text-amber-400/50 text-[10px] font-semibold tracking-wide">{userPlan}</span>}
                  </div>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/25 ring-2 ring-white/10">
                      {initials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0b1c3f] shadow-sm shadow-emerald-400/30" />
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/30 hidden sm:block transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[56px] z-[60] w-[360px] rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/40 border border-white/10" style={{ animation: 'dropdownIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div className="bg-gradient-to-b from-[#0b1c3f] via-[#0f2547] to-[#0b1c3f]">
                      <div className="relative px-5 pt-5 pb-4">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-400/5 to-transparent rounded-bl-full" />
                        <div className="relative flex items-center gap-4">
                          <div className="relative">
                            <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-xl shadow-blue-500/25 ring-2 ring-white/10 shrink-0">
                              {initials}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-[2.5px] border-[#0b1c3f] flex items-center justify-center shadow-lg shadow-emerald-400/30">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-base truncate leading-tight">{userName}</p>
                            {userEmail && <p className="text-white/35 text-xs truncate mt-0.5">{userEmail}</p>}
                            {plansEnabled && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="flex items-center gap-1 px-2.5 py-[3px] rounded-full bg-gradient-to-r from-amber-400/12 to-yellow-400/8 border border-amber-400/15">
                                <Crown className="w-2.5 h-2.5 text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-300/90 tracking-wide">{userPlan}</span>
                              </div>
                            </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-3 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.04]">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-blue-400/70" />
                              <span className="text-white/80 text-sm font-bold">{bookingCount}</span>
                            </div>
                            <p className="text-white/25 text-[10px] mt-0.5 ml-5.5">Reservas</p>
                          </div>
                          <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.04]">
                            <div className="flex items-center gap-2">
                              <Award className="w-3.5 h-3.5 text-amber-400/70" />
                              <span className="text-white/80 text-sm font-bold">{new Date().getFullYear()}</span>
                            </div>
                            <p className="text-white/25 text-[10px] mt-0.5 ml-5.5">Membro desde</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 pb-1">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                      </div>

                      <div className="px-3 py-1.5">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] px-3 mb-1">Minha Conta</p>
                        <DropdownItem icon={User} label="Meu Perfil" subtitle="Dados pessoais e informacoes" onClick={() => { setProfileOpen(false); setActiveView('perfil'); }} />
                        <DropdownItem icon={Calendar} label="Minhas Reservas" subtitle={`${bookingCount} reserva${bookingCount !== 1 ? 's' : ''} registrada${bookingCount !== 1 ? 's' : ''}`} onClick={() => { setProfileOpen(false); setActiveView('reservas'); }} />
                        <DropdownItem icon={Heart} label="Favoritos" subtitle="Hoteis e destinos salvos" onClick={() => { setProfileOpen(false); setActiveView('favoritos'); }} />
                      </div>

                      <div className="px-3 py-0.5">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                      </div>

                      <div className="px-3 py-1.5">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] px-3 mb-1">Suporte</p>
                        <DropdownItem icon={HelpCircle} label="Central de Ajuda" subtitle="Duvidas frequentes e contato" onClick={() => { setProfileOpen(false); setActiveView('ajuda'); }} />
                        <DropdownItem icon={MessageCircle} label="WhatsApp" subtitle="Atendimento direto" onClick={() => window.open('https://wa.me/5551991777183', '_blank')} external />
                      </div>

                      <div className="px-3 pb-3.5 pt-1">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 text-[13px] font-medium group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-500/8 group-hover:bg-red-500/12 flex items-center justify-center transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          Sair da conta
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/[0.06] transition-all active:scale-95 border border-white/[0.06]"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-x-0 top-[72px] bottom-0 z-50 md:hidden overflow-y-auto" style={{ animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div className="bg-gradient-to-b from-[#0b1c3f] to-[#091732] backdrop-blur-2xl border-t border-white/10 min-h-full">
                <div className="px-4 pt-2 pb-4">
                  <div className="flex items-center gap-3.5 px-3 py-4 mb-2">
                    <div className="relative">
                      <div className="rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-white/8" style={{ width: 52, height: 52 }}>
                        {initials}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0b1c3f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-[15px] truncate">{userName}</p>
                      {userEmail && <p className="text-white/30 text-xs truncate mt-0.5">{userEmail}</p>}
                      {plansEnabled && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-300/80 font-semibold">{userPlan}</span>
                      </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 px-1 mb-4">
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-400/70" />
                        <span className="text-white/80 text-sm font-bold">{bookingCount}</span>
                      </div>
                      <p className="text-white/25 text-[10px] mt-0.5 ml-5.5">Reservas</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-amber-400/70" />
                        <span className="text-white/80 text-sm font-bold">{new Date().getFullYear()}</span>
                      </div>
                      <p className="text-white/25 text-[10px] mt-0.5 ml-5.5">Membro desde</p>
                    </div>
                  </div>

                  <p className="text-[9px] font-bold text-white/15 uppercase tracking-[0.15em] px-4 mb-2">Navegacao</p>
                  <div className="space-y-0.5">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] transition-all text-[15px] font-medium active:scale-[0.98]"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.04]">
                          <item.icon className="w-4 h-4" />
                        </div>
                        {item.label}
                        {item.badge && (
                          <span className="ml-1 min-w-[20px] h-[20px] flex items-center justify-center px-1.5 rounded-full bg-blue-500/80 text-white text-[10px] font-bold">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 ml-auto text-white/15" />
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-white/[0.05] my-3 mx-2" />

                  <p className="text-[9px] font-bold text-white/15 uppercase tracking-[0.15em] px-4 mb-2">Conta</p>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setMobileOpen(false); setActiveView('perfil'); }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] transition-all text-[15px] font-medium"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.04]">
                        <User className="w-4 h-4" />
                      </div>
                      Meu Perfil
                      <ChevronRight className="w-4 h-4 ml-auto text-white/15" />
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); setActiveView('favoritos'); }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] transition-all text-[15px] font-medium"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.04]">
                        <Heart className="w-4 h-4" />
                      </div>
                      Favoritos
                      <ChevronRight className="w-4 h-4 ml-auto text-white/15" />
                    </button>
                  </div>

                  <div className="h-px bg-white/[0.05] my-3 mx-2" />

                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all text-[15px] font-medium"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-500/8 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    Sair da conta
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {activeView === 'perfil' && (
        <ProfileModal user={{ name: userName, email: userEmail, phone: userPhone, cpf: userCpf, plan: userPlan }} onClose={() => setActiveView(null)} plansEnabled={plansEnabled} />
      )}
      {activeView === 'reservas' && (
        <MyBookings onClose={() => setActiveView(null)} />
      )}
      {activeView === 'favoritos' && (
        <PlaceholderModal title="Favoritos" description="Seus hoteis favoritos aparecerão aqui. Marque os que mais gostou para encontra-los facilmente." icon={Heart} onClose={() => setActiveView(null)} />
      )}
      {activeView === 'ajuda' && (
        <HelpModal onClose={() => setActiveView(null)} />
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

function DropdownItem({ icon: Icon, label, subtitle, onClick, external }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-200 group"
    >
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center transition-colors shrink-0 border border-white/[0.03]">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[13px] font-medium leading-tight">{label}</p>
        {subtitle && <p className="text-[11px] text-white/25 group-hover:text-white/35 mt-0.5 transition-colors">{subtitle}</p>}
      </div>
      {external ? (
        <ExternalLink className="w-3.5 h-3.5 text-white/10 group-hover:text-white/25 transition-colors" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 text-white/10 group-hover:text-white/25 transition-colors" />
      )}
    </button>
  );
}

function ProfileModal({ user, onClose, plansEnabled }) {
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = new Date().getFullYear();

  const fields = [
    { icon: User, label: 'Nome completo', value: user.name },
    { icon: Mail, label: 'E-mail', value: user.email },
    { icon: Phone, label: 'Telefone', value: user.phone },
    { icon: Shield, label: 'CPF', value: user.cpf ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ animation: 'backdropIn 0.2s ease-out' }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-[#0b1c3f] via-[#132d5a] to-[#0b1c3f] px-6 pt-8 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-300/[0.08] rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-sky-300/[0.05] rounded-full blur-[60px]" />
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="relative">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-300 via-blue-400 to-indigo-500 flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-2xl shadow-blue-500/25 ring-4 ring-white/15">
                {initials}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-400 rounded-full border-3 border-[#0b1c3f] flex items-center justify-center shadow-lg shadow-emerald-400/30" style={{ borderWidth: 3 }}>
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <h2 className="text-white font-bold text-lg mt-4">{user.name}</h2>
            {plansEnabled && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400/12 to-yellow-400/8 border border-amber-400/15">
              <Crown className="w-3 h-3 text-amber-400" />
              <span className="text-amber-300/90 text-xs font-bold tracking-wide">{user.plan || 'Membro Unyco'}</span>
            </div>
            )}
            <p className="text-white/20 text-[11px] mt-3">Membro desde {memberSince}</p>
          </div>
        </div>

        <div className="p-6 space-y-2.5">
          {fields.filter(f => f.value).map((field) => (
            <div key={field.label} className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shrink-0 border border-blue-100/50 group-hover:shadow-sm transition-shadow">
                <field.icon className="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{field.label}</p>
                <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{field.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 rounded-xl text-sm font-semibold text-slate-600 transition-colors border border-slate-200/50">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ onClose }) {
  const helpItems = [
    { icon: MessageCircle, label: 'WhatsApp', description: 'Fale conosco pelo WhatsApp', action: () => window.open('https://wa.me/5551991777183', '_blank'), external: true },
    { icon: Mail, label: 'E-mail', description: 'suporte@unyco.com.br', action: () => window.open('mailto:suporte@unyco.com.br'), external: true },
    { icon: Phone, label: 'Telefone', description: '(51) 99177-7183', action: () => window.open('tel:+5551991777183'), external: true },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ animation: 'backdropIn 0.2s ease-out' }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-[#0b1c3f] via-[#132d5a] to-[#0b1c3f] px-6 pt-6 pb-8 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-300/10 to-transparent rounded-bl-full" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto border border-white/10">
            <HelpCircle className="w-7 h-7 text-white/80" />
          </div>
          <h3 className="text-white font-bold text-lg mt-3">Central de Ajuda</h3>
          <p className="text-white/50 text-sm mt-1">Estamos aqui para ajudar</p>
        </div>

        <div className="p-5 space-y-2">
          {helpItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shrink-0 border border-blue-100/50 group-hover:shadow-sm transition-shadow">
                <item.icon className="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
              </div>
              {item.external && <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderModal({ title, description, icon: Icon, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ animation: 'backdropIn 0.2s ease-out' }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-[#0b1c3f] via-[#132d5a] to-[#0b1c3f] px-6 pt-6 pb-8 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-300/10 to-transparent rounded-bl-full" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto border border-white/10">
            <Icon className="w-7 h-7 text-white/80" />
          </div>
          <h3 className="text-white font-bold text-lg mt-3">{title}</h3>
          <p className="text-white/50 text-sm mt-1">{description}</p>
        </div>
        <div className="p-5 text-center">
          <div className="py-6">
            <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Em breve disponivel</p>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
