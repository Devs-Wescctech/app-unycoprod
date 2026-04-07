import { UnycoLogo } from './LPHeader';
import { Facebook, Twitter, Instagram, Phone, Mail, MapPin } from 'lucide-react';

export default function LPFooter() {
  return (
    <footer className="bg-[#0b1c3f] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <UnycoLogo width={100} height={28} />
            <p className="text-gray-400 text-sm mt-4 leading-relaxed">
              Uma empresa do Grupo Coobrastur. Tarifas exclusivas para membros em todo o Brasil.
            </p>
            <div className="flex gap-2 mt-5">
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105">
                <Facebook className="w-4 h-4 text-gray-400" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105">
                <Twitter className="w-4 h-4 text-gray-400" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105">
                <Instagram className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Sobre Nós</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Quem somos</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Termos de uso</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Política de privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Membro</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Área do membro</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Meus favoritos</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Minhas reservas</a></li>
            </ul>
            <h4 className="font-semibold text-sm mt-6 mb-3 text-white">Horário</h4>
            <p className="text-sm text-gray-400">Seg a Sex: 08h às 18h</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-gray-400">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                (49) 3631-0900
              </li>
              <li className="flex items-center gap-2.5 text-gray-400">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                WhatsApp: (49) 99158-0035
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href="mailto:atendimento@unyco.com.br" className="text-gray-400 hover:text-white transition-colors">
                  atendimento@unyco.com.br
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href="mailto:Unyco_club@unycoclub.com.br" className="text-gray-400 hover:text-white transition-colors">
                  Unyco_club@unycoclub.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} unyco. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Termos</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
