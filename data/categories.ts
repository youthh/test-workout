export interface Category { key: string; label: string; color: string; ids: string[] }

export const CATEGORIES: Category[] = [
  { key: 'anatomy', label: 'Анатомія',    color: '#ff7b00', ids: ['osteology', 'myology', 'muscle-functions'] },
  { key: 'bio',     label: 'Біомеханіка', color: '#4a9eff', ids: ['planes', 'spine', 'arms', 'legs', 'chest', 'shoulders', 'back', 'core'] },
  { key: 'method',  label: 'Методика',    color: '#3ecf8e', ids: ['movement-patterns', 'pyramid', 'training-programming'] },
  { key: 'other',   label: 'Інше',        color: '#a78bfa', ids: ['psych', 'nutrition'] },
];

const FALLBACK: Category = { key: 'other', label: 'Інше', color: '#a78bfa', ids: [] };

export function categoryOf(topicId: string): Category {
  return CATEGORIES.find(c => c.ids.includes(topicId)) ?? FALLBACK;
}
