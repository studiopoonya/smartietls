import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Globe, Calendar, ExternalLink, DollarSign, BookOpen, Filter } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import GlowCard from '../components/common/GlowCard';

const SCHOLARSHIPS = [
  /* ── Indonesia ── */
  {
    name: 'LPDP', fullName: 'LPDP — Indonesia Endowment Fund',
    flag: '🇮🇩', region: 'asia', destination: 'Worldwide',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Feb–Mar & Jul–Aug each year',
    deadlineNote: 'Typically 2 batches per year. Check the official website for exact dates.',
    ielts: '6.5',
    description: 'Indonesian government scholarship for citizens to study at top universities worldwide. Covers full tuition, living allowance, airfare, and other benefits. Return service obligation applies after graduation.',
    tags: ['Indonesian Citizens Only', 'Worldwide', 'Return Obligation'],
    url: 'https://lpdp.kemenkeu.go.id',
  },

  /* ── UK ── */
  {
    name: 'Chevening', fullName: 'Chevening Scholarship (UK Government)',
    flag: '🇬🇧', region: 'uk', destination: 'United Kingdom',
    level: ['master'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Opens: Sep | Closes: 5 November',
    deadlineNote: 'Final results are usually announced in June of the following year.',
    ielts: '6.5',
    description: "The UK Government's flagship scholarship for future global leaders. Covers full tuition, living allowance, flights, and visa. Requires at least 2 years of work experience.",
    tags: ['Leadership Focus', 'Work Experience Required', 'Networking Events'],
    url: 'https://www.chevening.org',
  },
  {
    name: 'Gates Cambridge', fullName: 'Gates Cambridge Scholarship',
    flag: '🇬🇧', region: 'uk', destination: 'Cambridge, UK',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Non-US: October | US Citizens: December',
    deadlineNote: 'One of the most competitive scholarships in the world — ~90 recipients per year globally.',
    ielts: '7.5',
    description: 'Prestigious scholarship funded by the Bill & Melinda Gates Foundation for study at the University of Cambridge. Open to all subjects. Extremely competitive.',
    tags: ['Highly Competitive', 'Cambridge Only', 'Gates Foundation'],
    url: 'https://www.gatescambridge.org',
  },
  {
    name: 'Commonwealth', fullName: 'Commonwealth Scholarship (UK)',
    flag: '🇬🇧', region: 'uk', destination: 'United Kingdom',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Closes: October–November',
    deadlineNote: 'Open to citizens of Commonwealth countries, including Indonesia.',
    ielts: '6.0',
    description: 'UK government scholarship for Commonwealth country citizens. Covers tuition, living allowance, airfare, and health insurance. Focused on development impact in home countries.',
    tags: ['Commonwealth Countries', 'Development Focus', 'Full Cover'],
    url: 'https://cscuk.fcdo.gov.uk/scholarships',
  },
  {
    name: 'Rhodes', fullName: 'Rhodes Scholarship (Oxford)',
    flag: '🇬🇧', region: 'uk', destination: 'Oxford, UK',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Closes: August–October (varies by country)',
    deadlineNote: 'The world\'s oldest international graduate scholarship, established in 1902.',
    ielts: '7.5',
    description: 'The most prestigious scholarship in the world for study at the University of Oxford. Selection based on academics, leadership, and character. Available for 64+ countries.',
    tags: ['Most Prestigious', 'Oxford Only', 'Character & Academics'],
    url: 'https://www.rhodeshouse.ox.ac.uk',
  },

  /* ── Americas ── */
  {
    name: 'Fulbright', fullName: 'Fulbright Foreign Student Program',
    flag: '🇺🇸', region: 'usa', destination: 'United States',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Indonesia: Closes February',
    deadlineNote: 'Deadline varies by country. Indonesia applicants typically close in February.',
    ielts: '7.0',
    description: 'Prestigious US government scholarship for outstanding students and researchers. Covers tuition, living costs, flights, and health insurance. Highly competitive worldwide.',
    tags: ['Highly Prestigious', 'Cultural Exchange', 'Research Allowed'],
    url: 'https://foreign.fulbrightonline.org',
  },
  {
    name: 'Vanier CGS', fullName: 'Vanier Canada Graduate Scholarship',
    flag: '🇨🇦', region: 'usa', destination: 'Canada',
    level: ['phd'], amount: 'CAD 50,000/year', amountType: 'full',
    deadline: 'Closes: October–November',
    deadlineNote: 'PhD only at Canadian universities. Very competitive — strong research record required.',
    ielts: '6.5',
    description: 'Canadian government scholarship for PhD students in health sciences, natural sciences, social sciences, or humanities. CAD 50,000/year for 3 years. Highly prestigious.',
    tags: ['PhD Only', 'Canada', 'CAD 50K/year'],
    url: 'https://vanier.gc.ca',
  },

  /* ── Europe ── */
  {
    name: 'Erasmus Mundus', fullName: 'Erasmus Mundus Joint Programme',
    flag: '🇪🇺', region: 'europe', destination: 'Multiple EU Countries',
    level: ['master', 'phd'], amount: '€1,400/month + tuition', amountType: 'full',
    deadline: 'Closes: January–February',
    deadlineNote: 'Each programme has its own deadline. Browse the official programme catalogue.',
    ielts: '6.5',
    description: 'Study across 2–3 European countries in a single joint degree programme. One of the most generous scholarships globally. Graduate with degrees from multiple universities.',
    tags: ['Multi-Country Degree', 'Joint Programme', 'Very Generous'],
    url: 'https://www.eacea.ec.europa.eu/scholarships',
  },
  {
    name: 'DAAD', fullName: 'DAAD — German Academic Exchange',
    flag: '🇩🇪', region: 'europe', destination: 'Germany',
    level: ['master', 'phd'], amount: '€934/month + tuition', amountType: 'partial',
    deadline: 'Closes: October–November',
    deadlineNote: 'Many German public universities charge no tuition fees at all.',
    ielts: '6.0',
    description: "Germany's largest academic exchange programme. Many German universities are tuition-free; DAAD covers living costs and health insurance. Strong for STEM and research fields.",
    tags: ['Tuition-Free Universities', 'Research Focus', 'STEM Friendly'],
    url: 'https://www.daad.de/en',
  },
  {
    name: 'Eiffel Excellence', fullName: 'Eiffel Excellence Scholarship (France)',
    flag: '🇫🇷', region: 'europe', destination: 'France',
    level: ['master', 'phd'], amount: '€1,181/month (Master) / €1,400/month (PhD)', amountType: 'partial',
    deadline: 'Closes: January (nominated by French university)',
    deadlineNote: 'You must be nominated by your target French university — you cannot apply directly.',
    ielts: '6.0',
    description: 'French government scholarship for top international students at leading French universities. Primarily for engineering, economics, and law. Application goes through the host university.',
    tags: ['Nominated by University', 'French Government', 'STEM & Economics'],
    url: 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence',
  },
  {
    name: 'SI Scholarship', fullName: 'Swedish Institute Scholarship (Sweden)',
    flag: '🇸🇪', region: 'europe', destination: 'Sweden',
    level: ['master'], amount: 'SEK 11,000/month + tuition', amountType: 'full',
    deadline: 'Closes: February',
    deadlineNote: 'Apply to SI after receiving a conditional admission offer from a Swedish university.',
    ielts: '6.5',
    description: 'Swedish government scholarship for students from developing countries. Covers tuition, living allowance, travel insurance, and airfare.',
    tags: ['Developing Countries', 'Sweden', 'Full Funding'],
    url: 'https://si.se/en/apply/scholarships',
  },
  {
    name: 'Stipendium Hungaricum', fullName: 'Stipendium Hungaricum (Hungary)',
    flag: '🇭🇺', region: 'europe', destination: 'Hungary',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Closes: January',
    deadlineNote: 'Apply through the sending institution in your home country (e.g. Dikti in Indonesia).',
    ielts: '5.5',
    description: 'Hungarian government scholarship covering tuition, accommodation, monthly stipend, and health insurance. Over 5,000 scholarships available per year across 28+ countries.',
    tags: ['5,000+ Quota', 'Via Home Institution', 'Full Cover'],
    url: 'https://stipendiumhungaricum.hu',
  },
  {
    name: 'Türkiye Bursları', fullName: 'Türkiye Bursları (Turkish Scholarship)',
    flag: '🇹🇷', region: 'europe', destination: 'Turkey',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Closes: February',
    deadlineNote: 'Includes a 1-year Turkish language course before the degree programme begins.',
    ielts: '5.5',
    description: 'Turkish government scholarship for international students. Covers full tuition, accommodation, monthly stipend, airfare, and health insurance. 1-year language training included.',
    tags: ['Turkish Language Training', 'Full Cover', 'Turkish Government'],
    url: 'https://turkiyeburslari.gov.tr',
  },
  {
    name: 'VLIR-UOS', fullName: 'VLIR-UOS Scholarship (Belgium)',
    flag: '🇧🇪', region: 'europe', destination: 'Belgium',
    level: ['master'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Closes: February',
    deadlineNote: 'For citizens of developing countries, including Indonesia.',
    ielts: '6.5',
    description: 'Belgian government scholarship for students from developing countries to pursue a Master\'s degree at a Belgian university. Covers tuition, living allowance, and airfare.',
    tags: ['Developing Countries', "Master's Only", 'Belgium'],
    url: 'https://www.vliruos.be/en/scholarships',
  },

  /* ── Australia / NZ ── */
  {
    name: 'Australia Awards', fullName: 'Australia Awards Scholarship',
    flag: '🇦🇺', region: 'australia', destination: 'Australia',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Indonesia: Closes 30 April',
    deadlineNote: 'Shortlist announced around August; final results in November.',
    ielts: '6.5',
    description: 'Australian government scholarship for students from developing countries. Full tuition, living allowance, return airfare, and health cover. 2-year return service obligation to home country.',
    tags: ['Developing Countries', '2-Year Return Obligation', 'DFAT Funded'],
    url: 'https://www.australiaawards.gov.au',
  },
  {
    name: 'NZ Excellence Awards', fullName: 'New Zealand Excellence Awards (ASEAN)',
    flag: '🇳🇿', region: 'australia', destination: 'New Zealand',
    level: ['master', 'phd'], amount: 'NZD 10,000 (partial)', amountType: 'partial',
    deadline: 'Closes: May',
    deadlineNote: 'Works well as a top-up alongside employer funding or LPDP.',
    ielts: '6.5',
    description: 'Partial scholarship from the New Zealand government for ASEAN students. Significantly reduces tuition costs. Best used as a supplement to other funding sources.',
    tags: ['ASEAN Students', 'Partial Funding', 'Top-Up Option'],
    url: 'https://www.newzealandnow.govt.nz',
  },

  /* ── Asia ── */
  {
    name: 'MEXT', fullName: 'MEXT — Japanese Government (Monbukagakusho)',
    flag: '🇯🇵', region: 'asia', destination: 'Japan',
    level: ['master', 'phd'], amount: '¥144,000/month + tuition', amountType: 'full',
    deadline: 'Embassy: April–June | University: December–February',
    deadlineNote: '2 application routes: via Japanese Embassy or directly through a Japanese university.',
    ielts: '5.5',
    description: 'Japanese government scholarship covering full tuition, monthly stipend, and airfare. Japanese language training included if needed. No return service obligation.',
    tags: ['Japanese Language Training', 'No Return Bond', '2 Application Routes'],
    url: 'https://www.mext.go.jp/en',
  },
  {
    name: 'KGSP', fullName: 'Korean Government Scholarship (GKS)',
    flag: '🇰🇷', region: 'asia', destination: 'South Korea',
    level: ['master', 'phd'], amount: '₩1,000,000/month + tuition', amountType: 'full',
    deadline: 'Embassy: February–March | University: May–June',
    deadlineNote: '2 application routes: via Korean Embassy or directly through a Korean university.',
    ielts: '5.5',
    description: 'Full scholarship from the Korean government. Includes 1-year Korean language training, full tuition, monthly stipend, airfare, and health insurance.',
    tags: ['1-Year Korean Course', 'Full Cover', '2 Application Routes'],
    url: 'https://www.studyinkorea.go.kr',
  },
  {
    name: 'CSC', fullName: 'Chinese Government Scholarship (CSC)',
    flag: '🇨🇳', region: 'asia', destination: 'China',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Embassy: March–April | University: January–April',
    deadlineNote: 'Thousands of quotas available — one of the largest scholarship programmes in the world.',
    ielts: '6.0',
    description: 'Chinese government scholarship with thousands of places available annually. Covers tuition, accommodation, monthly stipend, and health insurance. Many programmes taught in English.',
    tags: ['Thousands of Places', 'English Programmes Available', 'Full Cover'],
    url: 'https://www.campuschina.org',
  },
  {
    name: 'Taiwan ICDF', fullName: 'Taiwan ICDF International Scholarship',
    flag: '🇹🇼', region: 'asia', destination: 'Taiwan',
    level: ['master', 'phd'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Closes: March',
    deadlineNote: 'Available to citizens of Taiwan ICDF partner countries, including Indonesia.',
    ielts: '6.0',
    description: 'Taiwan government scholarship for students from developing countries. Covers tuition, dormitory accommodation, monthly stipend, and insurance. Many programmes taught in English.',
    tags: ['Taiwan', 'Full Cover', 'English Programmes'],
    url: 'https://icdf.org.tw/scholarship',
  },
  {
    name: 'NUS/NTU PhD', fullName: 'NUS / NTU Research Scholarship (Singapore)',
    flag: '🇸🇬', region: 'asia', destination: 'Singapore',
    level: ['phd'], amount: 'SGD 2,000+/month + tuition', amountType: 'full',
    deadline: 'Rolling: November & May',
    deadlineNote: 'Contact and secure a supervisor first before submitting a formal application.',
    ielts: '6.0',
    description: 'Top-ranked Asian universities offering competitive PhD scholarships: monthly stipend, full tuition, and world-class research facilities. Approach a potential supervisor before applying.',
    tags: ['PhD Only', 'Top Asian University', 'Contact Supervisor First'],
    url: 'https://nus.edu.sg/admissions/graduate',
  },
  {
    name: 'ADB-Japan', fullName: 'ADB-Japan Scholarship Program',
    flag: '🌏', region: 'asia', destination: 'Partner Asian Universities',
    level: ['master'], amount: 'Full Funding', amountType: 'full',
    deadline: 'Varies by institution (generally January–March)',
    deadlineNote: 'Check individual ADB partner university websites for specific deadlines.',
    ielts: '6.0',
    description: 'Asian Development Bank scholarship for citizens of ADB developing member countries. Covers tuition, allowances, and travel to ADB partner universities across Asia.',
    tags: ['ADB Member Countries', 'Development Focus', "Master's Only"],
    url: 'https://www.adb.org/work-with-us/careers/japan-scholarship-program',
  },
];

const REGIONS = [
  { id: 'all',       label: 'All Countries' },
  { id: 'uk',        label: '🇬🇧 UK' },
  { id: 'usa',       label: '🌎 Americas' },
  { id: 'europe',    label: '🇪🇺 Europe' },
  { id: 'australia', label: '🇦🇺 AUS/NZ' },
  { id: 'asia',      label: '🌏 Asia' },
];

const LEVELS = [
  { id: 'all',    label: 'All Levels' },
  { id: 'master', label: "Master's" },
  { id: 'phd',    label: 'PhD' },
];

export default function Scholarships() {
  const [region, setRegion] = useState('all');
  const [level, setLevel]   = useState('all');
  const isMobile = useIsMobile();
  const pad = isMobile ? '20px 16px' : '36px 40px';

  const filtered = SCHOLARSHIPS.filter(s =>
    (region === 'all' || s.region === region) &&
    (level  === 'all' || s.level.includes(level))
  );

  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 860 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={16} style={{ color: 'var(--accent-success)' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Scholarships</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Fully & partially funded scholarships for Master's and PhD programs worldwide</p>
      </motion.div>

      {/* Filters */}
      <div style={{ marginBottom: 20 }}>
        {/* Region filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 10 }}>
          {REGIONS.map(r => (
            <button key={r.id} onClick={() => setRegion(r.id)}
              style={{
                flexShrink: 0, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                fontFamily: 'Space Grotesk', cursor: 'pointer',
                background: region === r.id ? 'var(--accent-success)' : 'var(--bg-elevated)',
                color: region === r.id ? '#fff' : 'var(--text-secondary)',
                border: 'none', transition: 'all 0.2s',
                boxShadow: region === r.id ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
              }}>
              {r.label}
            </button>
          ))}
        </div>
        {/* Level filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          <Filter size={13} style={{ color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }} />
          {LEVELS.map(l => (
            <button key={l.id} onClick={() => setLevel(l.id)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                fontFamily: 'Space Grotesk', cursor: 'pointer',
                background: level === l.id ? 'rgba(6,182,212,0.15)' : 'transparent',
                color: level === l.id ? 'var(--accent-secondary)' : 'var(--text-muted)',
                border: `1px solid ${level === l.id ? 'rgba(6,182,212,0.4)' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}>
              {l.label}
            </button>
          ))}
          <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} scholarships
          </span>
        </div>
      </div>

      {/* Scholarship cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((s, i) => (
          <ScholarshipCard key={i} s={s} isMobile={isMobile} />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <GraduationCap size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
            <p style={{ fontSize: 14 }}>No scholarships match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScholarshipCard({ s, isMobile }) {
  const [open, setOpen] = useState(false);
  const isFull = s.amountType === 'full';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <GlowCard style={{ padding: '16px 18px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          {/* Flag */}
          <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{s.flag}</div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>{s.name}</span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
                background: isFull ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                color: isFull ? 'var(--accent-success)' : '#F59E0B',
                border: `1px solid ${isFull ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
              }}>
                {isFull ? 'Full Funding' : 'Partial'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{s.fullName}</div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: isMobile ? 10 : 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                <Globe size={11} style={{ color: 'var(--text-muted)' }} />{s.destination}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                <Calendar size={11} style={{ color: 'var(--text-muted)' }} />{s.deadline}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                <BookOpen size={11} style={{ color: 'var(--text-muted)' }} />
                {s.level.map(l => l === 'master' ? "Master's" : 'PhD').join(' / ')}
              </div>
            </div>
          </div>

          <span style={{ fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>{open ? '−' : '+'}</span>
        </div>

        {/* Expanded detail */}
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>{s.description}</p>

            {/* Deadline note */}
            {s.deadlineNote && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Calendar size={12} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: '#F59E0B', margin: 0, lineHeight: 1.6 }}>{s.deadlineNote}</p>
              </div>
            )}

            {/* Amount + IELTS row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: 10, color: 'var(--accent-success)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' }}>Amount</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Mono' }}>{s.amount}</div>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ fontSize: 10, color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' }}>IELTS Min.</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Mono' }}>{s.ielts}+</div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {s.tags.map((tag, i) => (
                <span key={i} style={{ fontSize: 11, padding: '3px 9px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)' }}>{tag}</span>
              ))}
            </div>

            {/* Link */}
            <a href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, background: 'var(--accent-primary)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk' }}>
              <ExternalLink size={13} /> Visit Official Website
            </a>
          </motion.div>
        )}
      </GlowCard>
    </motion.div>
  );
}
