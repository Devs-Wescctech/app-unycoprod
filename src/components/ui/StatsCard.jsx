import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, color, subtitle, trend }) {
  const colorClasses = {
    blue: { bg: 'bg-[#2e6299]', icon: 'text-[#2e6299]', light: 'bg-[#2e6299]/10' },
    emerald: { bg: 'bg-emerald-500', icon: 'text-emerald-600', light: 'bg-emerald-50' },
    amber: { bg: 'bg-amber-500', icon: 'text-amber-600', light: 'bg-amber-50' },
    red: { bg: 'bg-red-500', icon: 'text-red-600', light: 'bg-red-50' },
    slate: { bg: 'bg-slate-500', icon: 'text-slate-600', light: 'bg-slate-50' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-lg ${colors.light} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-slate-400 text-xs mt-2">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}