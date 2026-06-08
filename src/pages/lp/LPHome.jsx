import { useState, useEffect, useRef } from 'react';
import { Loader2, TrendingUp, Search as SearchIcon, Star, Building2, ChevronLeft, ChevronRight, Check, MapPin } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';

import LPHeader from './components/LPHeader';
import FAQSection from './components/FAQSection';
import AuthModal from './components/AuthModal';
import SearchForm from './components/SearchForm';
import HotelCard from './components/HotelCard';
import HotelDetailModal from './components/HotelDetailModal';
import BookingFlow from './components/BookingFlow';
import LPFooter from './components/LPFooter';
import WhatsAppFloat from './components/WhatsAppFloat';



export default function LPHome() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plansEnabled, setPlansEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [searchParams, setSearchParams] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [authModal, setAuthModal] = useState(null);
  const [presetDestino, setPresetDestino] = useState(null);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [marketPrices, setMarketPrices] = useState([]);
  const [marketPricesLoaded, setMarketPricesLoaded] = useState(false);
  const [selectedMarketCity, setSelectedMarketCity] = useState(0);
  const [searchMarketPrice, setSearchMarketPrice] = useState(null);
  const [searchMarketLoading, setSearchMarketLoading] = useState(false);
  const [heroMuted, setHeroMuted] = useState(true);
  const [heroVolume, setHeroVolume] = useState(0.7);
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroEnded, setHeroEnded] = useState(false);
  const [heroBlocked, setHeroBlocked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const heroVideoRef = useRef(null);
  const volumeTimeoutRef = useRef(null);
  const [clickedHotelKey, setClickedHotelKey] = useState(null);
  const carouselRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastDragXRef = useRef(0);
  const dragMovedRef = useRef(false);
  const initializedRef = useRef(false);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    const v = heroVideoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', 'true');
    v.setAttribute('x5-playsinline', 'true');
    v.setAttribute('x5-video-player-type', 'h5');
  }, []);

  useEffect(() => {
    let raf = 0;
    let lastTs = 0;
    const SPEED = 0.6;
    const tick = (ts) => {
      raf = requestAnimationFrame(tick);
      const el = carouselRef.current;
      if (!el) { lastTs = 0; return; }
      try {
        const dt = lastTs ? Math.min(ts - lastTs, 100) : 16;
        lastTs = ts;
        const copyWidth = el.scrollWidth / 3;
        if (copyWidth <= 0) return;
        if (!initializedRef.current) {
          el.scrollLeft = copyWidth;
          initializedRef.current = true;
        }
        if (!isDraggingRef.current && !isPausedRef.current) {
          el.scrollLeft += SPEED * (dt / 16);
        }
        if (el.scrollLeft >= copyWidth * 2) el.scrollLeft -= copyWidth;
        else if (el.scrollLeft < copyWidth * 0.5) el.scrollLeft += copyWidth;
      } catch {}
    };
    raf = requestAnimationFrame(tick);
    const onVis = () => { lastTs = 0; };
    document.addEventListener('visibilitychange', onVis);
    const onUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        const el = carouselRef.current;
        if (el) el.style.cursor = 'grab';
      }
    };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/lp/session', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({})),
      fetch('/api/config/public').then(r => r.json()).catch(() => ({})),
    ]).then(([sessionData, configData]) => {
      if (sessionData?.success && sessionData.user) {
        setUser(sessionData.user);
        setSubscription(sessionData.subscription || null);
      }
      if (configData?.config?.plans_enabled === false) setPlansEnabled(false);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const LS_KEY = 'unyco_featured_hotels';
    const LS_TTL = 24 * 60 * 60 * 1000;
    const getCached = () => { try { const s = localStorage.getItem(LS_KEY); if (!s) return null; const p = JSON.parse(s); if (Date.now() - p.ts < LS_TTL) return p.data; } catch {} return null; };
    const saveCache = (data) => { try { localStorage.setItem(LS_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {} };
    const cached = getCached();
    if (cached && cached.length > 0) {
      setFeaturedHotels(cached);
      setFeaturedLoading(false);
      fetch('/api/lp/featured-hotels').then(r => r.json()).then(d => {
        if (d.ok && d.data?.length > 0 && JSON.stringify(d.data) !== JSON.stringify(cached)) {
          setFeaturedHotels(d.data);
          saveCache(d.data);
        }
      }).catch(() => {});
    } else {
      fetch('/api/lp/featured-hotels')
        .then(r => r.json())
        .then(d => { const data = d.ok ? (d.data || []) : []; setFeaturedHotels(data); if (data.length > 0) saveCache(data); })
        .catch(() => setFeaturedHotels([]))
        .finally(() => setFeaturedLoading(false));
    }
  }, []);

  useEffect(() => {
    fetch('/api/lp/market-prices')
      .then(r => r.json())
      .then(d => { if (d.ok && d.data?.length) setMarketPrices(d.data.filter(h => !h.hidden)); })
      .catch(() => {})
      .finally(() => setMarketPricesLoaded(true));
  }, []);


  const handleSearch = (results, params, error) => {
    setHotels(results || []);
    setSearchParams(params);
    setHasSearched(true);
    setSearchError(error || '');
    setCurrentPage(1);
    setSearchMarketPrice(null);
    if (params?.cidade && params?.checkIn && params?.checkOut) {
      setSearchMarketLoading(true);
      const ci = params.checkIn instanceof Date ? params.checkIn.toISOString().slice(0, 10) : params.checkIn;
      const co = params.checkOut instanceof Date ? params.checkOut.toISOString().slice(0, 10) : params.checkOut;
      const q = encodeURIComponent(`${params.cidade}, Brasil`);
      fetch(`/api/lp/serp-prices?q=${q}&check_in_date=${ci}&check_out_date=${co}&adults=${params.adults || 2}`)
        .then(r => r.json())
        .then(d => { if (d.ok && (d.data?.median || d.data?.max)) setSearchMarketPrice({ ...d.data, median: d.data.median || d.data.max }); })
        .catch(() => {})
        .finally(() => setSearchMarketLoading(false));
    }
  };

  const handleViewDetails = (hotel) => {
    setSelectedHotel(hotel);
    setModalOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    setSubscription(null);
  };

  const startBooking = (hotel) => {
    setModalOpen(false);
    setBookingHotel(hotel);
    setBookingOpen(true);
  };

  const handleAuthSuccess = async (userData, subscriptionData) => {
    setUser(userData);
    setSubscription(subscriptionData);
    if (pendingBooking) {
      const hotel = pendingBooking;
      setPendingBooking(null);
      if (plansEnabled && (!subscriptionData || subscriptionData.status !== 'ativa')) {
        window.location.href = '/lp/checkout.html';
        return;
      }
      startBooking(hotel);
    }
  };

  const handleBooking = (hotel) => {
    if (!user) {
      setPendingBooking(hotel);
      setAuthModal('login');
      return;
    }
    if (plansEnabled && (!subscription || subscription.status !== 'ativa')) {
      window.location.href = '/lp/checkout.html';
      return;
    }
    startBooking(hotel);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const dailyCount = searchParams?.checkIn && searchParams?.checkOut
    ? Math.max(1, differenceInCalendarDays(searchParams.checkOut, searchParams.checkIn))
    : null;

  const totalPages = Math.ceil(hotels.length / ITEMS_PER_PAGE);
  const paginatedHotels = hotels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <LPHeader
        user={user}
        onLogout={handleLogout}
        onUserUpdate={setUser}
        onOpenAuth={(tab) => setAuthModal(tab)}
      />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/lp/assets/img/hero_bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1c3f]/45 via-[#0b1c3f]/25 to-[#0b1c3f]/55" />

        <div className="relative">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-28 md:pb-36">
            <div className="grid grid-cols-2 gap-4 md:gap-8 items-center">
              <div className="text-left">
                <h1 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.15] tracking-tight">
                  Tarifa fixa,
                  <br />
                  experiências
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                    ilimitadas
                  </span>
                </h1>
                <p className="mt-3 md:mt-5 text-white/70 text-xs sm:text-sm md:text-base max-w-md">
                  Encontre as melhores hospedagens com tarifas exclusivas em todo o Brasil.
                </p>
              </div>
              <div className="flex justify-end items-center">
                <div className="relative aspect-[9/16] max-h-[220px] sm:max-h-[320px] md:max-h-[480px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 bg-black">
                  <video
                    ref={heroVideoRef}
                    src="/hero-video.mp4"
                    autoPlay
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover cursor-pointer bg-black"
                    onClick={() => {
                      const v = heroVideoRef.current;
                      if (!v) return;
                      if (heroBlocked) {
                        v.muted = false;
                        v.volume = heroVolume;
                        v.play()
                          .then(() => { setHeroBlocked(false); setHeroMuted(false); setHeroPaused(false); setHeroEnded(false); })
                          .catch(() => {
                            v.muted = true;
                            v.play().then(() => { setHeroBlocked(false); setHeroMuted(true); setHeroPaused(false); setHeroEnded(false); }).catch(() => {});
                          });
                        return;
                      }
                      if (v.muted || heroMuted) {
                        v.muted = false;
                        v.volume = heroVolume;
                        setHeroMuted(false);
                        if (v.paused) { v.play(); setHeroPaused(false); setHeroEnded(false); }
                        return;
                      }
                      if (v.paused) { v.play(); setHeroPaused(false); setHeroEnded(false); }
                      else { v.pause(); setHeroPaused(true); }
                    }}
                    onLoadedMetadata={() => {
                      const v = heroVideoRef.current;
                      if (!v) return;
                      v.muted = true;
                      const p = v.play();
                      if (p && typeof p.then === 'function') {
                        p.then(() => setHeroBlocked(false)).catch(() => setHeroBlocked(true));
                      }
                    }}
                    onCanPlay={() => {
                      const v = heroVideoRef.current;
                      if (!v || !v.paused) return;
                      v.play().then(() => {
                        setHeroBlocked(false);
                      }).catch(() => {
                        setHeroBlocked(true);
                      });
                    }}
                    onEnded={() => { setHeroEnded(true); setHeroPaused(false); }}
                  />
                  {heroPaused && !heroBlocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/40 rounded-full p-5 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Play overlay — autoplay blocked */}
                  {heroBlocked && !heroEnded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <button
                        onClick={() => {
                          const v = heroVideoRef.current;
                          if (!v) return;
                          v.muted = false;
                          v.volume = heroVolume;
                          v.play()
                            .then(() => { setHeroBlocked(false); setHeroMuted(false); setHeroPaused(false); setHeroEnded(false); })
                            .catch(() => {
                              v.muted = true;
                              v.play().then(() => { setHeroBlocked(false); setHeroMuted(true); setHeroPaused(false); setHeroEnded(false); }).catch(() => {});
                            });
                        }}
                        className="flex flex-col items-center gap-2 text-white hover:scale-110 transition-transform"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span className="text-sm font-semibold drop-shadow">Assistir</span>
                      </button>
                    </div>
                  )}

                  {/* Tap to unmute hint */}
                  {heroMuted && !heroBlocked && !heroEnded && (
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <div className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        </svg>
                        Toque para ativar som
                      </div>
                    </div>
                  )}

                  {/* Replay overlay */}
                  {heroEnded && !heroBlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <button
                        onClick={() => {
                          if (heroVideoRef.current) {
                            heroVideoRef.current.currentTime = 0;
                            heroVideoRef.current.play();
                            setHeroEnded(false);
                          }
                        }}
                        className="flex flex-col items-center gap-2 text-white hover:scale-110 transition-transform"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                        </svg>
                        <span className="text-sm font-semibold">Ver novamente</span>
                      </button>
                    </div>
                  )}

                  {/* Volume control */}
                  <div
                    className="absolute bottom-3 right-3 flex items-center gap-2"
                    onMouseEnter={() => {
                      clearTimeout(volumeTimeoutRef.current);
                      setShowVolumeSlider(true);
                    }}
                    onMouseLeave={() => {
                      volumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 800);
                    }}
                  >
                    {showVolumeSlider && (
                      <div className="flex items-center bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={heroMuted ? 0 : heroVolume}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setHeroVolume(v > 0 ? v : 0.05);
                            const muted = v === 0;
                            setHeroMuted(muted);
                            if (heroVideoRef.current) {
                              heroVideoRef.current.volume = v;
                              heroVideoRef.current.muted = muted;
                            }
                          }}
                          className="w-20 h-1 accent-white cursor-pointer"
                          style={{ accentColor: 'white' }}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const newMuted = !heroMuted;
                        setHeroMuted(newMuted);
                        if (heroVideoRef.current) {
                          heroVideoRef.current.muted = newMuted;
                          if (!newMuted) heroVideoRef.current.volume = heroVolume;
                        }
                      }}
                      className="bg-black/50 hover:bg-black/75 text-white rounded-full p-2 transition-all backdrop-blur-sm"
                      title={heroMuted ? 'Ativar som' : 'Silenciar'}
                    >
                      {heroMuted || heroVolume === 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l1.46 1.46L20.46 18l-16-16L3 3.27zM12 4L9.91 6.09 12 8.18V4z"/>
                        </svg>
                      ) : heroVolume < 0.5 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4-.91 7-4.49 7-8.77s-3-7.86-7-8.77z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="buscar-hospedagens" className="relative z-10 -mt-14 mb-8 scroll-mt-24">
        <SearchForm onSearch={handleSearch} initialDestino={presetDestino} />
      </div>

      {hasSearched && (
        <section data-section="ofertas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-800">Melhores Oportunidades</h2>
              </div>
              {searchParams && (
                <p className="text-sm text-gray-500">
                  {searchParams.cidade}{searchParams.uf ? ` - ${searchParams.uf}` : ''}
                  {searchParams.checkIn && searchParams.checkOut && (
                    <span className="text-gray-400"> &middot; {format(searchParams.checkIn, 'dd/MM')} a {format(searchParams.checkOut, 'dd/MM/yyyy')}</span>
                  )}
                  <span className="text-gray-400"> &middot; {searchParams.adults} hóspede{searchParams.adults > 1 ? 's' : ''}, {searchParams.rooms} quarto{searchParams.rooms > 1 ? 's' : ''}</span>
                </p>
              )}
            </div>
            {hotels.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-600 text-sm font-medium px-4 py-2 rounded-full">
                <span>
                  {hotels.length} {hotels.length > 1 ? 'hotéis encontrados' : 'hotel encontrado'}
                </span>
                {dailyCount && <span className="text-blue-400">&middot; {dailyCount} diária{dailyCount > 1 ? 's' : ''}</span>}
              </div>
            )}
          </div>


          {(() => {
            if (searchMarketLoading) {
              return (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    Buscando preços de mercado para essa região...
                  </div>
                </div>
              );
            }
            const marketMedian = searchMarketPrice?.median;
            if (!marketMedian || hotels.length === 0) return null;
            const savingsPct = Math.max(0, ...hotels.map(h => {
              const p = h.price || 0;
              return p > 0 && p < marketMedian ? Math.round(((marketMedian - p) / marketMedian) * 100) : 0;
            }));
            if (savingsPct <= 0) return null;
            return (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-xl whitespace-nowrap">
                  Até {savingsPct}% abaixo do mercado
                </div>
                <p className="w-full text-[11px] text-gray-400">*Estimativa baseada em anúncios do Google Hotels para a região e datas selecionadas.</p>
              </div>
            );
          })()}

          {searchError ? (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl p-6 text-center">
              <p className="font-medium">Erro ao buscar hospedagens</p>
              <p className="text-sm mt-1 text-amber-600">Verifique sua conexão e tente novamente.</p>
            </div>
          ) : hotels.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-7 h-7 text-blue-400" />
              </div>
              <p className="font-semibold text-gray-700 text-lg">Nenhuma hospedagem encontrada</p>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                Não encontramos resultados para o período e destino selecionados. Tente ajustar as datas ou escolher outro destino.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginatedHotels.map((hotel, i) => (
                  <HotelCard key={hotel.id || i} hotel={hotel} onViewDetails={handleViewDetails} onBooking={handleBooking} searchParams={searchParams} marketPricePerNight={searchMarketPrice?.median} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-10">
                  <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl px-2 py-2 shadow-sm">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .reduce((acc, page, idx, arr) => {
                        if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...');
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '...' ? (
                          <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-300 text-sm select-none">...</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => handlePageChange(item)}
                            className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                              item === currentPage
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="ml-4 text-sm text-gray-400 font-medium">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, hotels.length)} de {hotels.length}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section data-section="destaques" className="w-full bg-white py-20">
          <style>{`
            .carousel-hide-scrollbar::-webkit-scrollbar{display:none}
            @keyframes carousel-click-pulse {
              0% { transform: scale(1) translateY(0); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
              40% { transform: scale(1.3) translateY(-12px); box-shadow: 0 0 0 16px rgba(59, 130, 246, 0.35), 0 30px 50px -10px rgba(59, 130, 246, 0.6); }
              100% { transform: scale(1.25) translateY(-10px); box-shadow: 0 25px 50px -10px rgba(59, 130, 246, 0.6), 0 0 0 6px rgba(59, 130, 246, 0.5); }
            }
            .carousel-card-clicked {
              animation: carousel-click-pulse 450ms ease-out forwards;
              z-index: 30; position: relative;
              margin-left: 40px; margin-right: 40px;
            }
            .carousel-hide-scrollbar > button { transition: margin 400ms ease-out, transform 300ms ease-out; }
          `}</style>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="text-center">
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Hotéis em Destaque</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Destaques <span className="text-blue-600">Unyco</span>
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">Hotéis parceiros disponíveis para os nossos associados com tarifas exclusivas.</p>
              {(() => {
                const mpList = marketPrices.length > 0 ? marketPrices : [];
                if (mpList.length === 0) return null;
                const savingsList = mpList.map(mp => {
                  const u = mp.unycoPrice || 0;
                  const m = mp.marketPrice || 0;
                  return u > 0 && m > 0 && u < m ? Math.round(((m - u) / m) * 100) : 0;
                }).filter(s => s > 0);
                if (savingsList.length === 0) return null;
                const avgSavings = Math.round(savingsList.reduce((a, b) => a + b, 0) / savingsList.length);
                return (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold px-4 py-2 rounded-full border border-emerald-200">
                      <TrendingUp className="w-4 h-4" />
                      Economize em média {avgSavings}% com Unyco
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {featuredLoading ? (
            <div className="flex gap-4 px-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-52 rounded-2xl aspect-[3/4] bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : featuredHotels.length === 0 ? (
            <div className="text-center py-12 text-gray-400 px-8">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum hotel disponível no momento.</p>
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="carousel-hide-scrollbar flex gap-4 overflow-x-scroll select-none px-8 py-16"
              style={{ scrollbarWidth: 'none', cursor: 'grab' }}
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                isDraggingRef.current = true;
                dragMovedRef.current = false;
                lastDragXRef.current = e.pageX;
                if (carouselRef.current) carouselRef.current.style.cursor = 'grabbing';
              }}
              onPointerMove={(e) => {
                if (!isDraggingRef.current || !carouselRef.current) return;
                const dx = e.pageX - lastDragXRef.current;
                if (Math.abs(dx) > 3) dragMovedRef.current = true;
                lastDragXRef.current = e.pageX;
                carouselRef.current.scrollLeft -= dx;
              }}
            >
              {(() => {
                const visibleHotels = marketPrices.length > 0
                  ? featuredHotels.filter(h => marketPrices.some(m => m.city === h.city))
                  : featuredHotels;
                return [...visibleHotels, ...visibleHotels, ...visibleHotels];
              })().map((hotel, idx) => {
                const cardKey = `${hotel.id}-${idx}`;
                return (
                <button
                  key={cardKey}
                  onClick={(e) => {
                    if (dragMovedRef.current) { e.preventDefault(); dragMovedRef.current = false; return; }
                    isPausedRef.current = true;
                    setClickedHotelKey(cardKey);
                    setTimeout(() => {
                      if (hotel.city) {
                        setPresetDestino({ cidade: hotel.city, uf: hotel.state, _key: Date.now() });
                      }
                      const target = document.getElementById('buscar-hospedagens');
                      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      else window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 250);
                    setTimeout(() => { setClickedHotelKey(null); isPausedRef.current = false; }, 5000);
                  }}
                  className={`group relative flex-shrink-0 w-64 rounded-2xl overflow-hidden aspect-[3/4] flex flex-col justify-end text-left shadow-md hover:shadow-xl transition-transform duration-300 pointer-events-auto cursor-pointer ${clickedHotelKey === cardKey ? 'carousel-card-clicked' : 'hover:scale-[1.02]'}`}
                >
                  {hotel.image ? (
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      draggable={false}
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-400" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/80 transition-all duration-300" />
                  <div className="relative z-10 p-4">
                    {(() => {
                      const mp = marketPrices.find(m => m.city === hotel.city);
                      const unycoPrice = mp?.unycoPrice || hotel.low_season_rate || hotel.high_season_rate || 0;
                      const marketPrice = mp?.marketPrice || null;
                      if (!unycoPrice) return null;
                      const savings = marketPrice && unycoPrice < marketPrice
                        ? Math.round(((marketPrice - unycoPrice) / marketPrice) * 100) : 0;
                      const checkInBR = mp?.checkInBR || null;
                      const checkOutBR = mp?.checkOutBR || null;
                      return (
                        <div className="mb-2 space-y-1">
                          <div className="flex items-baseline gap-1 flex-wrap">
                            <span className="text-white font-black text-lg drop-shadow leading-none">R${unycoPrice}</span>
                            <span className="text-white/65 text-xs font-normal">/noite</span>
                          </div>
                          {marketPrice && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-white/50 text-[11px] line-through leading-none">R${marketPrice}/noite</span>
                            </div>
                          )}
                          {savings > 0 && (
                            <div className="mt-0.5">
                              <span className="bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-tight">
                                Economize {savings}% neste hotel
                              </span>
                            </div>
                          )}
                          {checkInBR && checkOutBR && (
                            <div className="mt-1">
                              <span className="text-white/45 text-[10px] leading-none">{checkInBR} → {checkOutBR}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {hotel.cityState && (
                      <p className="text-white/75 text-xs font-medium mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />{hotel.cityState}
                      </p>
                    )}
                    <p className="text-white font-black text-sm leading-tight drop-shadow line-clamp-2">{hotel.name}</p>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </section>


      {!hasSearched && (
        <section data-section="categorias" className="w-full bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


            {/* Price Comparison Tool */}
            {(!marketPricesLoaded || marketPrices.length > 0) && (
            <div className="bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 rounded-3xl p-8 sm:p-12">
              <div className="text-center mb-10">
                <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                  Comparativo de Preços
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Veja o quanto você economiza
                </h3>
                <p className="text-gray-400 max-w-xl mx-auto text-sm">
                  Compare as tarifas exclusivas Unyco com os principais sites de hospedagem do mercado.
                </p>
              </div>

              {/* City selector */}
              {marketPrices.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {marketPrices.map((h, i) => {
                    const u = h.unycoPrice || 0;
                    const m = h.marketPrice || 0;
                    const citySavings = u > 0 && m > 0 && u < m
                      ? Math.round(((m - u) / m) * 100) : 0;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedMarketCity(i)}
                        className={`flex flex-col items-center px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                          selectedMarketCity === i
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        <span>{h.city.toLowerCase().replace(/(?:^|[\s-])(\w)/g, c => c.toUpperCase())}</span>
                        {citySavings > 0 && (
                          <span className={`text-[10px] font-bold mt-0.5 ${selectedMarketCity === i ? 'text-emerald-200' : 'text-emerald-400'}`}>
                            economize {citySavings}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Comparison bars */}
              {(() => {
                const hotel = marketPrices[selectedMarketCity] || marketPrices[0];
                if (!hotel) return (
                  <div className="max-w-2xl mx-auto text-center text-gray-400 py-8">
                    Carregando comparativo de preços…
                  </div>
                );

                const unycoPrice = hotel.unycoPrice || 0;
                const marketPrice = hotel.marketPrice || null;
                const cityLabel = hotel.city.toLowerCase().replace(/(?:^|[\s-])(\w)/g, c => c.toUpperCase());
                const sourcePrices = hotel.sourcePrices || [];
                const topSource = sourcePrices[0] || (marketPrice ? { source: 'Google Hotels', price: marketPrice } : null);
                const savings = unycoPrice > 0 && marketPrice && unycoPrice < marketPrice
                  ? Math.round(((marketPrice - unycoPrice) / marketPrice) * 100) : 0;
                const SOURCE_COLORS = ['#3b82f6', '#f59e0b', '#a855f7', '#ef4444'];
                const rows = [
                  ...(unycoPrice > 0 ? [{ label: 'Unyco (você paga)', value: unycoPrice, color: '#10b981', isUnyco: true }] : []),
                  ...sourcePrices.map((sp, i) => ({ label: sp.source, value: sp.price, color: SOURCE_COLORS[i % SOURCE_COLORS.length], isUnyco: false })),
                  ...(sourcePrices.length === 0 && marketPrice ? [{ label: 'Google Hotels', value: marketPrice, color: '#3b82f6', isUnyco: false }] : []),
                ];
                const maxVal = rows.length ? Math.max(...rows.map(r => r.value)) : 1;

                return (
                  <div className="max-w-2xl mx-auto">
                    {/* Economia box — entre seletor de cidades e detalhes do hotel */}
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center mb-8">
                      {savings > 0 && topSource ? (
                        <>
                          <p className="text-emerald-300 text-sm mb-1">Sua economia por noite em {cityLabel}</p>
                          <p className="text-white text-3xl font-black">
                            R${marketPrice - unycoPrice}{' '}
                            <span className="text-emerald-400 text-lg font-bold">({savings}% menos)</span>
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-300 text-sm">Comparativo de preços para {cityLabel}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-3">
                        {topSource
                          ? `*Preços de referência via ${rows.filter(r => !r.isUnyco).map(r => r.label).join(', ')}. Podem variar por data e disponibilidade.`
                          : '*Aguardando dados de preços para este destino.'}
                      </p>
                    </div>

                    {hotel.name && (
                      <p className="text-center text-gray-400 text-sm mb-2">
                        <span className="text-gray-200 font-medium">{hotel.name}</span>
                        {hotel.marketCount > 0 && (
                          <span className="ml-2">· {hotel.marketCount} anúncios consultados</span>
                        )}
                      </p>
                    )}
                    {hotel.checkInBR && hotel.checkOutBR && (
                      <p className="text-center text-blue-300/70 text-xs mb-6">
                        Período consultado: {hotel.checkInBR} até {hotel.checkOutBR}
                      </p>
                    )}

                    <div className="space-y-4">
                      {rows.map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                              <span className={`text-sm font-semibold ${item.isUnyco ? 'text-white' : 'text-gray-300'}`}>{item.label}</span>
                              {item.isUnyco && savings > 0 && (
                                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full">
                                  -{savings}%
                                </span>
                              )}
                            </div>
                            <span className={`font-black text-base whitespace-nowrap ml-2 ${item.isUnyco ? 'text-emerald-400' : 'text-gray-300 line-through'}`}>
                              R${item.value}/noite
                            </span>
                          </div>
                          <div className="h-10 bg-white/5 rounded-xl overflow-hidden">
                            <div
                              className={`h-full rounded-xl flex items-center justify-end pr-3 transition-all duration-700 ${item.isUnyco ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : ''}`}
                              style={{
                                width: `${Math.max(8, Math.round((item.value / maxVal) * 100))}%`,
                                background: item.isUnyco ? undefined : item.color + '33',
                                border: item.isUnyco ? undefined : `1px solid ${item.color}55`,
                              }}
                            >
                              <span className={`text-xs font-bold ${item.isUnyco ? 'text-white' : 'text-white/60'}`}>R${item.value}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            )}
          </div>
        </section>
      )}

      <FAQSection />

      <div className="flex-1" />

      <LPFooter />

      <HotelDetailModal
        hotel={selectedHotel}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        searchParams={searchParams}
        onBooking={handleBooking}
      />

      <BookingFlow
        hotel={bookingHotel}
        searchParams={searchParams}
        user={user}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onUserUpdate={setUser}
      />

      <WhatsAppFloat />

      {authModal && (
        <AuthModal
          initialTab={authModal}
          onClose={() => { setAuthModal(null); setPendingBooking(null); }}
          onSuccess={(userData, subscriptionData) => {
            handleAuthSuccess(userData, subscriptionData);
            setAuthModal(null);
          }}
        />
      )}
    </div>
  );
}
