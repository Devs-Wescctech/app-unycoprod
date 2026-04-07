import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, CheckCircle2, DollarSign, TrendingUp, RefreshCw, Filter, Calendar, ChevronDown, ChevronUp, LayoutDashboard, Loader2, AlertCircle, AlertTriangle, MapPin, BarChart3, Activity, FileDown, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModernStatsCard from '@/components/ui/ModernStatsCard';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, ComposedChart, PieChart, Pie, Cell, BarChart } from 'recharts';
import { useUsersSubscriptions } from '@/hooks/useUsersSubscriptions';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const BRAZIL_STATES_PATHS = {
  'AC': "M24.4,163.5 L35,168.3 L60.8,174.1 L102.9,194.3 L81.4,207.5 L71.6,205.4 L58,206.2 L59.4,188.5 L51.2,194.7 L40.5,195 L38.5,189.3 L28.8,188.4 L32,183.6 L20.1,167.5 L20.4,165.1 L23.4,164.7 L22.2,162.5 L24.4,163.5 Z",
  'AL': "M453.5,181.8 L457,182.9 L443.2,200.6 L422.3,187.5 L427.7,182.1 L437,188 L453.5,181.8 Z",
  'AM': "M95.1,59.7 L97.7,63 L97.8,69.4 L100.4,68.7 L106.4,74 L114.7,71.1 L115.2,75.2 L120,69.5 L128,65.3 L128.7,67.2 L132.5,60.2 L142,58 L147.1,60.7 L145.9,64.5 L150,71.5 L149,76.8 L152.9,86.3 L149.3,91.1 L156.2,98.2 L160.9,100.3 L159.7,92.7 L163.8,88.1 L170,92.6 L174,90.7 L173,88.2 L177.1,79.5 L189.9,79.5 L190.2,86.4 L196.4,95.4 L199.8,94.9 L200.5,98.3 L209.4,101.9 L214.6,107.3 L221.4,105.3 L218.1,108.1 L194.6,157.9 L198.5,165.3 L195.7,170.7 L195.6,181.3 L158.2,180.2 L155.2,182.4 L145.5,172.3 L136.8,172.2 L130.8,183.3 L123.3,183.6 L120.7,188.3 L118.5,186.6 L112.4,190.3 L105.4,188.3 L100.9,192.9 L60.8,174.1 L35,168.3 L22.2,162.5 L24.3,158.3 L29.7,155.7 L28.6,150.3 L33.3,140 L43.8,133.3 L54.4,131.8 L57.7,128.9 L65.4,131 L71.8,95.1 L69.3,88.1 L64.4,84.7 L64.5,76.2 L75,75.2 L73.3,70.5 L66.8,70.3 L66.8,63.1 L85.7,63 L85.2,60.4 L88.3,61.9 L94.2,57.2 L95.1,59.7 Z",
  'AP': "M276.7,37.4 L282.1,58.4 L285.1,57.8 L287.3,62.2 L291,63.4 L291.2,69.1 L288.9,74.6 L276.3,83.8 L270.8,94.5 L266.7,96.4 L262.7,94.3 L261.6,89 L257,84.1 L251.5,68.5 L236.6,62.5 L235.1,55.2 L242.9,58 L247.6,55.7 L256.7,58.2 L261.3,54.2 L272.6,32.7 L276.7,37.4 Z",
  'BA': "M410.5,178.8 L421.7,184 L428,198.7 L427.1,202.8 L422.6,203 L422.4,205.3 L427.1,212 L432.4,211.4 L424.5,224.6 L414.1,231.9 L413,248.3 L415.4,260.9 L411.4,275.3 L412.2,281.6 L406.2,288.9 L395.5,278.3 L397,272.4 L399.7,272.2 L399.4,269 L404.1,263.9 L399.9,260.3 L387.5,259.6 L382.4,252.5 L377,252.7 L366.8,247.3 L362.8,249.2 L358.9,247.5 L359.9,243.8 L355.1,242.6 L334.1,254.2 L336,243.9 L332,241.1 L332.3,233.6 L334.5,231.8 L331.3,231.6 L333.7,227.8 L331.6,228.2 L333.3,222.9 L330.5,217.9 L333.1,216.4 L330.9,216.2 L331.5,213.4 L334.1,213.4 L329.6,212.1 L328.1,209.1 L339.5,196.2 L343.4,204.2 L347,205.4 L351,202 L356,202.2 L361.3,195 L359.2,189.9 L363.3,186.7 L371.4,190.7 L390,180.4 L395,185.5 L393.8,188.9 L395.5,189.2 L406,179.9 L410.5,178.8 Z",
  'CE': "M402.3,114.4 L419.7,124.2 L433.4,136.7 L429.1,137.9 L423.2,149.4 L418.5,153.1 L416.4,161.2 L419,164.6 L414.1,170.8 L406.3,164.7 L396.3,165.7 L398.3,159 L393.6,155.9 L392.1,140.7 L388.5,137.3 L390.2,129.4 L386.5,120.4 L387.6,115.4 L402.3,114.4 Z",
  'DF': "M320.3,262.9 L309.4,263.1 L310.3,256.9 L319.1,256.9 L320.3,262.9 Z",
  'ES': "M394.4,317 L391.7,322.2 L383.3,320.2 L381.6,311.6 L387,309.6 L391.8,301.6 L391.1,296 L388.5,294.6 L392.2,294.2 L389.5,288.5 L393.8,286.7 L392.4,284.8 L396.7,283.8 L406.3,288.7 L406,300.1 L394.4,317 Z",
  'GO': "M288.2,222.1 L286.5,226.7 L297.1,231.8 L299.9,226.4 L301.5,228.3 L303,226.6 L305.9,232.3 L306.8,230.2 L307.5,232 L310.5,230.4 L316.1,234 L316.6,229.9 L319,232 L330.3,226.8 L330.8,228.6 L333.7,227.8 L331.4,229.9 L331.9,232.7 L334.5,231.8 L332.3,233.6 L332,241.1 L336,244.2 L334,250.5 L329.3,247.9 L329.3,251.9 L324.6,251.9 L325.9,261.2 L320.2,262.9 L319.1,256.9 L310.3,256.9 L309.4,263.1 L320.3,263.1 L318.6,268.1 L322.3,273.9 L317.7,278.9 L320.8,280.6 L320.6,285.6 L313,290.6 L302,288.4 L296.8,292.3 L295.2,290.5 L286.4,292.9 L280.5,301.9 L257.2,292.2 L259,288.9 L255.1,288.5 L253.5,279.3 L256.1,272.1 L260.5,268.5 L259.8,265.9 L268.9,260.5 L272.7,252 L277.8,250.3 L280.2,237 L284.6,225.5 L288.2,222.1 Z",
  'MA': "M323.4,183.6 L329.8,173.2 L328.2,171.3 L323.3,173.1 L315.3,163.4 L319.5,153 L318.1,144.6 L308.4,140.6 L304,142.7 L316.9,133.8 L322.8,125.9 L332,106.3 L333.3,96.3 L336.8,94.3 L338.2,98.3 L341.6,97 L341.3,99.9 L342.7,97.3 L342.3,102 L345.1,97.8 L345.4,99.6 L348.3,98.4 L347.4,100.7 L350.3,100.8 L348.3,102.9 L350.8,102.1 L353.8,110.6 L357.3,109.5 L357.5,111.5 L361.8,107.5 L374.6,113 L382,113.1 L380.7,118.4 L374.4,121.3 L368.9,130 L371,141 L367.6,148.9 L370.7,153.8 L369.7,157.5 L364.2,159.5 L356.9,158.6 L349.8,165.7 L341.1,168.8 L335.1,182.9 L337.4,188.9 L335.6,197.9 L330,195.9 L327.7,192 L328.7,189.2 L323.4,183.6 Z",
  'MG': "M355.2,242.7 L359.9,243.8 L358.9,247.5 L362.8,249.2 L366.8,247.3 L377,252.7 L382.2,252.4 L387.5,259.6 L394.5,258.7 L404.1,263.8 L399.4,269 L399.7,272.2 L396.1,274.4 L395.5,278.3 L400,282 L400,284.8 L393.1,284.5 L393.8,286.7 L390.2,287.2 L389.2,290 L392.2,294.2 L388.5,294.6 L391.1,296 L391.9,301.4 L387,309.6 L381.7,311.2 L382.2,314.7 L378.3,318.5 L376.9,326.8 L367.9,331.1 L360,330.7 L331.1,340.2 L330.4,336 L326.9,333.6 L329.3,324 L323.6,323.5 L321.1,317.5 L322.7,314.7 L318.5,307.1 L303.2,309.3 L302.4,312.5 L301.4,309.4 L298.8,310.9 L298.4,307.1 L295.1,306.4 L284.7,305 L278.6,308.3 L279.2,301.6 L286.4,292.9 L295.2,290.5 L296.8,292.3 L302,288.4 L313,290.6 L320.6,285.6 L320.8,280.6 L317.7,278.1 L322.3,273.5 L318.6,267.8 L320.5,262.6 L325.9,261.2 L324.7,251.8 L329.3,251.9 L329.7,247.9 L331.7,250.4 L335,250.1 L334.4,254.2 L355.2,242.7 Z",
  'MS': "M246.4,284.1 L255.4,285.4 L255.5,288.9 L259,288.9 L257.2,292.2 L278.2,300 L278.8,308.5 L272,314.8 L263.3,331.2 L249.4,340.7 L243.8,352.1 L241.8,353.3 L237.5,350.4 L229.7,352.4 L224.2,333.2 L218.1,330.8 L213,333.4 L199.9,330.6 L202.1,318.5 L198.1,309.4 L201.6,307.2 L198.5,304.8 L206.2,287.6 L202.3,280 L206.2,283.9 L214.3,277.2 L221.2,275.6 L231.8,281 L238.5,279 L241.6,281.2 L248.3,276.3 L246.4,284.1 Z",
  'MT': "M173.4,232.1 L180,221.3 L176.3,215.7 L177.8,207.6 L160.1,206.1 L159.7,181.5 L195.6,181.3 L195.7,170.7 L198.4,165.2 L204,174.9 L204.5,180.9 L213.9,188.3 L287.5,193.2 L281.7,211.1 L282.1,224.8 L284.4,227.4 L278.3,248.9 L271.4,253.3 L268.8,260.6 L259.8,265.9 L260.4,268.7 L253.8,277.1 L255.4,285.4 L245.5,284 L248.3,281.2 L248.3,276.3 L244.1,280.7 L238.5,279 L232.3,281.1 L221.2,275.6 L214.3,277.2 L210.8,282 L206.1,283.9 L195.6,275.8 L196.4,265.5 L175.6,265.5 L174.8,256.6 L171.2,252.6 L174.8,252.3 L173.2,239.8 L169.4,236.4 L173.4,232.1 Z",
  'PA': "M324.3,90.8 L326.6,92.9 L327.7,91.3 L327.4,93.5 L330.2,92.1 L330.2,94.5 L332.9,92.6 L331.9,95.7 L334.2,94 L332,106.3 L319.6,130.3 L304,142.7 L311,145.5 L309.9,149.4 L305.1,157.4 L298.9,160.4 L296.9,167.4 L299.6,170.3 L298.8,174.8 L287.5,193.2 L213.9,188.3 L204.5,180.9 L204,174.9 L194.6,157.9 L218.1,108.1 L221.4,105.3 L214.6,107.3 L209.4,101.9 L200.5,98.3 L199.8,94.9 L198.2,96.3 L195.2,94.1 L190.2,86.4 L189.9,68.7 L194.4,68.2 L196.4,64.5 L200,65.6 L200.1,63.8 L205.2,63.4 L207.8,60 L222.6,61.9 L223.6,59.5 L220.9,57 L222.8,54 L229.4,55.3 L233.7,53.3 L236.6,62.5 L251.5,68.5 L257,84.1 L261.6,89 L262.7,94.3 L266.4,96.3 L270.8,94.5 L276.3,83.8 L287.8,74.6 L289.3,78.7 L293.6,78.4 L302.2,85.1 L307.9,85.4 L307.2,88.1 L324.3,90.8 Z",
  'PB': "M433.7,150.4 L430.8,158 L438.1,158.2 L439.4,161.1 L443.1,153.3 L447.8,155.5 L459.1,155.5 L460.7,167.4 L453.2,166.3 L453,168.5 L442.7,170.4 L436.7,175.9 L432.3,172.2 L436.4,166.7 L433.6,164.3 L424.1,170.6 L418.3,169.7 L416.9,168.1 L419,164.6 L416.4,161.2 L418.2,154.4 L423.7,155.9 L433.7,150.4 Z",
  'PE': "M434.3,164.7 L436.4,166.7 L432.3,172.2 L436.3,175.9 L442.7,170.4 L453,168.5 L453.2,166.3 L460.6,167.4 L457.1,182.7 L448.7,182.1 L445,185.7 L436.8,188 L427.7,182.1 L422.3,187.5 L419.7,182.1 L417.5,183.5 L409.4,178.5 L395.5,189.2 L392.4,182.2 L387.2,180.5 L395.9,174 L394.5,166.6 L396.3,165.7 L406.3,164.7 L412.7,170.9 L417,168.2 L424.1,170.6 L434.3,164.7 Z",
  'PI': "M382.9,114.1 L388.4,116.3 L386.5,120.4 L390.2,129.4 L388.5,137.3 L392.1,140.7 L393.6,155.9 L398.3,159 L394.5,166.6 L395.9,174 L381.8,186.5 L371.4,190.7 L363.3,186.7 L359.2,189.9 L361.3,195 L356,202.2 L351,202 L347,205.4 L343.4,204.2 L339.6,196.2 L335.5,197.5 L337.4,188.9 L335.1,182.9 L340.7,169.6 L349.8,165.7 L356.9,158.6 L364.2,159.5 L369.7,157.5 L370.7,153.8 L367.6,148.9 L371,141 L368.9,130 L374.3,121.4 L377.6,121.2 L382.9,114.1 Z",
  'PR': "M266.8,336 L281,340.7 L290.2,340.1 L293.1,342.5 L294.4,350.8 L299,356.4 L297.7,360 L306,360.1 L306.2,364.7 L309.7,363.5 L312.2,366.2 L305.9,374.7 L295,377.7 L290.7,375.1 L283.6,375 L281.8,377.8 L276,378.6 L274.1,383.1 L250,378.3 L246.2,370.7 L238.3,370.4 L241.2,353.8 L249.4,340.7 L256.5,336.4 L265,337.6 L266.8,336 Z",
  'RJ': "M351.7,344.5 L347.5,343.9 L348.6,341 L355.7,337.6 L350.2,336.8 L348.6,334.3 L360,330.7 L367.9,331.1 L376.9,326.8 L378.3,318.5 L381.4,316.1 L383.3,320.2 L391.7,322.1 L391.4,330 L380.4,336 L379.9,341.2 L368.2,341.1 L367.8,337.6 L365.5,339 L366.7,341.1 L362.6,342.1 L352.8,340.6 L349.7,342.2 L351.7,344.5 Z",
  'RN': "M434.5,138 L453.3,140.5 L459.1,155.5 L447.8,155.5 L443.1,153.3 L439.4,161.1 L438.1,158.2 L430.8,158 L434.3,150.5 L423.7,155.9 L418.5,153.9 L429.1,137.9 L434.5,138 Z",
  'RO': "M104.8,193.6 L100.9,192.9 L105.4,188.3 L112.4,190.3 L118.5,186.6 L120.2,188.6 L123.1,183.7 L130.8,183.3 L136.8,172.2 L145.3,172.2 L153.6,181.5 L158.2,180.2 L161,182.8 L159.1,186.7 L160.9,190.8 L160.1,206.1 L177.7,207.5 L176.3,215.7 L180,221.3 L169.5,236.5 L166.1,234.2 L156.8,234.9 L153.1,230 L146.2,228.9 L142,224.4 L129.2,223.1 L120.9,217.5 L117.2,209.1 L116.8,191.4 L104.8,193.6 Z",
  'RR': "M178.4,47.1 L180.3,61.6 L190,68.2 L189.9,79.5 L177.1,79.5 L173,88.2 L174.1,90.5 L171.5,92.3 L165.3,88.1 L161.4,89.6 L159.2,97.1 L160.8,100.3 L149.3,91.1 L152.9,86.2 L149,76.8 L149.7,70.3 L145.9,64.5 L147.1,60.7 L139.7,57.8 L139.2,55.1 L132.1,54.7 L130.4,42.4 L123.2,34.7 L130.6,36 L132.9,39 L141.4,38 L144.3,41.9 L146.8,40.8 L146.6,37.1 L155.8,36.3 L162.8,31.4 L166.3,31.7 L170.9,27 L169.4,23.8 L175.2,23.2 L177.6,25.7 L175.7,31.8 L181.1,33.2 L182.9,37.9 L179,42.2 L178.4,47.1 Z",
  'RS': "M267,437.7 L264.6,440.8 L266.4,444.3 L260.7,454.7 L251.6,462.2 L251.2,455.9 L254.8,451.4 L259.2,452.1 L260.5,444.1 L255.4,449.9 L251.9,449.1 L247.9,443.4 L238.4,436.4 L231.1,434.2 L227.3,429.4 L222.4,432.2 L222.3,428.9 L213.5,421.2 L208.8,423.3 L204,422.1 L223.9,401.5 L226,402.2 L225.1,400.2 L233.4,395.9 L235.8,392.2 L241.9,391.3 L246.4,387.7 L265.6,389.3 L277.8,395.6 L283,401.9 L292.6,402.7 L293.5,404.5 L288.1,411.5 L293.1,412.7 L281.4,432.5 L266.6,444.3 L266.4,440.6 L275.8,436.7 L276.9,432 L282.2,428.2 L281.8,424.1 L283.6,425.3 L283.3,422.2 L279.5,424.9 L275.4,420 L275.4,423.3 L277.7,424.3 L274.4,427.4 L273.8,432.2 L267,437.7 Z",
  'SC': "M248.1,381.3 L249,377.8 L252,377.7 L274.1,383.1 L276,378.6 L281.8,377.8 L283.6,375 L290.7,375.1 L295,377.7 L305.3,374.5 L307,377.5 L304.8,383.1 L307.3,387.9 L304.2,403.2 L293.3,412.4 L290.3,411 L289.3,412.6 L292.6,402.7 L283,401.9 L277.8,395.6 L265.6,389.3 L256,387.2 L246.9,388.2 L248.1,381.3 Z",
  'SE': "M425.4,189.7 L443.1,200.6 L430,212.5 L425.6,211 L422.3,204.9 L422.8,202.9 L427.1,202.8 L428,198.7 L425,194.1 L425.4,189.7 Z",
  'SP': "M333.5,350.9 L323.8,356.1 L311.4,367.2 L309.7,363.5 L306.2,364.7 L306,360.1 L297.7,360 L299,356.4 L294.4,350.8 L293.9,343.6 L290.2,340.1 L281,340.7 L266.4,335.8 L265,337.6 L255,336.7 L263.3,331.2 L272,314.8 L283.5,305.4 L298.4,307.1 L298.3,310.4 L301.4,309.4 L302.4,312.5 L303.2,309.3 L318.5,307.1 L322.7,314.7 L321.1,317.5 L323.6,323.5 L329.3,324 L326.9,333.6 L330.4,336 L331.1,340.2 L348.4,334.6 L355.7,337.6 L348.6,341 L347.5,343.9 L349.4,345.4 L341.6,348.3 L341.7,350.5 L333.5,350.9 Z",
  'TO': "M323.4,183.6 L328.7,189.2 L327.7,192 L330.9,196.9 L338.4,196.9 L328.1,209.1 L329.6,212.1 L334.1,213.4 L331.5,213.4 L330.9,216.2 L333.1,216.4 L330.5,217.9 L333.3,222.9 L331.6,228.2 L333.7,227.9 L330.8,228.6 L330.3,226.8 L319,232 L316.6,229.9 L316.1,234 L310.5,230.4 L307.5,232 L306.8,230.2 L305.9,232.3 L302.7,226.5 L301.5,228.3 L298.6,227.4 L297.1,231.8 L286.5,226.7 L288.4,221.9 L283,226.7 L283.2,202.4 L289.5,187.1 L298.1,176.8 L299.6,170.3 L296.9,167.4 L298.9,160.4 L308.2,154.3 L311,145.5 L304,142.8 L306.7,140.9 L313.1,141.4 L318.1,144.6 L319.5,153 L315.3,163.4 L323.3,173.1 L329.5,172.3 L323.4,183.6 Z",
};

const ESTADOS_CENTERS = {
  'AC': { x: 60, y: 187, name: 'Acre' },
  'AL': { x: 440, y: 190, name: 'Alagoas' },
  'AM': { x: 124, y: 129, name: 'Amazonas' },
  'AP': { x: 268, y: 66, name: 'Amapá' },
  'BA': { x: 383, y: 223, name: 'Bahia' },
  'CE': { x: 407, y: 140, name: 'Ceará' },
  'DF': { x: 315, y: 260, name: 'Distrito Federal' },
  'ES': { x: 395, y: 303, name: 'Espírito Santo' },
  'GO': { x: 294, y: 263, name: 'Goiás' },
  'MA': { x: 343, y: 140, name: 'Maranhão' },
  'MG': { x: 350, y: 290, name: 'Minas Gerais' },
  'MS': { x: 235, y: 311, name: 'Mato Grosso do Sul' },
  'MT': { x: 223, y: 228, name: 'Mato Grosso' },
  'PA': { x: 255, y: 127, name: 'Pará' },
  'PB': { x: 438, y: 163, name: 'Paraíba' },
  'PE': { x: 425, y: 176, name: 'Pernambuco' },
  'PI': { x: 369, y: 166, name: 'Piauí' },
  'PR': { x: 272, y: 360, name: 'Paraná' },
  'RJ': { x: 373, y: 332, name: 'Rio de Janeiro' },
  'RN': { x: 439, y: 148, name: 'Rio Grande do Norte' },
  'RO': { x: 145, y: 205, name: 'Rondônia' },
  'RR': { x: 162, y: 59, name: 'Roraima' },
  'RS': { x: 253, y: 417, name: 'Rio Grande do Sul' },
  'SC': { x: 285, y: 389, name: 'Santa Catarina' },
  'SE': { x: 431, y: 202, name: 'Sergipe' },
  'SP': { x: 304, y: 333, name: 'São Paulo' },
  'TO': { x: 309, y: 197, name: 'Tocantins' },
};

function formatCurrency(v) {
  return "R$ " + parseFloat(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BrazilMapDashboard({ data, labelKey = 'assinantes', labelSingular = 'assinante', labelPlural = 'assinantes', showReceita = true }) {
  const [hovered, setHovered] = useState(null);

  const maxValue = Math.max(...data.map(d => d[labelKey] || 0), 1);

  const dataMap = {};
  data.forEach(d => { dataMap[d.estado] = d; });

  function getStateColor(uf) {
    const d = dataMap[uf];
    if (!d) return '#eef2f7';
    const intensity = Math.min((d[labelKey] || 0) / maxValue, 1);
    const r = Math.round(220 + (46 - 220) * intensity);
    const g = Math.round(232 + (98 - 232) * intensity);
    const b = Math.round(245 + (153 - 245) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const sorted = [...data].sort((a, b) => (b[labelKey] || 0) - (a[labelKey] || 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 relative" style={{ minHeight: '300px' }}>
        <svg viewBox="0 15 480 460" className="w-full h-auto" style={{ minHeight: '300px' }} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="dashMapShadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#94a3b8" floodOpacity="0.15" />
            </filter>
            <filter id="dashTooltipShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
            </filter>
            <linearGradient id="dashStateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0f4f8" />
              <stop offset="100%" stopColor="#e4eaf0" />
            </linearGradient>
            <radialGradient id="dashBubbleGrad" cx="35%" cy="30%">
              <stop offset="0%" stopColor="white" stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <g filter="url(#dashMapShadow)">
            {Object.entries(BRAZIL_STATES_PATHS).map(([uf, pathD]) => {
              const d = dataMap[uf];
              const isHovered = hovered === uf;
              return (
                <path
                  key={uf}
                  d={pathD}
                  fill={d ? getStateColor(uf) : 'url(#dashStateGrad)'}
                  stroke={isHovered ? '#2e6299' : '#c8d4e0'}
                  strokeWidth={isHovered ? 1.5 : 0.7}
                  opacity={isHovered ? 1 : 0.95}
                  onMouseEnter={() => setHovered(uf)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer transition-all duration-200"
                  style={{ transition: 'fill 0.2s ease, stroke-width 0.2s ease' }}
                />
              );
            })}
          </g>

          {Object.entries(ESTADOS_CENTERS).map(([uf, pos]) => {
            const d = dataMap[uf];
            const isHovered = hovered === uf;
            if (!d) {
              return (
                <text key={uf} x={pos.x} y={pos.y + 3} textAnchor="middle" fontSize="7" fontWeight="500" fill="#94a3b8" className="pointer-events-none select-none">
                  {uf}
                </text>
              );
            }
            const radius = Math.max(12, Math.min(26, 12 + ((d[labelKey] || 0) / maxValue) * 14));
            return (
              <g key={uf}
                onMouseEnter={() => setHovered(uf)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <circle cx={pos.x} cy={pos.y} r={radius + 5} fill="#2e6299" opacity="0.08" />
                <circle cx={pos.x} cy={pos.y} r={radius + 2} fill="#2e6299" opacity="0.12" />
                <circle
                  cx={pos.x} cy={pos.y}
                  r={isHovered ? radius + 1.5 : radius}
                  fill={isHovered ? '#1e4f80' : '#2e6299'}
                  stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <circle cx={pos.x} cy={pos.y} r={radius} fill="url(#dashBubbleGrad)" className="pointer-events-none" />
                <text x={pos.x} y={pos.y + 3.5} textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" className="pointer-events-none select-none">
                  {uf}
                </text>
                {isHovered && (
                  <g className="pointer-events-none">
                    <rect x={pos.x > 300 ? pos.x - 165 : pos.x + 20} y={pos.y - 50} width="148" height="64" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="0.8" filter="url(#dashTooltipShadow)" />
                    <text x={pos.x > 300 ? pos.x - 157 : pos.x + 28} y={pos.y - 32} fontSize="10" fontWeight="700" fill="#1e293b">{pos.name}</text>
                    <text x={pos.x > 300 ? pos.x - 157 : pos.x + 28} y={pos.y - 18} fontSize="8.5" fill="#64748b">{d[labelKey] || 0} {(d[labelKey] || 0) !== 1 ? labelPlural : labelSingular}</text>
                    {showReceita && <text x={pos.x > 300 ? pos.x - 157 : pos.x + 28} y={pos.y - 3} fontSize="9.5" fill="#2e6299" fontWeight="700">{formatCurrency(d.receita)}</text>}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="space-y-4">
        <h4 className="font-bold text-slate-700 text-sm">Ranking por Estado</h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {sorted.map((item, idx) => (
            <div key={item.estado} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-[#2e6299] text-white' : 'bg-slate-200 text-slate-600'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{ESTADOS_CENTERS[item.estado]?.name || item.estado}</p>
                <p className="text-xs text-slate-400">{item[labelKey] || 0} {(item[labelKey] || 0) !== 1 ? labelPlural : labelSingular}</p>
              </div>
              <div className="text-right">
                {showReceita && <p className="text-sm font-bold text-emerald-600">{formatCurrency(item.receita)}</p>}
                <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1">
                  <div className="h-full bg-[#2e6299] rounded-full" style={{ width: `${((item[labelKey] || 0) / maxValue) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#2e6299]/5 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Total {labelPlural.charAt(0).toUpperCase() + labelPlural.slice(1)}</p>
              <p className="text-xl font-bold text-[#2e6299]">{data.reduce((s, d) => s + (d[labelKey] || 0), 0)}</p>
            </div>
            {showReceita && (
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Receita Total</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(data.reduce((s, d) => s + d.receita, 0))}</p>
            </div>
            )}
            {!showReceita && (
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Estados</p>
              <p className="text-xl font-bold text-emerald-600">{data.length}</p>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ESTADOS_BRASIL = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapa', 'AM': 'Amazonas', 'BA': 'Bahia',
  'CE': 'Ceara', 'DF': 'Distrito Federal', 'ES': 'Espirito Santo', 'GO': 'Goias',
  'MA': 'Maranhao', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
  'PA': 'Para', 'PB': 'Paraiba', 'PR': 'Parana', 'PE': 'Pernambuco', 'PI': 'Piaui',
  'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
  'RO': 'Rondonia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'Sao Paulo',
  'SE': 'Sergipe', 'TO': 'Tocantins'
};

export default function Dashboard() {
  const [dateFilter, setDateFilter] = useState('mes_atual');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [totvsHealth, setTotvsHealth] = useState(null);
  const dashboardRef = useRef(null);

  const { data: apiData, isLoading, error, refetch } = useUsersSubscriptions();
  const { plansEnabled } = useSystemConfig();

  useEffect(() => {
    fetch('/api/totvs/health')
      .then(r => r.json())
      .then(data => setTotvsHealth(data))
      .catch(() => setTotvsHealth({ status: 'error', message: 'Não foi possível verificar o status da API TOTVS' }));
  }, []);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    
    setIsExporting(true);
    try {
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'CPF', 'Email', 'Estado', 'Cidade', 'Assinatura', 'Valor Plano (R$)', 'Data Criacao'];
    const rows = filteredUsers.map(u => [
      u.nome || '',
      u.cpf || '',
      u.email || '',
      u.estado || '',
      u.cidade || '',
      u.temAssinatura ? 'Ativa' : 'Inativa',
      u.valorPlano ? u.valorPlano.toFixed(2).replace('.', ',') : '0,00',
      u.created_date ? new Date(u.created_date).toLocaleDateString('pt-BR') : '',
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(v => `"${v}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const users = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    return apiData.map(item => ({
      id: item.user_id,
      nome: item.user_name || '',
      cpf: item.user_cpf || '',
      email: item.user_email || '',
      estado: item.user_estado?.toUpperCase() || 'N/I',
      cidade: item.user_cidade || '',
      temAssinatura: !!item.subscription_id,
      valorPlano: parseFloat(item.plan_price) || 0,
      created_date: item.subscription_created_at || item.user_created_at || new Date().toISOString(),
      subscription_started_at: item.subscription_started_at
    }));
  }, [apiData]);

  const estados = useMemo(() => {
    const estadosSet = new Set();
    users.forEach(u => {
      if (u.estado && u.estado !== 'N/I') estadosSet.add(u.estado);
    });
    return Array.from(estadosSet).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (dateFilter === 'mes_atual') {
        if (new Date(user.created_date) < startOfMonth(new Date())) return false;
      } else if (dateFilter === 'personalizado') {
        if (customStartDate && customEndDate) {
          const userDate = new Date(user.created_date);
          if (!isWithinInterval(userDate, {
            start: startOfDay(customStartDate),
            end: endOfDay(customEndDate)
          })) return false;
        }
      } else if (dateFilter !== 'todos') {
        const days = parseInt(dateFilter);
        const dateLimit = subDays(new Date(), days);
        if (new Date(user.created_date) < dateLimit) return false;
      }

      if (estadoFilter !== 'todos' && user.estado !== estadoFilter) return false;

      if (statusFilter !== 'todos') {
        if (statusFilter === 'ativa' && !user.temAssinatura) return false;
        if (statusFilter === 'inativa' && user.temAssinatura) return false;
      }

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          user.nome?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.cpf?.includes(search) ||
          user.cidade?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [users, dateFilter, customStartDate, customEndDate, estadoFilter, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const ativos = filteredUsers.filter(u => u.temAssinatura);
    const receitaTotal = ativos.reduce((acc, u) => acc + (u.valorPlano || 0), 0);
    const mesPassado = subMonths(new Date(), 1);
    const assinantesMesPassado = users.filter(u => {
      const date = new Date(u.created_date);
      return date < startOfMonth(new Date()) && date >= startOfMonth(mesPassado);
    }).length;
    const assinantesMesAtual = users.filter(u => {
      const date = new Date(u.created_date);
      return date >= startOfMonth(new Date());
    }).length;
    const crescimento = assinantesMesPassado > 0 
      ? Math.round(((assinantesMesAtual - assinantesMesPassado) / assinantesMesPassado) * 100)
      : assinantesMesAtual > 0 ? 100 : 0;

    return {
      total: filteredUsers.length,
      ativos: ativos.length,
      inativos: filteredUsers.length - ativos.length,
      receitaTotal,
      ticketMedio: ativos.length > 0 ? receitaTotal / ativos.length : 0,
      crescimento,
      totalEstados: estados.length
    };
  }, [filteredUsers, users, estados]);

  const assinantesPorEstado = useMemo(() => {
    const distribution = {};
    filteredUsers.forEach(u => {
      const estado = u.estado || 'N/I';
      distribution[estado] = (distribution[estado] || 0) + 1;
    });
    
    const colors = ['#2e6299', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], idx) => ({
        name: ESTADOS_BRASIL[name] || name,
        sigla: name,
        value,
        color: colors[idx % colors.length]
      }));
  }, [filteredUsers]);

  const receitaPorEstado = useMemo(() => {
    const receita = {};
    filteredUsers.filter(u => u.temAssinatura).forEach(u => {
      const estado = u.estado || 'N/I';
      receita[estado] = (receita[estado] || 0) + (u.valorPlano || 0);
    });
    return Object.entries(receita)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([estado, valor]) => ({
        estado: ESTADOS_BRASIL[estado] || estado,
        sigla: estado,
        receita: valor
      }));
  }, [filteredUsers]);

  const receitaPorMes = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const mesRef = subMonths(new Date(), i);
      const inicioMes = startOfMonth(mesRef);
      const fimMes = endOfMonth(mesRef);
      
      const assinantesAtivos = users.filter(u => {
        const dataInicio = u.subscription_started_at ? new Date(u.subscription_started_at) : new Date(u.created_date);
        return u.temAssinatura && dataInicio <= fimMes;
      }).length;
      
      const receitaMes = users.filter(u => {
        const dataInicio = u.subscription_started_at ? new Date(u.subscription_started_at) : new Date(u.created_date);
        return u.temAssinatura && dataInicio <= fimMes;
      }).reduce((acc, u) => acc + (u.valorPlano || 0), 0);
      
      data.push({
        mes: format(mesRef, 'MMM/yy', { locale: ptBR }),
        assinantes: assinantesAtivos,
        receita: receitaMes
      });
    }
    return data;
  }, [users]);

  const mapData = useMemo(() => {
    const assinantesMap = {};
    const receitaMap = {};
    filteredUsers.forEach(u => {
      const estado = u.estado || 'N/I';
      if (estado === 'N/I') return;
      assinantesMap[estado] = (assinantesMap[estado] || 0) + 1;
      if (u.temAssinatura) {
        receitaMap[estado] = (receitaMap[estado] || 0) + (u.valorPlano || 0);
      }
    });
    const allEstados = new Set([...Object.keys(assinantesMap), ...Object.keys(receitaMap)]);
    return Array.from(allEstados).map(sigla => ({
      estado: sigla,
      assinantes: assinantesMap[sigla] || 0,
      receita: receitaMap[sigla] || 0
    })).filter(d => d.assinantes > 0);
  }, [filteredUsers]);

  const comparativoMensal = useMemo(() => {
    const mesAtual = new Date();
    const mesPassado = subMonths(mesAtual, 1);
    
    const dadosMesAtual = {
      novos: users.filter(u => {
        const date = new Date(u.created_date);
        return date >= startOfMonth(mesAtual);
      }).length,
      receita: users.filter(u => {
        const date = new Date(u.created_date);
        return u.temAssinatura && date >= startOfMonth(mesAtual);
      }).reduce((acc, u) => acc + (u.valorPlano || 0), 0)
    };
    
    const dadosMesPassado = {
      novos: users.filter(u => {
        const date = new Date(u.created_date);
        return date >= startOfMonth(mesPassado) && date < startOfMonth(mesAtual);
      }).length,
      receita: users.filter(u => {
        const date = new Date(u.created_date);
        return u.temAssinatura && date >= startOfMonth(mesPassado) && date < startOfMonth(mesAtual);
      }).reduce((acc, u) => acc + (u.valorPlano || 0), 0)
    };
    
    return [
      { 
        nome: format(mesPassado, 'MMMM', { locale: ptBR }), 
        novos: dadosMesPassado.novos,
        receita: dadosMesPassado.receita
      },
      { 
        nome: format(mesAtual, 'MMMM', { locale: ptBR }), 
        novos: dadosMesAtual.novos,
        receita: dadosMesAtual.receita
      }
    ];
  }, [users]);

  const cadastrosPorMes = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const mesRef = subMonths(new Date(), i);
      const inicioMes = startOfMonth(mesRef);
      const fimMes = endOfMonth(mesRef);
      const novos = users.filter(u => {
        const d = new Date(u.created_date);
        return d >= inicioMes && d <= fimMes;
      }).length;
      const acumulado = users.filter(u => new Date(u.created_date) <= fimMes).length;
      data.push({
        mes: format(mesRef, 'MMM/yy', { locale: ptBR }),
        novos,
        acumulado
      });
    }
    return data;
  }, [users]);

  const cadastrosPorEstado = useMemo(() => {
    const distribution = {};
    filteredUsers.forEach(u => {
      const estado = u.estado || 'N/I';
      distribution[estado] = (distribution[estado] || 0) + 1;
    });
    const colors = ['#2e6299', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], idx) => ({
        name: ESTADOS_BRASIL[name] || name,
        sigla: name,
        value,
        color: colors[idx % colors.length]
      }));
  }, [filteredUsers]);

  const topCidades = useMemo(() => {
    const cidadeMap = {};
    filteredUsers.forEach(u => {
      const cidade = u.cidade || 'N/I';
      if (cidade === 'N/I' || cidade === '') return;
      cidadeMap[cidade] = (cidadeMap[cidade] || 0) + 1;
    });
    return Object.entries(cidadeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cidade, total]) => ({ cidade, total }));
  }, [filteredUsers]);

  const mapDataCadastros = useMemo(() => {
    const cadastrosMap = {};
    filteredUsers.forEach(u => {
      const estado = u.estado || 'N/I';
      if (estado === 'N/I') return;
      cadastrosMap[estado] = (cadastrosMap[estado] || 0) + 1;
    });
    return Object.entries(cadastrosMap)
      .map(([sigla, total]) => ({ estado: sigla, cadastros: total }))
      .filter(d => d.cadastros > 0);
  }, [filteredUsers]);

  const comparativoCadastros = useMemo(() => {
    const mesAtual = new Date();
    const mesPassado = subMonths(mesAtual, 1);
    const novosMesAtual = users.filter(u => new Date(u.created_date) >= startOfMonth(mesAtual)).length;
    const novosMesPassado = users.filter(u => {
      const d = new Date(u.created_date);
      return d >= startOfMonth(mesPassado) && d < startOfMonth(mesAtual);
    }).length;
    return [
      { nome: format(mesPassado, 'MMMM', { locale: ptBR }), novos: novosMesPassado },
      { nome: format(mesAtual, 'MMMM', { locale: ptBR }), novos: novosMesAtual }
    ];
  }, [users]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Dashboard" 
          description="Visao geral e analise de dados"
          icon={LayoutDashboard}
        />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700">Erro ao carregar dados</h3>
          <p className="text-red-600 mt-2">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4 bg-red-600 hover:bg-red-700">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <PageHeader 
            title="Dashboard" 
            description={plansEnabled ? "Visao geral e analise de receitas e assinantes" : "Visao geral de cadastros e distribuicao"}
            icon={LayoutDashboard}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            disabled={isLoading}
            variant="outline"
            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-all duration-300 rounded-lg px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button 
            onClick={handleExportPDF}
            disabled={isExporting || isLoading}
            variant="outline"
            className="border-[#2e6299] text-[#2e6299] hover:bg-[#2e6299]/10 transition-all duration-300 rounded-lg px-4"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {totvsHealth && totvsHealth.status !== 'ok' && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">API TOTVS indisponivel</p>
              <p className="text-amber-700 text-sm mt-0.5">{totvsHealth.message}</p>
              {totvsHealth.status === 'password_expired' && (
                <p className="text-amber-600 text-xs mt-2 bg-amber-100/50 rounded-lg px-3 py-1.5 inline-block">
                  A sincronizacao ficara pausada ate que a senha seja renovada no sistema TOTVS.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={dashboardRef} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2e6299]/10 flex items-center justify-center">
              <Filter className="w-5 h-5 text-[#2e6299]" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-[#2e6299]">Filtros</h3>
              <p className="text-xs text-slate-500">
                {estadoFilter !== 'todos' ? `Estado: ${estadoFilter}` : 'Todos os estados'}
                {plansEnabled ? ` | ${statusFilter !== 'todos' ? `Status: ${statusFilter === 'ativa' ? 'Com assinatura' : 'Sem assinatura'}` : 'Todos os status'}` : ''}
                {` | Periodo: ${dateFilter === 'mes_atual' ? 'Mes atual' : dateFilter === 'personalizado' ? 'Personalizado' : dateFilter === 'todos' ? 'Todos' : `${dateFilter} dias`}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#2e6299]" />
            ) : (
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {filteredUsers.length} {plansEnabled ? 'assinante(s)' : 'cadastro(s)'}
              </span>
            )}
            {filtersExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {filtersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-6 pb-6 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Buscar</label>
                    <Input
                      placeholder="Nome, email, CPF ou cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 rounded-xl border-slate-200"
                    />
                  </div>
                  {plansEnabled && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="ativa">Com assinatura</SelectItem>
                        <SelectItem value="inativa">Sem assinatura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Estado</label>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os estados</SelectItem>
                        {estados.map(estado => (
                          <SelectItem key={estado} value={estado}>
                            {estado} - {ESTADOS_BRASIL[estado] || estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Periodo</label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mes_atual">Mes atual</SelectItem>
                        <SelectItem value="7">Ultimos 7 dias</SelectItem>
                        <SelectItem value="30">Ultimos 30 dias</SelectItem>
                        <SelectItem value="90">Ultimos 90 dias</SelectItem>
                        <SelectItem value="todos">Todos os periodos</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {dateFilter === 'personalizado' && (
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-2 block">Data Inicio</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-10 w-full rounded-xl justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {customStartDate ? format(customStartDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={customStartDate}
                              onSelect={setCustomStartDate}
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-2 block">Data Fim</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-10 w-full rounded-xl justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {customEndDate ? format(customEndDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={customEndDate}
                              onSelect={setCustomEndDate}
                              locale={ptBR}
                              disabled={(date) => customStartDate ? date < customStartDate : false}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      setDateFilter('mes_atual');
                      setCustomStartDate(null);
                      setCustomEndDate(null);
                      setEstadoFilter('todos');
                      setStatusFilter('todos');
                      setSearchTerm('');
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9 border-slate-300 hover:bg-slate-50"
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    size="sm"
                    className="rounded-xl h-9 bg-[#2e6299] hover:bg-[#2e6299]/90"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <Loader2 className="w-12 h-12 text-[#2e6299] mx-auto animate-spin" />
          <p className="text-slate-500 mt-4">Carregando dados...</p>
        </div>
      ) : (
        <>
          {plansEnabled ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <ModernStatsCard
              title="Total Cadastros"
              value={stats.total}
              icon={Users}
              color="blue"
              subtitle={`em ${stats.totalEstados} estados`}
              trend={stats.crescimento}
            />
            <ModernStatsCard
              title="Com Assinatura"
              value={stats.ativos}
              icon={CheckCircle2}
              subtitle={stats.total > 0 ? `${Math.round((stats.ativos / stats.total) * 100)}% do total` : '0% do total'}
              showCircle={true}
              circleValue={stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0}
            />
            <ModernStatsCard
              title="Receita Total"
              value={`R$ ${stats.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="green"
              subtitle="soma dos assinantes ativos"
              trend={stats.crescimento > 0 ? stats.crescimento : undefined}
            />
            <ModernStatsCard
              title="Ticket Medio"
              value={`R$ ${stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              color="purple"
              subtitle="valor medio por assinante"
            />
            <ModernStatsCard
              title="Crescimento"
              value={`${stats.crescimento >= 0 ? '+' : ''}${stats.crescimento}%`}
              icon={Activity}
              color={stats.crescimento >= 0 ? 'green' : 'red'}
              subtitle="vs. mes anterior"
            />
          </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernStatsCard
              title="Total Cadastros"
              value={stats.total}
              icon={Users}
              color="blue"
              subtitle={`em ${stats.totalEstados} estados`}
              trend={stats.crescimento}
            />
            <ModernStatsCard
              title="Novos este Mes"
              value={comparativoCadastros[1]?.novos || 0}
              icon={TrendingUp}
              color="green"
              subtitle={`${comparativoCadastros[0]?.novos || 0} no mes anterior`}
            />
            <ModernStatsCard
              title="Estados Ativos"
              value={stats.totalEstados}
              icon={MapPin}
              color="purple"
              subtitle={`de 27 estados`}
            />
            <ModernStatsCard
              title="Crescimento"
              value={`${stats.crescimento >= 0 ? '+' : ''}${stats.crescimento}%`}
              icon={Activity}
              color={stats.crescimento >= 0 ? 'green' : 'red'}
              subtitle="vs. mes anterior"
            />
          </div>
          )}

          {plansEnabled && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Receita x Assinantes por Mes
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={receitaPorMes}>
                  <XAxis dataKey="mes" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '11px' }} tickFormatter={(v) => `R$ ${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString('pt-BR')}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value, name) => [
                      name === 'receita' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value,
                      name === 'receita' ? 'Receita' : 'Assinantes'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="assinantes" name="Assinantes" fill="#2e6299" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="receita" name="Receita" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Comparativo Mensal
              </h3>
              <div className="space-y-6">
                {comparativoMensal.map((mes, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${idx === 1 ? 'bg-[#2e6299]/5 border border-[#2e6299]/20' : 'bg-slate-50'}`}>
                    <h4 className="font-semibold text-slate-700 capitalize mb-3">{mes.nome}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Novos Assinantes</p>
                        <p className="text-2xl font-bold text-[#2e6299]">{mes.novos}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Receita</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          R$ {mes.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {comparativoMensal.length === 2 && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-500">Variacao Assinantes</p>
                        <p className={`text-lg font-bold ${comparativoMensal[1].novos >= comparativoMensal[0].novos ? 'text-emerald-600' : 'text-red-600'}`}>
                          {comparativoMensal[0].novos > 0 
                            ? `${comparativoMensal[1].novos >= comparativoMensal[0].novos ? '+' : ''}${Math.round(((comparativoMensal[1].novos - comparativoMensal[0].novos) / comparativoMensal[0].novos) * 100)}%`
                            : comparativoMensal[1].novos > 0 ? '+100%' : '0%'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Variacao Receita</p>
                        <p className={`text-lg font-bold ${comparativoMensal[1].receita >= comparativoMensal[0].receita ? 'text-emerald-600' : 'text-red-600'}`}>
                          {comparativoMensal[0].receita > 0 
                            ? `${comparativoMensal[1].receita >= comparativoMensal[0].receita ? '+' : ''}${Math.round(((comparativoMensal[1].receita - comparativoMensal[0].receita) / comparativoMensal[0].receita) * 100)}%`
                            : comparativoMensal[1].receita > 0 ? '+100%' : '0%'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {plansEnabled && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assinantes por Estado
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={assinantesPorEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {assinantesPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Assinantes']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Receita por Estado (Top 10)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={receitaPorEstado} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '11px' }} tickFormatter={(v) => `R$ ${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString('pt-BR')}`} />
                  <YAxis type="category" dataKey="estado" stroke="#94a3b8" style={{ fontSize: '11px' }} width={120} />
                  <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']} />
                  <Bar dataKey="receita" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}

          {plansEnabled && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Mapa de Assinantes e Receita por Estado
            </h3>
            <BrazilMapDashboard data={mapData} />
          </div>
          )}

          {!plansEnabled && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Novos Cadastros x Acumulado por Mes
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={cadastrosPorMes}>
                  <XAxis dataKey="mes" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value, name) => [value, name === 'novos' ? 'Novos Cadastros' : 'Acumulado']}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="novos" name="Novos Cadastros" fill="#2e6299" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="acumulado" name="Acumulado" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Comparativo Mensal
              </h3>
              <div className="space-y-6">
                {comparativoCadastros.map((mes, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${idx === 1 ? 'bg-[#2e6299]/5 border border-[#2e6299]/20' : 'bg-slate-50'}`}>
                    <h4 className="font-semibold text-slate-700 capitalize mb-3">{mes.nome}</h4>
                    <div>
                      <p className="text-xs text-slate-500">Novos Cadastros</p>
                      <p className="text-2xl font-bold text-[#2e6299]">{mes.novos}</p>
                    </div>
                  </div>
                ))}
                {comparativoCadastros.length === 2 && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Variacao Cadastros</p>
                      <p className={`text-lg font-bold ${comparativoCadastros[1].novos >= comparativoCadastros[0].novos ? 'text-emerald-600' : 'text-red-600'}`}>
                        {comparativoCadastros[0].novos > 0
                          ? `${comparativoCadastros[1].novos >= comparativoCadastros[0].novos ? '+' : ''}${Math.round(((comparativoCadastros[1].novos - comparativoCadastros[0].novos) / comparativoCadastros[0].novos) * 100)}%`
                          : comparativoCadastros[1].novos > 0 ? '+100%' : '0%'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {!plansEnabled && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Cadastros por Estado
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={cadastrosPorEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {cadastrosPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Cadastros']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Top Cidades
              </h3>
              {topCidades.length > 0 ? (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {topCidades.map((item, idx) => (
                  <div key={item.cidade} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-[#2e6299] text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{item.cidade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#2e6299]">{item.total}</p>
                      <p className="text-xs text-slate-400">cadastro{item.total !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
              <div className="flex items-center justify-center h-[280px] text-slate-400">
                Nenhuma cidade cadastrada
              </div>
              )}
            </div>
          </div>
          )}

          {!plansEnabled && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-[#2e6299] mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Mapa de Cadastros por Estado
            </h3>
            <BrazilMapDashboard data={mapDataCadastros} labelKey="cadastros" labelSingular="cadastro" labelPlural="cadastros" showReceita={false} />
          </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
