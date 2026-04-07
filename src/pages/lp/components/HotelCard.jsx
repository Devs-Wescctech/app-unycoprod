import { useState } from 'react';
import { Heart, MapPin, Star, ArrowRight, Sparkles } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';

const FALLBACK_IMG = '/lp/assets/img/gtr.jpg';

export default function HotelCard({ hotel, onViewDetails, onBooking, searchParams }) {
  const [favorite, setFavorite] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imgSrc = !imgError && hotel.image ? hotel.image : FALLBACK_IMG;
  const priceFormatted = (hotel.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const dailyCount = searchParams?.checkIn && searchParams?.checkOut
    ? Math.max(1, differenceInCalendarDays(searchParams.checkOut, searchParams.checkIn))
    : null;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/8 transition-all duration-500 flex flex-col">
      <div
        className="relative overflow-hidden aspect-[16/10] cursor-pointer"
        onClick={() => onViewDetails && onViewDetails(hotel)}
      >
        <img
          src={imgSrc}
          alt={hotel.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/70 group-hover:via-black/20 transition-all duration-500" />

        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-blue-500/90 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
          <Star className="w-3 h-3 fill-white" /> Tarifa Unyco
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setFavorite(!favorite); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 hover:scale-110 transition-all"
        >
          <Heart className={`w-4 h-4 transition-colors ${favorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        {hotel.cityState && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/90 text-xs group-hover:bottom-14 transition-all duration-500">
            <MapPin className="w-3 h-3" /> {hotel.cityState}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
          <button
            onClick={(e) => { e.stopPropagation(); onBooking && onBooking(hotel); }}
            className="w-full rounded-xl bg-white/95 backdrop-blur-sm hover:bg-white text-gray-800 text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Reservar agora
            <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3
          onClick={() => onViewDetails && onViewDetails(hotel)}
          className="font-semibold text-gray-800 text-[15px] leading-snug line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors min-h-[2.5rem] cursor-pointer"
        >
          {hotel.name}
        </h3>

        <div className="mt-auto">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">
                {dailyCount ? `${String(dailyCount).padStart(2, '0')} diária${dailyCount > 1 ? 's' : ''}` : 'por diária'}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] text-gray-400">R$</span>
                <span className="text-2xl font-bold text-gray-800">{priceFormatted}</span>
              </div>
            </div>

            <button
              onClick={() => onViewDetails && onViewDetails(hotel)}
              className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300"
            >
              <ArrowRight className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
