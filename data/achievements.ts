export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS_DATA: Achievement[] = [
  { id: 'first_quiz',    name: 'Перша кров',    desc: 'Пройти перший тест',                  icon: '🇺🇦' },
  { id: 'first_perfect', name: 'Бездоганний',   desc: '100% по будь-якій темі',              icon: '⭐' },
  { id: 'exam_pass',     name: 'Тренер',         desc: 'Здати фінальний іспит (≥50%)',        icon: '💪' },
  { id: 'exam_perfect',  name: 'Легенда',        desc: '100% на фінальному іспиті',           icon: '👑' },
  { id: 'streak_3',      name: 'Стрик 3',        desc: '3 дні поспіль на сайті',             icon: '🔥' },
  { id: 'streak_7',      name: 'Стрик 7',        desc: '7 днів поспіль на сайті',            icon: '🔥' },
  { id: 'streak_30',     name: 'Залізна воля',   desc: '30 днів поспіль на сайті',           icon: '🏆' },
  { id: 'hundred',       name: 'Сотня',          desc: 'Відповісти на 100 питань',            icon: '💯' },
  { id: 'thousand',      name: 'Тисячник',       desc: '1000 питань',                         icon: '🥇' },
  { id: 'combo_5',       name: 'Combo x5',       desc: '5 правильних відповідей поспіль',    icon: '⚡' },
  { id: 'combo_10',      name: 'Combo x10',      desc: '10 правильних поспіль',               icon: '💥' },
  { id: 'all_topics',    name: 'Універсал',      desc: 'Пройти усі теми',                     icon: '🌍' },
  { id: 'no_mistakes',   name: 'Без жодної',     desc: 'Пройти тест на 100%',                icon: '🎯' },
  { id: 'night_owl',     name: 'Сова',           desc: 'Пройти тест уночі (00:00–6:00)',     icon: '🦉' },
  { id: 'early_bird',    name: 'Жайворонок',     desc: 'Пройти тест рано вранці (5–8)',      icon: '🌅' },
];
