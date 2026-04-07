import { useState, useEffect } from 'react';
import { Loader2, Play, Sparkles, TrendingUp, Search as SearchIcon, Gem, Star, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import LPHeader from './components/LPHeader';
import SearchForm from './components/SearchForm';
import HotelCard from './components/HotelCard';
import HotelDetailModal from './components/HotelDetailModal';
import BookingFlow from './components/BookingFlow';
import LPFooter from './components/LPFooter';

export default function LPHome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [searchParams, setSearchParams] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    Promise.all([
      fetch('/api/lp/session', { credentials: 'same-origin' }).then(r => r.json()),
      fetch('/api/config/public').then(r => r.json()).catch(() => ({ ok: true, config: { plans_enabled: true } }))
    ]).then(([data, configData]) => {
      const plansOn = configData?.config?.plans_enabled !== false;
      if (!data.success) {
        window.location.href = '/lp/index.html';
        return;
      }
      if (plansOn && !data.subscription) {
        window.location.href = '/lp/checkout.html';
        return;
      }
      setUser(data.user);
    }).catch(() => {
      window.location.href = '/lp/index.html';
    }).finally(() => setLoading(false));
  }, []);

  const handleSearch = (results, params, error) => {
    setHotels(results || []);
    setSearchParams(params);
    setHasSearched(true);
    setSearchError(error || '');
    setCurrentPage(1);
  };

  const handleViewDetails = (hotel) => {
    setSelectedHotel(hotel);
    setModalOpen(true);
  };

  const handleBooking = (hotel) => {
    setModalOpen(false);
    setBookingHotel(hotel);
    setBookingOpen(true);
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
      <LPHeader user={user} />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/lp/assets/img/hero_bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1c3f]/45 via-[#0b1c3f]/25 to-[#0b1c3f]/55" />

        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-28 md:pb-36">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5" /> Exclusivo para membros
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                  Tarifa fixa,
                  <br />
                  experiências
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                    ilimitadas
                  </span>
                </h1>
                <p className="mt-5 text-white/70 text-base max-w-md">
                  Encontre as melhores hospedagens com tarifas exclusivas em todo o Brasil.
                </p>
                <button className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-full hover:bg-white/20 transition-all font-medium text-sm">
                  <Play className="w-4 h-4 fill-white" /> Assistir Vídeo
                </button>
              </div>
              <div className="hidden md:flex justify-center">
                <img
                  src="/lp/assets/img/hero_img.png"
                  alt="Viagem"
                  className="max-w-sm lg:max-w-md drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 -mt-14 mb-8">
        <SearchForm onSearch={handleSearch} />
      </div>

      {hasSearched && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
                <span>{hotels.length} {hotels.length > 1 ? 'hotéis encontrados' : 'hotel encontrado'}</span>
                {dailyCount && <span className="text-blue-400">&middot; {dailyCount} diária{dailyCount > 1 ? 's' : ''}</span>}
              </div>
            )}
          </div>

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
                  <HotelCard key={hotel.id || i} hotel={hotel} onViewDetails={handleViewDetails} onBooking={handleBooking} searchParams={searchParams} />
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

      {!hasSearched && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Quem é <span className="text-blue-600">membro Unyco</span>, viaja mais
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Acesso a tarifas exclusivas em hotéis parceiros nos melhores destinos do Brasil.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Tarifa Fixa', desc: 'Valores exclusivos que não mudam com a alta temporada.', icon: Gem, color: 'text-blue-500', bg: 'bg-blue-50' },
              { title: 'Sem Taxas Extras', desc: 'Preço transparente, sem surpresas na hora de reservar.', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
              { title: '+300 Hotéis', desc: 'Rede de hotéis parceiros em todo o Brasil.', icon: Building2, color: 'text-red-500', bg: 'bg-red-50' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300 text-center">
                  <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
      />
    </div>
  );
}
