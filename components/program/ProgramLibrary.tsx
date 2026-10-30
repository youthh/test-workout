'use client';
import { useRef } from 'react';
import { GOALS, SPLITS, INJURIES } from '../../data/programBuilder';
import {
  saveProgram, deleteProgram, duplicateProgram, exportProgramJSON, parseProgramJSON, programFileName,
  type SavedProgram,
} from '../../data/programStore';
import { downloadText } from './download';

interface ProgramLibraryProps {
  programs: SavedProgram[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onImported: (p: SavedProgram) => void;
  onChanged: () => void;
  onToast: (m: string) => void;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export default function ProgramLibrary({ programs, onOpen, onCreate, onImported, onChanged, onToast }: ProgramLibraryProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const saved = saveProgram(parseProgramJSON(await file.text()));
      onImported(saved);
      onToast('Програму імпортовано');
    } catch (err) {
      onToast(err instanceof Error && !(err instanceof SyntaxError) ? err.message : 'Не вдалося прочитати файл — це не JSON програми');
    }
  }

  function act(e: React.MouseEvent, fn: () => void) {
    e.stopPropagation();
    fn();
  }

  return (
    <div className="pl-wrap">
      <div className="pl-head">
        <h1 className="pl-title">Мої програми</h1>
        <div className="pl-head-actions">
          <button className="btn-primary pl-btn" onClick={onCreate}>Нова програма</button>
          <button className="btn-secondary pl-btn" onClick={() => fileRef.current?.click()}>Імпортувати файл</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
        </div>
      </div>

      {programs.length === 0 ? (
        <div className="pl-empty">
          <p>Тут зберігатимуться програми твоїх клієнтів.</p>
          <button className="btn-primary pl-btn" onClick={onCreate}>Створити першу програму</button>
        </div>
      ) : (
        <ul className="pl-list">
          {programs.map(p => (
            <li key={p.id} className="pl-card" onClick={() => onOpen(p.id)}>
              <div className="pl-info">
                <h2 className="pl-card-title">{p.title}</h2>
                {p.client.name && <p className="pl-client">{p.client.name}</p>}
                <p className="pl-sub">
                  {GOALS[p.cfg.goal].label}, {p.days.length} дн./тиж., {SPLITS[p.cfg.split].label}
                </p>
                {p.client.injuries.length > 0 && (
                  <div className="pl-chips">
                    {p.client.injuries.map(i => <span key={i} className="pl-chip">{INJURIES[i].label}</span>)}
                  </div>
                )}
                <p className="pl-date">Оновлено {formatDate(p.updatedAt)}</p>
              </div>
              <div className="pl-actions">
                <button className="pl-act pl-act-main" onClick={e => act(e, () => onOpen(p.id))}>Відкрити</button>
                <button className="pl-act" onClick={e => act(e, () => { duplicateProgram(p); onChanged(); onToast('Копію створено'); })}>Дублювати</button>
                <button className="pl-act" onClick={e => act(e, () => downloadText(programFileName(p), exportProgramJSON(p)))}>Експорт</button>
                <button
                  className="pl-act pl-act-danger"
                  onClick={e => act(e, () => {
                    if (!window.confirm(`Видалити програму «${p.title}»?`)) return;
                    deleteProgram(p.id);
                    onChanged();
                    onToast('Програму видалено');
                  })}
                >
                  Видалити
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
