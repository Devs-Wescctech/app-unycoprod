import React from 'react';
import { MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ActionMenu({ items, onItemClick }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 hover:bg-slate-100 rounded-lg transition-all group outline-none"
        >
          <MoreVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden p-2"
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.separator ? (
              <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
            ) : (
              <DropdownMenuItem
                onClick={() => onItemClick?.(item.action)}
                className={`
                  px-3 py-2.5 cursor-pointer rounded-lg transition-all flex items-center gap-3
                  ${item.danger 
                    ? 'hover:bg-red-50 hover:text-red-600 text-slate-700' 
                    : 'hover:bg-slate-50 hover:text-[#2e6299] text-slate-700'
                  }
                  focus:bg-slate-50
                `}
              >
                {item.icon && (
                  <item.icon className={`w-4 h-4 ${item.danger ? 'text-red-500' : 'text-slate-400'}`} />
                )}
                <span className="font-medium text-sm">{item.label}</span>
              </DropdownMenuItem>
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}