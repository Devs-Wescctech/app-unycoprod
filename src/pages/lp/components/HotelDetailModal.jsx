import { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Wallet, Calendar, Navigation, Star, BadgeCheck, Clock, Users, BedDouble, Map, ExternalLink, TrendingDown, TrendingUp, Minus, Phone, Mail, Globe, Gift, ShieldCheck, Loader2, Wifi, Car, Coffee, PawPrint, Accessibility, Ban, Lock, DoorOpen, Zap, ArrowUpDown, Info } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const FALLBACK_IMG = '/lp/assets/img/gtr.jpg';

function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function prettifyAddress(street) {
  if (!street) return '';
  return street.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<BR\s*\/?>/gi, '\n')
    .replace(/<strong>/gi, '').replace(/<\/strong>/gi, '')
    .replace(/<b>/gi, '').replace(/<\/b>/gi, '')
    .replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseInfoSections(infoA) {
  if (!infoA) return [];
  const cleaned = stripHtml(infoA);
  const parts = cleaned.split('\n').filter(line => line.trim().length > 5);
  return parts.map(p => p.trim());
}

const AMENITY_ICONS = {
  'internet': Wifi,
  'wi-fi': Wifi,
  'wifi': Wifi,
  'estacionamento': Car,
  'pet': PawPrint,
  'p.n.e': Accessibility,
  'pne': Accessibility,
  'fumante': Ban,
  'cofre': Lock,
  'recepção': DoorOpen,
  'recep': DoorOpen,
  'voltagem': Zap,
  'elevador': ArrowUpDown,
  'lavanderia': Coffee,
};

function getAmenityIcon(amenity) {
  const lower = amenity.toLowerCase();
  for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return ShieldCheck;
}

export default function HotelDetailModal({ hotel, open, onClose, searchParams, onBooking }) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!open || !hotel?.id) {
      setDetails(null);
      setCurrentPhoto(0);
      return;
    }
    setLoadingDetails(true);
    setCurrentPhoto(0);
    fetch(`/api/lp/hotel-info?hotel_id=${hotel.id}`, { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.data) setDetails(data.data);
      })
      .catch(e => console.error('Hotel info error:', e))
      .finally(() => setLoadingDetails(false));
  }, [open, hotel?.id]);

  if (!hotel) return null;

  const detailPhotos = details?.photos?.length ? [hotel.image, ...details.photos] : [];
  const fallbackPhotos = hotel.image ? [hotel.image] : [FALLBACK_IMG];
  const photos = detailPhotos.length > 0 ? [...new Set(detailPhotos)].filter(Boolean) : fallbackPhotos;
  const safeIndex = Math.min(currentPhoto, Math.max(0, photos.length - 1));
  const currentSrc = photos[safeIndex] || FALLBACK_IMG;

  const dailyCount = searchParams?.checkIn && searchParams?.checkOut
    ? Math.max(1, differenceInCalendarDays(searchParams.checkOut, searchParams.checkIn))
    : hotel.dailyCount || 1;

  const periodStr = searchParams?.checkIn && searchParams?.checkOut
    ? `${format(searchParams.checkIn, 'dd/MM/yyyy')} a ${format(searchParams.checkOut, 'dd/MM/yyyy')}`
    : 'Consulte as datas';

  const dailyPrice = hotel.price || 0;
  const totalPrice = hotel.totalPrice || dailyPrice * dailyCount;

  const costs = hotel.cost || [];
  const dailyPrices = costs.map(c => c.daily || 0);
  const minDaily = dailyPrices.length > 0 ? Math.min(...dailyPrices) : dailyPrice;
  const maxDaily = dailyPrices.length > 0 ? Math.max(...dailyPrices) : dailyPrice;
  const totalExtras = costs.reduce((sum, c) => sum + (c.extras || 0), 0);
  const hasVariation = minDaily !== maxDaily;

  const hasCoordinates = hotel.coordinates?.latitude && hotel.coordinates?.longitude;
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${hotel.coordinates.latitude},${hotel.coordinates.longitude}`
    : null;

  const amenities = details?.amenities || [];
  const freeText = details?.free || '';
  const hotelPhone = details?.phone || '';
  const hotelEmail = details?.email || '';
  const hotelSite = details?.site_url || '';
  const hotelAddress = details?.address || hotel.street || '';
  const infoSections = parseInfoSections(details?.additional_info?.info_A);

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setCurrentPhoto(0);
      setDetails(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-0 shadow-2xl mx-2 sm:mx-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalhes do hotel</DialogTitle>
          <DialogDescription>Informações detalhadas sobre o hotel selecionado</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 overflow-hidden rounded-t-2xl">
            <img
              src={currentSrc}
              alt={hotel.name}
              onError={(e) => { e.target.src = FALLBACK_IMG; }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhoto(p => (p - 1 + photos.length) % photos.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setCurrentPhoto(p => (p + 1) % photos.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            <div className="absolute top-4 left-4 flex items-center gap-2">
              {hotel.isPreferential && (
                <span className="flex items-center gap-1.5 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3 fill-white" /> Preferencial
                </span>
              )}
              {hotel.byRequest && (
                <span className="flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" /> Sob consulta
                </span>
              )}
            </div>

            {photos.length > 1 && (
              <div className="absolute top-4 right-14 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                {safeIndex + 1} / {photos.length}
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6">
              <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-md">{hotel.name}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-white/80 text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {hotel.cityState || 'Localização não informada'}
                </p>
                {hotel.broker && (
                  <span className="text-white/60 text-xs flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> {hotel.broker}
                  </span>
                )}
              </div>
            </div>

            {photos.length > 1 && (
              <div className="absolute bottom-4 right-6 flex gap-1.5">
                {photos.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === safeIndex ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-1.5">
                <Wallet className="w-3 h-3" /> Diária
              </div>
              <p className="text-xl font-bold text-gray-800">R$ {formatCurrency(dailyPrice)}</p>
              {hasVariation && (
                <p className="text-[10px] text-blue-400 mt-0.5">de R$ {formatCurrency(minDaily)} a R$ {formatCurrency(maxDaily)}</p>
              )}
            </div>
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3" /> Período
              </div>
              <p className="text-sm font-semibold text-gray-700">{periodStr}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{dailyCount} noite{dailyCount > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-green-50/80 rounded-2xl p-4 border border-green-100/50">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1.5">
                <Wallet className="w-3 h-3" /> Total
              </div>
              <p className="text-xl font-bold text-gray-800">R$ {formatCurrency(totalPrice)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{dailyCount}x R$ {formatCurrency(dailyPrice)}</p>
            </div>
            <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-100/50">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-1.5">
                <Users className="w-3 h-3" /> Reserva
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {searchParams?.adults || 2} hóspede{(searchParams?.adults || 2) > 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{searchParams?.rooms || 1} quarto{(searchParams?.rooms || 1) > 1 ? 's' : ''}</p>
            </div>
          </div>

          {freeText && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Gift className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Cortesia</p>
                <p className="text-sm text-emerald-600 font-medium">{freeText}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-50/60 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <MapPin className="w-3.5 h-3.5" /> Localização e contato
              </div>
              <div className="space-y-2.5 text-sm text-gray-600">
                {hotelAddress && (
                  <p className="flex items-start gap-2.5">
                    <Navigation className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>{prettifyAddress(hotelAddress)}</span>
                  </p>
                )}
                {hotelPhone && (
                  <p className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${hotelPhone.replace(/\D/g, '')}`} className="hover:text-blue-600 transition-colors">{hotelPhone}</a>
                  </p>
                )}
                {hotelEmail && (
                  <p className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${hotelEmail}`} className="hover:text-blue-600 transition-colors truncate">{hotelEmail}</a>
                  </p>
                )}
                {hotelSite && (
                  <p className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a href={hotelSite.startsWith('http') ? hotelSite : `https://${hotelSite}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors truncate">{hotelSite}</a>
                  </p>
                )}
              </div>
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-blue-500 hover:text-blue-600 font-medium bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
                >
                  <Map className="w-4 h-4" />
                  Ver no Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {loadingDetails && !details && (
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando detalhes...
                </div>
              )}
            </div>

            <div className="bg-gray-50/60 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <BadgeCheck className="w-3.5 h-3.5" /> Informações
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Operadora</span>
                  <span className="text-sm font-medium text-gray-700 capitalize">{hotel.broker || 'N/A'}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Hotel preferencial</span>
                  <span className={`text-sm font-medium ${hotel.isPreferential ? 'text-blue-600' : 'text-gray-400'}`}>
                    {hotel.isPreferential ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Tipo de reserva</span>
                  <span className={`text-sm font-medium ${hotel.byRequest ? 'text-amber-600' : 'text-green-600'}`}>
                    {hotel.byRequest ? 'Sob consulta' : 'Imediata'}
                  </span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total de diárias</span>
                  <span className="text-sm font-medium text-gray-700">{hotel.dailyCount || dailyCount}</span>
                </div>
                {totalExtras > 0 && (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Taxas extras</span>
                      <span className="text-sm font-medium text-amber-600">R$ {formatCurrency(totalExtras)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {amenities.length > 0 && (
            <div className="bg-gray-50/60 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Comodidades
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {amenities.map((amenity, i) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <div key={i} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                      <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 leading-tight">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {costs.length > 0 && (
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 uppercase tracking-wider">
                  <Wallet className="w-3.5 h-3.5" /> Detalhamento por diária
                </div>
                {hasVariation && (
                  <div className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                    <TrendingDown className="w-3 h-3" /> R$ {formatCurrency(minDaily)}
                    <Minus className="w-2 h-2" />
                    <TrendingUp className="w-3 h-3" /> R$ {formatCurrency(maxDaily)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                {costs.map((c, i) => (
                  <div key={i} className={`rounded-xl p-2.5 text-center border ${
                    c.daily === minDaily && hasVariation
                      ? 'bg-green-50 border-green-200'
                      : c.daily === maxDaily && hasVariation
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-blue-100/30'
                  }`}>
                    <p className="text-[9px] text-gray-400 font-medium uppercase">Dia {i + 1}</p>
                    <p className="text-xs font-bold text-gray-700 mt-0.5">R$ {formatCurrency(c.daily)}</p>
                    {c.extras > 0 && (
                      <p className="text-[9px] text-amber-500 mt-0.5">+R$ {formatCurrency(c.extras)}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-100/50">
                <span className="text-xs text-gray-500">Total das diárias</span>
                <span className="text-sm font-bold text-gray-800">R$ {formatCurrency(totalPrice)}</span>
              </div>
            </div>
          )}

          {infoSections.length > 0 && (
            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">
                <Info className="w-3.5 h-3.5" /> Informações importantes
              </div>
              <div className="space-y-2">
                {infoSections.map((section, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                    <span>{section}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onBooking && onBooking({
              ...hotel,
              category_id: details?.category_id || null,
              category_name: details?.category_name || null,
              category_low_rate: details?.category_low_rate || null,
              category_high_rate: details?.category_high_rate || null,
              high_season_months: details?.high_season_months || [],
            })}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.01]"
          >
            <BedDouble className="w-5 h-5" /> Reservar este hotel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
