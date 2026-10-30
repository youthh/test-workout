'use client';
import { useState, useEffect } from 'react';
import ProgramWizard from './ProgramWizard';
import ProgramEditor from './ProgramEditor';
import ProgramLibrary from './ProgramLibrary';
import ProgramPrint from './ProgramPrint';
import { downloadText } from './download';
import {
  listPrograms, saveProgram, createProgram, duplicateProgram, getCoachName,
  exportProgramJSON, programFileName, programToText,
  type SavedProgram, type ClientInfo,
} from '../../data/programStore';
import type { ProgramConfig } from '../../data/programBuilder';

type View = 'library' | 'wizard' | 'editor';

function timeLabel(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ProgramBuilderScreen({ onBack, onToast }: { onBack: () => void; onToast: (m: string) => void }) {
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [view, setView] = useState<View>('library');
  const [current, setCurrent] = useState<SavedProgram | null>(null);

  useEffect(() => {
    const list = listPrograms();
    setPrograms(list);
    if (!list.length) setView('wizard');
  }, []);

  function refresh() {
    setPrograms(listPrograms());
  }

  function show(v: View) {
    setView(v);
    window.scrollTo({ top: 0 });
  }

  function open(p: SavedProgram) {
    setCurrent(p);
    show('editor');
  }

  function create(cfg: ProgramConfig, client: ClientInfo) {
    const p = saveProgram(createProgram(cfg, client, getCoachName()));
    refresh();
    open(p);
    onToast('Програму створено і збережено');
  }

  function change(p: SavedProgram) {
    setCurrent(saveProgram(p));
  }

  function back() {
    if (view === 'library' || (view === 'wizard' && !programs.length)) { onBack(); return; }
    refresh();
    show('library');
  }

  function printProgram() {
    document.body.classList.add('print-program');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-program'), { once: true });
    window.print();
  }

  async function copyText(p: SavedProgram) {
    try {
      await navigator.clipboard.writeText(programToText(p));
      onToast('Програму скопійовано текстом');
    } catch {
      onToast('Не вдалося скопіювати: браузер заблокував буфер обміну');
    }
  }

  function duplicate(p: SavedProgram) {
    const copy = duplicateProgram(p);
    refresh();
    open(copy);
    onToast('Створено копію програми');
  }

  return (
    <div className="container pb-screen">
      <div className="ps-bar">
        <button className="back-btn" onClick={back}>
          {view === 'library' || (view === 'wizard' && !programs.length) ? '← Назад' : '← Мої програми'}
        </button>
        <span className="ps-bar-spacer" />
        {view === 'editor' && current && <span className="ps-status" aria-live="polite">Збережено о {timeLabel(current.updatedAt)}</span>}
      </div>

      {view === 'library' && (
        <ProgramLibrary
          programs={programs}
          onOpen={id => { const p = programs.find(x => x.id === id); if (p) open(p); }}
          onCreate={() => show('wizard')}
          onImported={p => { refresh(); open(p); }}
          onChanged={refresh}
          onToast={onToast}
        />
      )}

      {view === 'wizard' && <ProgramWizard onCreate={create} />}

      {view === 'editor' && current && (
        <>
          <div className="ps-actions">
            <button className="btn-primary" onClick={printProgram}>Друк / PDF</button>
            <button className="btn-secondary" onClick={() => copyText(current)}>Скопіювати текстом</button>
            <button className="btn-secondary" onClick={() => downloadText(programFileName(current), exportProgramJSON(current))}>Зберегти файл</button>
            <button className="btn-secondary" onClick={() => duplicate(current)}>Дублювати</button>
          </div>
          <ProgramEditor program={current} onChange={change} />
          <ProgramPrint program={current} />
        </>
      )}
    </div>
  );
}
