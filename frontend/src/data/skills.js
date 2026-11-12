import { BookOpen, Headphones, PenLine, Mic2, Compass } from 'lucide-react';

export const SKILLS = {
  foundation: { label: 'Foundation', colorHex: '#CF2873', icon: Compass, description: 'Find your baseline, then see what your score means.' },
  reading: { label: 'Reading', colorHex: '#0A7F5C', icon: BookOpen, description: 'Speed and logic for academic passages.' },
  listening: { label: 'Listening', colorHex: '#AE5408', icon: Headphones, description: 'Beat distractors and follow academic lectures.' },
  writing: { label: 'Writing', colorHex: '#6A35E8', icon: PenLine, description: 'Build every response paragraph by paragraph.' },
  speaking: { label: 'Speaking', colorHex: '#0A7A9E', icon: Mic2, description: 'Clear structure and spontaneous answers.' },
};

export const LOCK_MESSAGES = {
  diagnostic: 'Finish the placement diagnostic to unlock',
  rewrite: 'Complete your Rewrite Challenge first',
  previous_module: 'Finish the previous module first',
  previous_lesson: 'Complete the previous lesson to unlock',
};

export const BASELINE_SKILLS = ['listening', 'reading', 'writing', 'speaking'];

export const TARGET_BANDS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

export function allLessons(snapshot) {
  return (snapshot?.modules ?? []).flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title, skill: m.skill, phase: m.phase, optional: m.optional })));
}

export function nextAvailableLesson(snapshot) {
  const available = allLessons(snapshot).filter(l => l.status === 'available');
  return available.find(l => !l.optional) ?? available[0] ?? null;
}
