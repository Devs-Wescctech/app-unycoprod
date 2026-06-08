import { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, Loader2 } from 'lucide-react';

const CATEGORY_ORDER = ['Associação', 'Reservas', 'Economia', 'Praticidade', 'Plataforma', 'Pós-venda', 'Categorias', 'Valores'];

export default function FAQSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/faq')
      .then(r => r.json())
      .then(d => { if (d.ok) setItems(d.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Todas', ...CATEGORY_ORDER.filter(c => items.some(i => i.category === c))];

  const filtered = items.filter(item => {
    const matchCat = activeCategory === 'Todas' || item.category === activeCategory;
    const matchSearch = !search || item.question.toLowerCase().includes(search.toLowerCase()) || item.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <section data-section="faq" className="w-full bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            Dúvidas Frequentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Perguntas <span className="text-blue-600">Frequentes</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">Encontre respostas para as principais dúvidas sobre a Unyco.</p>
        </div>

        <div className="relative mb-8">
          <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pergunta..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOpenId(null); }}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>

        {!search && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenId(null); }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Nenhuma pergunta encontrada.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
              >
                <button
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-block mt-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      {item.category}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{item.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${openId === item.id ? 'rotate-180' : ''}`}
                  />
                </button>
                {openId === item.id && (
                  <div className="px-6 pb-5 pt-1 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
