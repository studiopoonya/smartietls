import { LayoutDashboard, PenLine, Mic2, BookOpen, Headphones, FlaskConical, BookMarked, TrendingUp, Lightbulb, GraduationCap, Map, RotateCcw, Library, SpellCheck } from 'lucide-react';

// Shared by the desktop sidebar and the phone menu, so both always show the same order.
// Grouped by what the learner is doing: checking progress, learning a skill, practising, or reading up.
export const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { label: 'LEARN', isHeader: true },
  { to: '/learn', end: true, icon: Map, label: 'Learning Path' },
  { to: '/learn/writing', icon: PenLine, label: 'Writing' },
  { to: '/learn/speaking', icon: Mic2, label: 'Speaking' },
  { to: '/learn/reading', icon: BookOpen, label: 'Reading' },
  { to: '/learn/listening', icon: Headphones, label: 'Listening' },
  { label: 'PRACTICE', isHeader: true },
  { to: '/grammar', icon: SpellCheck, label: 'Grammar Lab' },
  { to: '/vocabulary', icon: BookMarked, label: 'Vocabulary' },
  { to: '/error-bank', icon: RotateCcw, label: 'Error Bank' },
  { to: '/mock-test', icon: FlaskConical, label: 'Exam Simulation' },
  { label: 'RESOURCES', isHeader: true },
  { to: '/journals', icon: Library, label: 'Journals' },
  { to: '/tips', icon: Lightbulb, label: 'Tips & Tricks' },
  { to: '/scholarships', icon: GraduationCap, label: 'Scholarships' },
];
