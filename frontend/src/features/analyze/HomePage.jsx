import { useRef, useState } from 'react';
import { SPORTS } from '../../data/landing';

const TIPS = [
  { icon: '📐', text: 'Place the camera at your side, about hip height, 3–5 metres away.' },
  { icon: '🧍', text: 'Keep your whole body in the frame — head to toes.' },
  { icon: '💡', text: 'Use good light. Avoid a bright window behind you.' },
  { icon: '⏱️', text: 'Record 5–15 seconds: 2–3 repetitions of the movement.' },
];

/** Step 1 of an analysis: choose sport, read tips, then record or upload. */
export const HomePage = ({ onVideoSelect, onRecordClick, initialSport }) => {
  const fileInputRef = useRef(null);
  const [selectedSport, setSelectedSport] = useState(
    SPORTS.some((s) => s.name === initialSport) ? initialSport : 'Cricket',
  );
  const sport = SPORTS.find((s) => s.name === selectedSport);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onVideoSelect(file, selectedSport);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="fade-up text-3xl sm:text-4xl font-bold mb-2">New analysis</h1>
      <p className="fade-up delay-1 text-gray-400 mb-8">Choose your sport, then record or upload a short video.</p>

      <div className="fade-up delay-1 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mb-8">
        {SPORTS.map((s) => {
          const active = s.name === selectedSport;
          return (
            <button key={s.name} onClick={() => setSelectedSport(s.name)} aria-pressed={active}
              className={`p-3 rounded-xl border text-center transition ${active ? 'border-teal-400 bg-teal-400/10 scale-105' : 'border-white/10 bg-gray-900/60 hover:border-white/30'}`}>
              <div className="text-2xl">{s.icon}</div>
              <div className="text-xs font-semibold mt-1">{s.name}</div>
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="fade-up delay-2 p-6 rounded-2xl bg-gray-900/60 border border-white/10">
          <div className="text-sm text-gray-400">Movement we will analyse</div>
          <div className="text-2xl font-bold mt-1">{sport.icon} {sport.movement}</div>
          <div className="text-sm text-teal-300 mb-5">{sport.view}</div>
          <h3 className="font-semibold mb-3">Recording tips</h3>
          <ul className="space-y-3">
            {TIPS.map((t) => (
              <li key={t.text} className="flex gap-3 text-sm text-gray-300"><span>{t.icon}</span><span>{t.text}</span></li>
            ))}
          </ul>
        </div>

        <div className="fade-up delay-3 p-6 rounded-2xl bg-gray-900/60 border border-white/10 flex flex-col justify-center gap-4">
          <button onClick={() => onRecordClick(selectedSport)}
            className="w-full px-6 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:scale-[1.02] transition">
            🎥 Record with camera
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full px-6 py-4 text-lg font-semibold rounded-xl border border-white/15 hover:bg-white/5 transition">
            ⬆️ Upload a video
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
          <p className="text-xs text-gray-500 text-center">MP4, WebM or MOV · up to 50 MB</p>
        </div>
      </div>
    </div>
  );
};
