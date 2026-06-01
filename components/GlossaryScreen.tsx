'use client';
import { useState, useMemo } from 'react';
import { GLOSSARY } from '../data/glossary';

interface GlossaryScreenProps {
  onBack: () => void;
}

export default function GlossaryScreen({ onBack }: GlossaryScreenProps) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');

  const categories = useMemo(() => Array.from(new Set(GLOSSARY.map(g => g.cat))), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return GLOSSARY.filter(g => {
      const matchCat = !cat || g.cat === cat;
      const matchSearch = !q || g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, cat]);

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Назад</button>
          <div className="quiz-title">Глосарій</div>
          <div className="quiz-counter"><b>{filtered.length}</b><span> термінів</span></div>
        </div>

        <div className="gloss-search-row">
          <input
            id="gloss-search"
            type="text"
            placeholder="Пошук терміну..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            id="gloss-cat"
            value={cat}
            onChange={e => setCat(e.target.value)}
          >
            <option value="">Усі категорії</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          {filtered.map((g, i) => (
            <div key={i} className="gloss-item">
              <div className="gloss-term">{g.term}</div>
              <div className="gloss-def">{g.def}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: 'var(--text-mute)', textAlign: 'center', padding: '40px 0' }}>
              Нічого не знайдено
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
