import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function ModernStatsCard({ title, value, subtitle, icon: Icon, trend, sparklineData, showCircle = false, circleValue }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border border-blue-100/50 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Header with Icon and Trend */}
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${
              trend > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
          <div className="w-8 h-8 rounded-lg bg-blue-100/60 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        {showCircle ? (
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(circleValue || 75) * 2.01} 201`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#2e6299]">{value}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-4xl font-bold text-[#2e6299]">{value}</h3>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </>
        )}
      </div>

      {/* Sparkline Chart */}
      {sparklineData && sparklineData.length > 0 && !showCircle && (
        <div className="h-12 -mx-2 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#sparklineGradient)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}