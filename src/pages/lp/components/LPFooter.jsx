import { UnycoLogo } from './LPHeader';
import { Facebook, Instagram, MessageCircle, ExternalLink } from 'lucide-react';

export default function LPFooter() {
  return (
    <footer className="bg-[#0b1c3f] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          <div>
            <UnycoLogo width={110} height={30} />
            <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-xs">
              Uma empresa do{' '}
              <a
                href="https://www.coobrastur.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 transition-colors"
              >
                Grupo Coobrastur
                <ExternalLink className="w-3 h-3" />
              </a>
              . Tarifas exclusivas em todo o Brasil.
            </p>
            <div className="flex gap-2 mt-5">
              <a href="https://www.facebook.com/coobrastur" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105">
                <Facebook className="w-4 h-4 text-gray-400" />
              </a>
              <a href="https://www.instagram.com/coobrastur" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105">
                <Instagram className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Institucional</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.coobrastur.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  Grupo Coobrastur
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Termos de uso</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Política de privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Atendimento</h4>
            <a
              href="https://wa.me/5554994576992"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/20 text-emerald-300 hover:text-emerald-200 text-sm font-medium transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp: (54) 9457-6992
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} unyco. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
