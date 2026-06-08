import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Calendar, Users, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function parseDDMMYYYY(s) {
  const [d, m, y] = String(s).split('/').map(Number);
  return new Date(y, m - 1, d);
}

function formatBR(n) {
  return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function reasonBadge(reason, diff) {
  if (reason === 'other_room') {
    return { label: 'Mesmas datas, outro quarto', color: 'bg-green-100 text-green-700 border-green-300' };
  }
  if (reason === 'extend_nights') {
    return { label: `Estendendo +${diff} ${diff === 1 ? 'noite' : 'noites'}`, color: 'bg-blue-100 text-blue-700 border-blue-300' };
  }
  if (reason === 'shift_dates') {
    const sign = diff > 0 ? '+' : '';
    return { label: `Datas deslocadas (${sign}${diff} ${Math.abs(diff) === 1 ? 'dia' : 'dias'})`, color: 'bg-amber-100 text-amber-700 border-amber-300' };
  }
  return { label: 'Alternativa', color: 'bg-gray-100 text-gray-700 border-gray-300' };
}

function applyHotelRate(apt, hotel, checkInDate) {
  const lowRate = hotel?.category_low_rate;
  const highRate = hotel?.category_high_rate;
  const highMonths = hotel?.high_season_months || [];
  const hasRates = (lowRate && lowRate > 0) || (highRate && highRate > 0);
  if (!hasRates || !checkInDate) return apt;

  const checkInMonth = checkInDate.getMonth() + 1;
  const isHighSeason = highMonths.includes(checkInMonth);
  const appliedRate = isHighSeason ? (highRate || lowRate) : (lowRate || highRate);
  if (!appliedRate || appliedRate <= 0) return apt;

  const newCost = (apt.cost || []).map(c => ({ ...c, daily: appliedRate }));
  const newTotal = newCost.reduce((sum, c) => sum + (c.daily || 0) + (c.extras || 0), 0);
  return {
    ...apt,
    cost: newCost,
    total_price: newTotal,
    original_daily: apt.cost?.[0]?.daily || 0,
    category_name: hotel.category_name,
    season_label: isHighSeason ? 'Alta' : 'Baixa',
  };
}

export default function BookingAlternativesModal({
  open,
  onClose,
  hotel,
  searchParams,
  excludeBookingCode,
  onSelectAlternative,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alternatives, setAlternatives] = useState([]);
  const [counts, setCounts] = useState(null);

  const fetchAlternatives = useCallback(async () => {
    if (!hotel?.id || !searchParams?.checkIn || !searchParams?.checkOut) return;
    setLoading(true);
    setError('');
    setAlternatives([]);
    try {
      const res = await fetch('/api/lp/booking-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          hotel_id: hotel.id,
          start_date: format(searchParams.checkIn, 'dd/MM/yyyy'),
          end_date: format(searchParams.checkOut, 'dd/MM/yyyy'),
          adults: searchParams.adults || 2,
          children: searchParams.children || 0,
          exclude_booking_code: excludeBookingCode || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const enriched = (data.alternatives || []).map(item => ({
          ...item,
          apt: applyHotelRate(item.apt, hotel, parseDDMMYYYY(item.start_date)),
        }));
        setAlternatives(enriched);
        setCounts(data.counts || null);
        if (enriched.length === 0) {
          setError('Não encontramos opções com confirmação imediata. Tente outras datas ou outro hotel.');
        }
      } else {
        setError(data.error || 'Não foi possível buscar alternativas.');
      }
    } catch (e) {
      setError('Erro de conexão ao buscar alternativas.');
    } finally {
      setLoading(false);
    }
  }, [hotel, searchParams, excludeBookingCode]);

  useEffect(() => {
    if (open) fetchAlternatives();
  }, [open, fetchAlternatives]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-white rounded-xl border-0 shadow-2xl">
        <DialogHeader className="p-5 border-b space-y-0">
          <div className="flex gap-3">
            <div className="bg-blue-100 p-2 rounded-lg shrink-0 h-fit">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-bold text-gray-900">Esse apartamento exige condições especiais</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                As datas escolhidas não atendem a algumas <strong>regras do hotel</strong> para esse quarto.
                Selecionamos abaixo opções parecidas com <strong>confirmação imediata</strong>:
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
              <p className="text-sm">Buscando alternativas com disponibilidade imediata...</p>
              <p className="text-xs mt-1 text-gray-400">Pode levar até 20 segundos</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && alternatives.length > 0 && (
            <div className="space-y-3">
              {alternatives.map((item, idx) => {
                const badge = reasonBadge(item.reason, item.diff);
                const sd = parseDDMMYYYY(item.start_date);
                const ed = parseDDMMYYYY(item.end_date);
                const aptName = item.apt.type || item.apt.nomenclature || item.apt.accommodation_description || 'Apartamento';
                const total = item.apt.total_price || 0;
                return (
                  <div
                    key={`${item.apt.booking_code}-${idx}`}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 truncate">{aptName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-bold text-lg text-blue-700">R$ {formatBR(total)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(sd, 'dd/MM/yyyy')} → {format(ed, 'dd/MM/yyyy')}
                      </span>
                      <span>{item.nights} {item.nights === 1 ? 'noite' : 'noites'}</span>
                      {item.apt.max_capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          até {item.apt.max_capacity}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectAlternative({
                        apt: item.apt,
                        checkIn: sd,
                        checkOut: ed,
                      })}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      Escolher esta opção
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t p-4 flex items-center justify-between gap-3 bg-gray-50">
          {counts && (
            <p className="text-xs text-gray-500">
              {counts.waveA} no mesmo período · {counts.waveB} estendendo · {counts.waveC} mudando data
            </p>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={fetchAlternatives}
              disabled={loading}
              className="px-4 py-2 text-sm text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              Buscar novamente
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
