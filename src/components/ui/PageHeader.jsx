import React from 'react';
import { motion } from 'framer-motion';

export default function PageHeader({ title, description, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2e6299] to-[#3a73b0] flex items-center justify-center shadow-lg">
            <Icon className="w-7 h-7 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}