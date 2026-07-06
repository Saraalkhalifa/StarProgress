import React from 'react';
import type { AvatarMood } from '../../types/avatar';

export interface AnimalSVGProps {
  mood: AvatarMood;
  color?: string;
  accent?: string;
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

interface EyeProps { cx: number; cy: number; irisColor?: string; mood: AvatarMood; }

function Eye({ cx, cy, irisColor = '#5BA8E8', mood }: EyeProps) {
  const squint = mood === 0;
  const ry = squint ? 5 : 7.5;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={6.5} ry={ry} fill="white" />
      <ellipse cx={cx} cy={cy + ry * 0.65} rx={6.5 * 0.85} ry={ry * 0.32} fill="rgba(0,0,0,0.07)" />
      <circle cx={cx} cy={cy + (squint ? 1.5 : 0.5)} r={4.5} fill={irisColor} />
      <circle cx={cx} cy={cy + (squint ? 1.5 : 0.5)} r={2.8} fill="#111" />
      <circle cx={cx - 1.6} cy={cy - (squint ? 0.5 : 1.8)} r={1.7} fill="white" opacity="0.93" />
      <circle cx={cx + 1.8} cy={cy + (squint ? 1.8 : 1.2)} r={0.85} fill="white" opacity="0.48" />
      {mood >= 3 && (
        <g transform={`translate(${cx + 7},${cy - 10}) scale(0.58)`}>
          <path d="M0,-7 L1.8,-1.8 L7,-1.8 L3,1.5 L4.5,7 L0,4 L-4.5,7 L-3,1.5 L-7,-1.8 L-1.8,-1.8 Z" fill="#FFD700" />
        </g>
      )}
    </g>
  );
}

function Mouth({ cx = 50, y = 66, mood, hw = 9 }: { cx?: number; y?: number; mood: AvatarMood; hw?: number }) {
  if (mood === 0) return <path d={`M${cx - hw * 0.55},${y} Q${cx},${y + 1.5} ${cx + hw * 0.55},${y}`} stroke="#B07878" strokeWidth="1.8" fill="none" strokeLinecap="round" />;
  if (mood === 1) return <path d={`M${cx - hw * 0.78},${y} Q${cx},${y + 6} ${cx + hw * 0.78},${y}`} stroke="#C05050" strokeWidth="2" fill="none" strokeLinecap="round" />;
  if (mood === 2) return <path d={`M${cx - hw},${y - 1} Q${cx},${y + 9} ${cx + hw},${y - 1}`} stroke="#C05050" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  if (mood === 3) return (
    <g>
      <path d={`M${cx - hw * 1.1},${y - 2} Q${cx},${y + 12} ${cx + hw * 1.1},${y - 2} Q${cx},${y + 19} ${cx - hw * 1.1},${y - 2}`} fill="#D84444" />
      <line x1={cx - hw * 0.7} y1={y + 6} x2={cx + hw * 0.7} y2={y + 6} stroke="white" strokeWidth="2.5" opacity="0.8" />
    </g>
  );
  return (
    <g>
      <path d={`M${cx - hw * 1.3},${y - 3} Q${cx},${y + 14} ${cx + hw * 1.3},${y - 3} Q${cx},${y + 23} ${cx - hw * 1.3},${y - 3}`} fill="#D84444" />
      <line x1={cx - hw * 0.9} y1={y + 7} x2={cx + hw * 0.9} y2={y + 7} stroke="white" strokeWidth="3" opacity="0.85" />
    </g>
  );
}

function Cheeks({ lx, ly, rx, ry, opacity = 0.22 }: { lx: number; ly: number; rx: number; ry: number; opacity?: number }) {
  return (
    <>
      <ellipse cx={lx} cy={ly} rx={6.5} ry={4.5} fill="#FF7090" opacity={opacity} />
      <ellipse cx={rx} cy={ry} rx={6.5} ry={4.5} fill="#FF7090" opacity={opacity} />
    </>
  );
}

function GroundShadow() {
  return <ellipse cx="50" cy="95.5" rx="27" ry="5.5" fill="rgba(0,0,0,0.16)" style={{ filter: 'blur(2.5px)' }} />;
}

function Sparkles() {
  return (
    <g>
      <g transform="translate(8,8) scale(1.1)"><path d="M0,-5 L1.2,-1.2 L5,-1.2 L2,1 L3.2,5 L0,2.8 L-3.2,5 L-2,1 L-5,-1.2 L-1.2,-1.2 Z" fill="#FFD700" opacity="0.92" /></g>
      <g transform="translate(85,7) scale(0.95)"><path d="M0,-5 L1.2,-1.2 L5,-1.2 L2,1 L3.2,5 L0,2.8 L-3.2,5 L-2,1 L-5,-1.2 L-1.2,-1.2 Z" fill="#FFD700" opacity="0.88" /></g>
      <g transform="translate(91,55) scale(0.7)"><path d="M0,-5 L1.2,-1.2 L5,-1.2 L2,1 L3.2,5 L0,2.8 L-3.2,5 L-2,1 L-5,-1.2 L-1.2,-1.2 Z" fill="#FFF176" opacity="0.82" /></g>
      <g transform="translate(5,60) scale(0.65)"><path d="M0,-5 L1.2,-1.2 L5,-1.2 L2,1 L3.2,5 L0,2.8 L-3.2,5 L-2,1 L-5,-1.2 L-1.2,-1.2 Z" fill="#FFF176" opacity="0.75" /></g>
    </g>
  );
}

// ── Animals ────────────────────────────────────────────────────────────────────

export function CatSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="cat-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#FFCFA0" />
          <stop offset="55%" stopColor="#F4A460" />
          <stop offset="100%" stopColor="#C07030" />
        </radialGradient>
        <radialGradient id="cat-bg" cx="42%" cy="33%" r="55%">
          <stop offset="0%" stopColor="#FFE0B8" />
          <stop offset="100%" stopColor="#D08040" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <path d="M 67,79 Q 86,72 84,58 Q 82,46 73,50 Q 78,54 78,63 Q 78,72 65,77" fill="#F4A460" stroke="#C07030" strokeWidth="0.5" />
      <ellipse cx="50" cy="78" rx="22" ry="17" fill="url(#cat-bg)" />
      <ellipse cx="50" cy="78" rx="12" ry="10" fill="#FFF5EA" opacity="0.65" />
      <polygon points="22,42 16,18 38,38" fill="#D08040" />
      <polygon points="24,40 20,22 36,38" fill="#FFB6C1" />
      <polygon points="78,42 84,18 62,38" fill="#D08040" />
      <polygon points="76,40 80,22 64,38" fill="#FFB6C1" />
      <circle cx="50" cy="52" r="28" fill="url(#cat-hg)" />
      <ellipse cx="42" cy="42" rx="13" ry="9.5" fill="white" opacity="0.13" />
      <Eye cx={38} cy={50} irisColor="#5BA8E8" mood={mood} />
      <Eye cx={62} cy={50} irisColor="#5BA8E8" mood={mood} />
      <polygon points="50,61 46,65 54,65" fill="#E07878" />
      <ellipse cx="50" cy="64" rx="2.5" ry="1.5" fill="#FF9999" opacity="0.5" />
      <Mouth cx={50} y={67} mood={mood} hw={8} />
      <line x1="10" y1="60" x2="38" y2="62" stroke="rgba(160,140,120,0.6)" strokeWidth="0.9" />
      <line x1="10" y1="64" x2="38" y2="64.5" stroke="rgba(160,140,120,0.6)" strokeWidth="0.9" />
      <line x1="10" y1="68" x2="39" y2="67" stroke="rgba(160,140,120,0.6)" strokeWidth="0.9" />
      <line x1="90" y1="60" x2="62" y2="62" stroke="rgba(160,140,120,0.6)" strokeWidth="0.9" />
      <line x1="90" y1="64" x2="62" y2="64.5" stroke="rgba(160,140,120,0.6)" strokeWidth="0.9" />
      <line x1="90" y1="68" x2="61" y2="67" stroke="rgba(160,140,120,0.6)" strokeWidth="0.9" />
      <Cheeks lx={30} ly={60} rx={70} ry={60} opacity={0.18 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function DogSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="dog-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#E8C88A" />
          <stop offset="55%" stopColor="#C68642" />
          <stop offset="100%" stopColor="#96540A" />
        </radialGradient>
        <radialGradient id="dog-muzzle" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#F5E0B8" />
          <stop offset="100%" stopColor="#E0C898" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="50" cy="79" rx="22" ry="17" fill="#C68642" />
      <ellipse cx="50" cy="79" rx="12" ry="9" fill="#F0D8A0" opacity="0.6" />
      <ellipse cx="22" cy="55" rx="10" ry="20" fill="#A86020" transform="rotate(-15,22,55)" />
      <ellipse cx="22" cy="55" rx="6.5" ry="15" fill="#C47820" opacity="0.6" transform="rotate(-15,22,55)" />
      <ellipse cx="78" cy="55" rx="10" ry="20" fill="#A86020" transform="rotate(15,78,55)" />
      <ellipse cx="78" cy="55" rx="6.5" ry="15" fill="#C47820" opacity="0.6" transform="rotate(15,78,55)" />
      <circle cx="50" cy="50" r="29" fill="url(#dog-hg)" />
      <ellipse cx="42" cy="40" rx="13" ry="9" fill="white" opacity="0.12" />
      <ellipse cx="50" cy="63" rx="16" ry="11" fill="url(#dog-muzzle)" />
      <ellipse cx="50" cy="59" rx="7.5" ry="5.5" fill="#2A1A0A" />
      <ellipse cx="50" cy="59" rx="5" ry="3.5" fill="#3A2A1A" />
      <circle cx="47" cy="57.5" r="2" fill="white" opacity="0.3" />
      <Eye cx={36} cy={47} irisColor="#6A4A1A" mood={mood} />
      <Eye cx={64} cy={47} irisColor="#6A4A1A" mood={mood} />
      <Mouth cx={50} y={70} mood={mood} hw={8} />
      <Cheeks lx={30} ly={63} rx={70} ry={63} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function RabbitSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="rab-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#FFFAF5" />
          <stop offset="55%" stopColor="#F0E8D8" />
          <stop offset="100%" stopColor="#C0B8A0" />
        </radialGradient>
        <radialGradient id="rab-ear" cx="50%" cy="20%" r="65%">
          <stop offset="0%" stopColor="#FFFAF5" />
          <stop offset="100%" stopColor="#D8D0C0" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="34" cy="26" rx="10" ry="22" fill="url(#rab-ear)" />
      <ellipse cx="34" cy="26" rx="6" ry="18" fill="#FFB6C1" opacity="0.65" />
      <ellipse cx="66" cy="26" rx="10" ry="22" fill="url(#rab-ear)" />
      <ellipse cx="66" cy="26" rx="6" ry="18" fill="#FFB6C1" opacity="0.65" />
      <ellipse cx="50" cy="80" rx="20" ry="16" fill="url(#rab-hg)" />
      <circle cx="50" cy="56" r="26" fill="url(#rab-hg)" />
      <ellipse cx="42" cy="47" rx="11" ry="8" fill="white" opacity="0.2" />
      <ellipse cx="50" cy="74" rx="14" ry="9" fill="white" opacity="0.5" />
      <ellipse cx="36" cy="89" rx="7" ry="4.5" fill="#E8E0C8" />
      <ellipse cx="64" cy="89" rx="7" ry="4.5" fill="#E8E0C8" />
      <Eye cx={38} cy={54} irisColor="#7AB8E8" mood={mood} />
      <Eye cx={62} cy={54} irisColor="#7AB8E8" mood={mood} />
      <ellipse cx="50" cy="63" rx="4" ry="3" fill="#FFB6C1" />
      <ellipse cx="50" cy="62.5" rx="2.5" ry="1.5" fill="#FF8888" opacity="0.6" />
      <Mouth cx={50} y={67} mood={mood} hw={7} />
      <Cheeks lx={31} ly={62} rx={69} ry={62} opacity={0.22 + mood * 0.05} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function OwlSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="owl-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#C0A880" />
          <stop offset="55%" stopColor="#9B8060" />
          <stop offset="100%" stopColor="#6A5030" />
        </radialGradient>
        <radialGradient id="owl-disc" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#E8D8B8" />
          <stop offset="100%" stopColor="#C8B890" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="50" cy="77" rx="25" ry="19" fill="#7A6040" />
      <ellipse cx="24" cy="72" rx="9" ry="16" fill="#6A5030" />
      <ellipse cx="76" cy="72" rx="9" ry="16" fill="#6A5030" />
      <path d="M 30,75 Q 50,70 70,75" stroke="#5A4020" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M 32,81 Q 50,76 68,81" stroke="#5A4020" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M 35,87 Q 50,82 65,87" stroke="#5A4020" strokeWidth="1.5" fill="none" opacity="0.35" />
      <ellipse cx="36" cy="26" rx="6" ry="10" fill="#6A5030" transform="rotate(-20,36,26)" />
      <ellipse cx="64" cy="26" rx="6" ry="10" fill="#6A5030" transform="rotate(20,64,26)" />
      <circle cx="50" cy="49" r="26" fill="url(#owl-hg)" />
      <ellipse cx="50" cy="52" rx="20" ry="18" fill="url(#owl-disc)" opacity="0.7" />
      <ellipse cx="42" cy="39" rx="12" ry="8.5" fill="white" opacity="0.12" />
      <circle cx="37" cy="49" r="10.5" fill="#5A4020" />
      <circle cx="37" cy="49" r="9" fill="white" />
      <circle cx="37" cy="49" r="6.5" fill="#C8800A" />
      <circle cx="37" cy="49" r="4" fill="#111" />
      <circle cx="35" cy="47" r="2" fill="white" opacity="0.92" />
      <circle cx="39.5" cy="50.5" r="1" fill="white" opacity="0.45" />
      {mood >= 3 && <g transform="translate(47,39) scale(0.58)"><path d="M0,-7 L1.8,-1.8 L7,-1.8 L3,1.5 L4.5,7 L0,4 L-4.5,7 L-3,1.5 L-7,-1.8 L-1.8,-1.8 Z" fill="#FFD700" /></g>}
      <circle cx="63" cy="49" r="10.5" fill="#5A4020" />
      <circle cx="63" cy="49" r="9" fill="white" />
      <circle cx="63" cy="49" r="6.5" fill="#C8800A" />
      <circle cx="63" cy="49" r="4" fill="#111" />
      <circle cx="61" cy="47" r="2" fill="white" opacity="0.92" />
      <circle cx="65.5" cy="50.5" r="1" fill="white" opacity="0.45" />
      <polygon points="50,57 46,63 54,63" fill="#D4A860" />
      <polygon points="50,59 47,63 53,63" fill="#C89040" />
      {mood >= 2 && <Mouth cx={50} y={65} mood={mood} hw={6} />}
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function ElephantSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="elp-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#D0E0F0" />
          <stop offset="55%" stopColor="#A8B8C8" />
          <stop offset="100%" stopColor="#7090A8" />
        </radialGradient>
        <radialGradient id="elp-ear" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#C8D8E8" />
          <stop offset="100%" stopColor="#88A8C0" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="18" cy="52" rx="16" ry="24" fill="url(#elp-ear)" />
      <ellipse cx="18" cy="52" rx="10" ry="18" fill="#B8D0E8" opacity="0.5" />
      <ellipse cx="82" cy="52" rx="16" ry="24" fill="url(#elp-ear)" />
      <ellipse cx="82" cy="52" rx="10" ry="18" fill="#B8D0E8" opacity="0.5" />
      <ellipse cx="50" cy="79" rx="24" ry="17" fill="url(#elp-hg)" />
      <ellipse cx="38" cy="93" rx="9" ry="6" fill="#88A8C0" />
      <ellipse cx="62" cy="93" rx="9" ry="6" fill="#88A8C0" />
      <circle cx="50" cy="50" r="30" fill="url(#elp-hg)" />
      <ellipse cx="41" cy="40" rx="14" ry="10" fill="white" opacity="0.15" />
      <path d="M 44,75 Q 38,83 43,90 Q 47,95 50,90" fill="none" stroke="#A8B8C8" strokeWidth="8" strokeLinecap="round" />
      <path d="M 44,75 Q 38,83 43,90 Q 47,95 50,90" fill="none" stroke="#C0D0E0" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
      <Eye cx={36} cy={45} irisColor="#5880B8" mood={mood} />
      <Eye cx={64} cy={45} irisColor="#5880B8" mood={mood} />
      <Mouth cx={50} y={68} mood={mood} hw={9} />
      <Cheeks lx={28} ly={58} rx={72} ry={58} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function DuckSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="dck-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#FFF4A0" />
          <stop offset="55%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#E0B820" />
        </radialGradient>
        <radialGradient id="dck-bg" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#FFF0C0" />
          <stop offset="100%" stopColor="#E8C828" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="50" cy="78" rx="25" ry="19" fill="url(#dck-bg)" />
      <ellipse cx="50" cy="80" rx="15" ry="13" fill="#FFFFF8" opacity="0.65" />
      <ellipse cx="72" cy="74" rx="10" ry="14" fill="#E0B820" transform="rotate(20,72,74)" />
      <ellipse cx="28" cy="74" rx="10" ry="14" fill="#E0B820" transform="rotate(-20,28,74)" />
      <circle cx="50" cy="50" r="26" fill="url(#dck-hg)" />
      <ellipse cx="42" cy="40" rx="12" ry="8.5" fill="white" opacity="0.18" />
      <ellipse cx="50" cy="66" rx="11" ry="5.5" fill="#FF8C00" />
      <ellipse cx="50" cy="65" rx="11" ry="4" fill="#FFA020" />
      <line x1="40" y1="65" x2="60" y2="65" stroke="#CC6000" strokeWidth="1" opacity="0.5" />
      <Eye cx={38} cy={48} irisColor="#2C6090" mood={mood} />
      <Eye cx={62} cy={48} irisColor="#2C6090" mood={mood} />
      <Cheeks lx={30} ly={56} rx={70} ry={56} opacity={0.18 + mood * 0.04} />
      {mood >= 2 && <Mouth cx={50} y={71} mood={mood} hw={6} />}
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function LionSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="lio-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="55%" stopColor="#E8B84B" />
          <stop offset="100%" stopColor="#B08820" />
        </radialGradient>
        <radialGradient id="lio-mane" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C88820" />
          <stop offset="100%" stopColor="#9A6010" />
        </radialGradient>
        <radialGradient id="lio-muzzle" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFE8C0" />
          <stop offset="100%" stopColor="#E8C890" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <circle cx="50" cy="54" r="34" fill="url(#lio-mane)" />
      <path d="M 28,34 Q 24,26 30,20" stroke="#9A6010" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 72,34 Q 76,26 70,20" stroke="#9A6010" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 17,54 Q 12,48 16,40" stroke="#9A6010" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 83,54 Q 88,48 84,40" stroke="#9A6010" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="50" cy="80" rx="21" ry="16" fill="url(#lio-hg)" />
      <circle cx="50" cy="50" r="25" fill="url(#lio-hg)" />
      <ellipse cx="42" cy="41" rx="12" ry="8.5" fill="white" opacity="0.12" />
      <circle cx="30" cy="28" r="9" fill="#D09020" />
      <circle cx="30" cy="28" r="5.5" fill="#C8702A" opacity="0.7" />
      <circle cx="70" cy="28" r="9" fill="#D09020" />
      <circle cx="70" cy="28" r="5.5" fill="#C8702A" opacity="0.7" />
      <ellipse cx="50" cy="63" rx="16" ry="11" fill="url(#lio-muzzle)" />
      <ellipse cx="50" cy="59" rx="5.5" ry="4" fill="#C87860" />
      <ellipse cx="50" cy="58" rx="3.5" ry="2.5" fill="#E09080" opacity="0.5" />
      <Eye cx={36} cy={48} irisColor="#B07808" mood={mood} />
      <Eye cx={64} cy={48} irisColor="#B07808" mood={mood} />
      <Mouth cx={50} y={70} mood={mood} hw={8} />
      <line x1="12" y1="63" x2="36" y2="63" stroke="rgba(180,160,100,0.55)" strokeWidth="0.9" />
      <line x1="12" y1="67" x2="36" y2="66" stroke="rgba(180,160,100,0.55)" strokeWidth="0.9" />
      <line x1="88" y1="63" x2="64" y2="63" stroke="rgba(180,160,100,0.55)" strokeWidth="0.9" />
      <line x1="88" y1="67" x2="64" y2="66" stroke="rgba(180,160,100,0.55)" strokeWidth="0.9" />
      <Cheeks lx={30} ly={63} rx={70} ry={63} opacity={0.15 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function TigerSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="tig-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#FFB060" />
          <stop offset="55%" stopColor="#E87820" />
          <stop offset="100%" stopColor="#C04808" />
        </radialGradient>
        <radialGradient id="tig-muzzle" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFF4E8" />
          <stop offset="100%" stopColor="#F0D8B0" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="50" cy="79" rx="22" ry="17" fill="#E87820" />
      <path d="M 36,70 Q 50,66 64,70" stroke="#2C1408" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M 34,78 Q 50,74 66,78" stroke="#2C1408" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
      <ellipse cx="50" cy="78" rx="12" ry="9" fill="#FFF0D8" opacity="0.6" />
      <polygon points="26,36 18,14 40,34" fill="#C04808" />
      <polygon points="28,35 22,17 38,33" fill="#FFB6C1" opacity="0.8" />
      <polygon points="74,36 82,14 60,34" fill="#C04808" />
      <polygon points="72,35 78,17 62,33" fill="#FFB6C1" opacity="0.8" />
      <circle cx="50" cy="50" r="28" fill="url(#tig-hg)" />
      <path d="M 42,24 Q 44,34 42,42" stroke="#2C1408" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M 50,22 Q 50,32 50,40" stroke="#2C1408" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M 58,24 Q 56,34 58,42" stroke="#2C1408" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65" />
      <ellipse cx="41" cy="40" rx="13" ry="9" fill="white" opacity="0.11" />
      <ellipse cx="50" cy="63" rx="16" ry="11.5" fill="url(#tig-muzzle)" />
      <polygon points="50,59 46,64 54,64" fill="#CC4444" />
      <Eye cx={36} cy={49} irisColor="#3A2010" mood={mood} />
      <Eye cx={64} cy={49} irisColor="#3A2010" mood={mood} />
      <Mouth cx={50} y={68} mood={mood} hw={8} />
      <line x1="12" y1="62" x2="36" y2="63" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <line x1="12" y1="66" x2="36" y2="66" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <line x1="88" y1="62" x2="64" y2="63" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <line x1="88" y1="66" x2="64" y2="66" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <Cheeks lx={30} ly={62} rx={70} ry={62} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function GiraffeSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="gir-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#FFF0B8" />
          <stop offset="55%" stopColor="#E8C878" />
          <stop offset="100%" stopColor="#B8A040" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <rect x="40" y="58" width="20" height="30" rx="6" fill="#E8C878" />
      <ellipse cx="44" cy="64" rx="4.5" ry="3.5" fill="#C89028" opacity="0.6" />
      <ellipse cx="56" cy="72" rx="4" ry="3" fill="#C89028" opacity="0.6" />
      <ellipse cx="46" cy="78" rx="3.5" ry="3" fill="#C89028" opacity="0.55" />
      <ellipse cx="50" cy="86" rx="26" ry="12" fill="#E8C878" />
      <ellipse cx="36" cy="83" rx="5" ry="3.5" fill="#C89028" opacity="0.5" />
      <ellipse cx="64" cy="83" rx="5" ry="3.5" fill="#C89028" opacity="0.5" />
      <ellipse cx="38" cy="22" rx="3.5" ry="7" fill="#C89028" />
      <circle cx="38" cy="15" r="4" fill="#C89028" />
      <ellipse cx="62" cy="22" rx="3.5" ry="7" fill="#C89028" />
      <circle cx="62" cy="15" r="4" fill="#C89028" />
      <ellipse cx="26" cy="38" rx="8" ry="11" fill="#D4A840" transform="rotate(-25,26,38)" />
      <ellipse cx="26" cy="38" rx="5" ry="7.5" fill="#E8C060" opacity="0.6" transform="rotate(-25,26,38)" />
      <ellipse cx="74" cy="38" rx="8" ry="11" fill="#D4A840" transform="rotate(25,74,38)" />
      <ellipse cx="74" cy="38" rx="5" ry="7.5" fill="#E8C060" opacity="0.6" transform="rotate(25,74,38)" />
      <circle cx="50" cy="40" r="24" fill="url(#gir-hg)" />
      <ellipse cx="40" cy="33" rx="5.5" ry="4" fill="#C89028" opacity="0.5" />
      <ellipse cx="62" cy="35" rx="4.5" ry="3.5" fill="#C89028" opacity="0.45" />
      <ellipse cx="53" cy="30" rx="3.5" ry="3" fill="#C89028" opacity="0.4" />
      <ellipse cx="42" cy="32" rx="11" ry="8" fill="white" opacity="0.12" />
      <ellipse cx="50" cy="52" rx="12" ry="8.5" fill="#EDD090" opacity="0.6" />
      <ellipse cx="50" cy="51" rx="5" ry="3.5" fill="#C8A060" />
      <Eye cx={37} cy={39} irisColor="#604820" mood={mood} />
      <Eye cx={63} cy={39} irisColor="#604820" mood={mood} />
      <path d="M 31,33 L 29,29" stroke="#8A6020" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 34,31 L 33,27" stroke="#8A6020" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 69,33 L 71,29" stroke="#8A6020" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 66,31 L 67,27" stroke="#8A6020" strokeWidth="1.5" strokeLinecap="round" />
      <Mouth cx={50} y={58} mood={mood} hw={7} />
      <Cheeks lx={30} ly={51} rx={70} ry={51} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function PandaSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="pan-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F0F0F0" />
          <stop offset="100%" stopColor="#D8D8D8" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="50" cy="79" rx="24" ry="18" fill="#2A2A2A" />
      <ellipse cx="50" cy="79" rx="15" ry="12" fill="white" opacity="0.9" />
      <circle cx="28" cy="27" r="12" fill="#2A2A2A" />
      <circle cx="28" cy="28" r="7" fill="#3A3A3A" />
      <circle cx="72" cy="27" r="12" fill="#2A2A2A" />
      <circle cx="72" cy="28" r="7" fill="#3A3A3A" />
      <circle cx="50" cy="51" r="29" fill="url(#pan-hg)" />
      <ellipse cx="41" cy="40" rx="13" ry="9" fill="white" opacity="0.25" />
      <ellipse cx="35" cy="48" rx="10.5" ry="9" fill="#2A2A2A" transform="rotate(-15,35,48)" />
      <ellipse cx="65" cy="48" rx="10.5" ry="9" fill="#2A2A2A" transform="rotate(15,65,48)" />
      <circle cx="35" cy="47" r="7" fill="#1A1A1A" />
      <circle cx="35" cy="47" r="4.5" fill="#2A2A2A" />
      <circle cx="35" cy="47" r="3" fill="#111" />
      <circle cx="33" cy="45.5" r="1.6" fill="white" opacity="0.92" />
      <circle cx="37" cy="48.5" r="0.8" fill="white" opacity="0.45" />
      {mood >= 3 && <g transform="translate(44,37) scale(0.58)"><path d="M0,-7 L1.8,-1.8 L7,-1.8 L3,1.5 L4.5,7 L0,4 L-4.5,7 L-3,1.5 L-7,-1.8 L-1.8,-1.8 Z" fill="#FFD700" /></g>}
      <circle cx="65" cy="47" r="7" fill="#1A1A1A" />
      <circle cx="65" cy="47" r="4.5" fill="#2A2A2A" />
      <circle cx="65" cy="47" r="3" fill="#111" />
      <circle cx="63" cy="45.5" r="1.6" fill="white" opacity="0.92" />
      <circle cx="67" cy="48.5" r="0.8" fill="white" opacity="0.45" />
      <ellipse cx="50" cy="62" rx="6" ry="4.5" fill="#2A2A2A" />
      <ellipse cx="50" cy="61" rx="3.5" ry="2.5" fill="#3A3A3A" />
      <circle cx="48.5" cy="60.5" r="1.2" fill="white" opacity="0.28" />
      <Mouth cx={50} y={68} mood={mood} hw={8} />
      <Cheeks lx={27} ly={60} rx={73} ry={60} opacity={0.18 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function FoxSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="fox-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#F09040" />
          <stop offset="55%" stopColor="#D06820" />
          <stop offset="100%" stopColor="#A04808" />
        </radialGradient>
        <radialGradient id="fox-muzzle" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0EAE0" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <path d="M 62,82 Q 88,72 90,56 Q 92,42 80,40 Q 76,46 82,55 Q 86,64 72,74 Q 68,78 64,80" fill="#D06820" stroke="#A04808" strokeWidth="0.5" />
      <ellipse cx="81" cy="40" rx="6" ry="8" fill="white" />
      <ellipse cx="50" cy="79" rx="22" ry="17" fill="#D06820" />
      <ellipse cx="50" cy="78" rx="12" ry="10" fill="white" opacity="0.7" />
      <polygon points="26,40 16,10 44,36" fill="#D06820" />
      <polygon points="28,38 20,14 42,35" fill="#2A1408" opacity="0.6" />
      <polygon points="74,40 84,10 56,36" fill="#D06820" />
      <polygon points="72,38 80,14 58,35" fill="#2A1408" opacity="0.6" />
      <circle cx="50" cy="50" r="28" fill="url(#fox-hg)" />
      <ellipse cx="50" cy="60" rx="18" ry="14" fill="url(#fox-muzzle)" opacity="0.9" />
      <ellipse cx="41" cy="40" rx="13" ry="9" fill="white" opacity="0.12" />
      <ellipse cx="50" cy="60" rx="5" ry="3.5" fill="#2A1408" />
      <circle cx="48.5" cy="59" r="1.2" fill="white" opacity="0.28" />
      <Eye cx={36} cy={48} irisColor="#C07010" mood={mood} />
      <Eye cx={64} cy={48} irisColor="#C07010" mood={mood} />
      <Mouth cx={50} y={66} mood={mood} hw={8} />
      <Cheeks lx={29} ly={60} rx={71} ry={60} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function BearSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="bea-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#B08060" />
          <stop offset="55%" stopColor="#8B5E3C" />
          <stop offset="100%" stopColor="#604020" />
        </radialGradient>
        <radialGradient id="bea-muzzle" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#C8A070" />
          <stop offset="100%" stopColor="#B08050" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="50" cy="79" rx="25" ry="18" fill="url(#bea-hg)" />
      <ellipse cx="50" cy="80" rx="15" ry="12" fill="#C8A070" opacity="0.6" />
      <circle cx="27" cy="28" r="12" fill="#8B5E3C" />
      <circle cx="27" cy="28" r="7" fill="#A07050" opacity="0.7" />
      <circle cx="73" cy="28" r="12" fill="#8B5E3C" />
      <circle cx="73" cy="28" r="7" fill="#A07050" opacity="0.7" />
      <circle cx="50" cy="51" r="29" fill="url(#bea-hg)" />
      <ellipse cx="41" cy="41" rx="13" ry="9.5" fill="white" opacity="0.11" />
      <ellipse cx="50" cy="63" rx="16" ry="11" fill="url(#bea-muzzle)" />
      <ellipse cx="50" cy="59" rx="7" ry="5" fill="#402010" />
      <ellipse cx="50" cy="58.5" rx="4.5" ry="3" fill="#502820" />
      <circle cx="47.5" cy="57.5" r="1.8" fill="white" opacity="0.28" />
      <Eye cx={36} cy={48} irisColor="#402010" mood={mood} />
      <Eye cx={64} cy={48} irisColor="#402010" mood={mood} />
      <Mouth cx={50} y={69} mood={mood} hw={8} />
      <Cheeks lx={29} ly={62} rx={71} ry={62} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function DeerSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="dee-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#E8C888" />
          <stop offset="55%" stopColor="#C8A060" />
          <stop offset="100%" stopColor="#A07838" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <path d="M 36,30 Q 28,22 24,14 M 24,14 Q 18,10 14,8 M 24,14 Q 20,8 22,4" stroke="#8B6030" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M 64,30 Q 72,22 76,14 M 76,14 Q 82,10 86,8 M 76,14 Q 80,8 78,4" stroke="#8B6030" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="79" rx="22" ry="17" fill="#C8A060" />
      <circle cx="40" cy="74" r="4" fill="#E8C888" opacity="0.6" />
      <circle cx="60" cy="74" r="4" fill="#E8C888" opacity="0.6" />
      <ellipse cx="50" cy="80" rx="12" ry="9" fill="#FFEFE0" opacity="0.7" />
      <ellipse cx="22" cy="45" rx="11" ry="18" fill="#C8A060" transform="rotate(-25,22,45)" />
      <ellipse cx="22" cy="45" rx="7" ry="13" fill="#E8C090" opacity="0.5" transform="rotate(-25,22,45)" />
      <ellipse cx="78" cy="45" rx="11" ry="18" fill="#C8A060" transform="rotate(25,78,45)" />
      <ellipse cx="78" cy="45" rx="7" ry="13" fill="#E8C090" opacity="0.5" transform="rotate(25,78,45)" />
      <circle cx="50" cy="49" r="26" fill="url(#dee-hg)" />
      <circle cx="40" cy="42" r="4" fill="#E8C888" opacity="0.45" />
      <circle cx="62" cy="44" r="3.5" fill="#E8C888" opacity="0.4" />
      <ellipse cx="42" cy="40" rx="12" ry="8.5" fill="white" opacity="0.13" />
      <ellipse cx="50" cy="60" rx="13" ry="9" fill="#E8C090" opacity="0.7" />
      <ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#C8806A" />
      <circle cx="48.5" cy="57" r="1.3" fill="white" opacity="0.35" />
      <Eye cx={36} cy={47} irisColor="#604020" mood={mood} />
      <Eye cx={64} cy={47} irisColor="#604020" mood={mood} />
      <Mouth cx={50} y={65} mood={mood} hw={7} />
      <Cheeks lx={29} ly={58} rx={71} ry={58} opacity={0.2 + mood * 0.05} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function KoalaSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="koa-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#C0C0D0" />
          <stop offset="55%" stopColor="#9898A8" />
          <stop offset="100%" stopColor="#686878" />
        </radialGradient>
        <radialGradient id="koa-ear" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#D0D0E0" />
          <stop offset="100%" stopColor="#909098" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="50" cy="80" rx="23" ry="17" fill="#9898A8" />
      <ellipse cx="50" cy="81" rx="14" ry="11" fill="#C8C8D8" opacity="0.6" />
      <circle cx="20" cy="38" r="18" fill="url(#koa-ear)" />
      <circle cx="20" cy="38" r="12" fill="#C0C0D0" opacity="0.7" />
      <circle cx="20" cy="38" r="8" fill="#D8D8E8" opacity="0.5" />
      <circle cx="80" cy="38" r="18" fill="url(#koa-ear)" />
      <circle cx="80" cy="38" r="12" fill="#C0C0D0" opacity="0.7" />
      <circle cx="80" cy="38" r="8" fill="#D8D8E8" opacity="0.5" />
      <circle cx="50" cy="53" r="27" fill="url(#koa-hg)" />
      <ellipse cx="41" cy="43" rx="12" ry="8.5" fill="white" opacity="0.14" />
      <ellipse cx="50" cy="62" rx="9.5" ry="7" fill="#3A3A48" />
      <ellipse cx="50" cy="62" rx="6.5" ry="5" fill="#4A4A58" />
      <circle cx="46.5" cy="60" r="2.2" fill="white" opacity="0.28" />
      <Eye cx={36} cy={51} irisColor="#4A5060" mood={mood} />
      <Eye cx={64} cy={51} irisColor="#4A5060" mood={mood} />
      <Mouth cx={50} y={71} mood={mood} hw={7} />
      <Cheeks lx={29} ly={63} rx={71} ry={63} opacity={0.18 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function PenguinSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="pen-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#5A5A6A" />
          <stop offset="55%" stopColor="#2A2A3A" />
          <stop offset="100%" stopColor="#101018" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="50" cy="77" rx="24" ry="20" fill="#2A2A3A" />
      <ellipse cx="50" cy="78" rx="16" ry="16" fill="#F8F8FF" />
      <ellipse cx="50" cy="77" rx="13" ry="13" fill="white" />
      <ellipse cx="24" cy="73" rx="8" ry="16" fill="#1A1A28" transform="rotate(-20,24,73)" />
      <ellipse cx="76" cy="73" rx="8" ry="16" fill="#1A1A28" transform="rotate(20,76,73)" />
      <ellipse cx="40" cy="94" rx="9" ry="4.5" fill="#FF9020" />
      <ellipse cx="60" cy="94" rx="9" ry="4.5" fill="#FF9020" />
      <circle cx="50" cy="48" r="26" fill="url(#pen-hg)" />
      <ellipse cx="50" cy="52" rx="17" ry="19" fill="white" />
      <ellipse cx="50" cy="51" rx="14" ry="16" fill="#F8F8F8" />
      <ellipse cx="41" cy="39" rx="11" ry="7.5" fill="white" opacity="0.18" />
      <polygon points="50,57 43,62 57,62" fill="#FFA020" />
      <polygon points="50,58 44,62 56,62" fill="#FF8800" />
      <Eye cx={36} cy={47} irisColor="#F0B020" mood={mood} />
      <Eye cx={64} cy={47} irisColor="#F0B020" mood={mood} />
      {mood >= 2 && <Mouth cx={50} y={64} mood={mood} hw={7} />}
      <Cheeks lx={28} ly={57} rx={72} ry={57} opacity={0.18 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function MonkeySVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="mon-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#E8A050" />
          <stop offset="55%" stopColor="#C87830" />
          <stop offset="100%" stopColor="#905010" />
        </radialGradient>
        <radialGradient id="mon-face" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#F0C890" />
          <stop offset="100%" stopColor="#E0B870" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <path d="M 68,82 Q 86,74 85,60 Q 84,50 76,52 Q 80,56 79,64 Q 78,72 66,78" fill="none" stroke="#C87830" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="50" cy="79" rx="22" ry="17" fill="#C87830" />
      <ellipse cx="50" cy="80" rx="13" ry="10" fill="#E8C890" opacity="0.7" />
      <circle cx="23" cy="50" r="12" fill="#C87830" />
      <circle cx="23" cy="50" r="7.5" fill="#E8B870" opacity="0.7" />
      <circle cx="77" cy="50" r="12" fill="#C87830" />
      <circle cx="77" cy="50" r="7.5" fill="#E8B870" opacity="0.7" />
      <circle cx="50" cy="50" r="27" fill="url(#mon-hg)" />
      <ellipse cx="50" cy="56" rx="20" ry="17" fill="url(#mon-face)" opacity="0.85" />
      <ellipse cx="41" cy="40" rx="12" ry="8.5" fill="white" opacity="0.11" />
      <ellipse cx="50" cy="60" rx="6" ry="4" fill="#A06820" />
      <circle cx="47.5" cy="61" r="2" fill="#8A5010" />
      <circle cx="52.5" cy="61" r="2" fill="#8A5010" />
      <Eye cx={37} cy={48} irisColor="#5A3010" mood={mood} />
      <Eye cx={63} cy={48} irisColor="#5A3010" mood={mood} />
      <Mouth cx={50} y={67} mood={mood} hw={8} />
      <Cheeks lx={29} ly={60} rx={71} ry={60} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function SquirrelSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="squ-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#D0A068" />
          <stop offset="55%" stopColor="#B07848" />
          <stop offset="100%" stopColor="#805028" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <ellipse cx="72" cy="55" rx="20" ry="32" fill="#B07848" />
      <ellipse cx="72" cy="55" rx="15" ry="26" fill="#C8906A" opacity="0.7" />
      <ellipse cx="72" cy="52" rx="10" ry="20" fill="#D8A880" opacity="0.5" />
      <ellipse cx="72" cy="38" rx="8" ry="10" fill="#E8C0A0" opacity="0.4" />
      <ellipse cx="46" cy="80" rx="20" ry="17" fill="#B07848" />
      <ellipse cx="46" cy="81" rx="12" ry="11" fill="#E0C090" opacity="0.65" />
      <polygon points="28,38 22,16 42,36" fill="#8A5828" />
      <polygon points="30,37 26,20 40,35" fill="#FFB6C1" opacity="0.7" />
      <polygon points="60,38 66,16 50,36" fill="#8A5828" />
      <polygon points="58,37 62,20 52,35" fill="#FFB6C1" opacity="0.7" />
      <circle cx="46" cy="52" r="26" fill="url(#squ-hg)" />
      <ellipse cx="38" cy="42" rx="12" ry="8.5" fill="white" opacity="0.12" />
      <ellipse cx="28" cy="58" rx="9" ry="7" fill="#D0A868" opacity="0.6" />
      <ellipse cx="64" cy="58" rx="9" ry="7" fill="#D0A868" opacity="0.6" />
      <ellipse cx="46" cy="62" rx="4.5" ry="3.2" fill="#904828" />
      <circle cx="44.5" cy="61" r="1.2" fill="white" opacity="0.28" />
      <Eye cx={33} cy={50} irisColor="#604830" mood={mood} />
      <Eye cx={59} cy={50} irisColor="#604830" mood={mood} />
      <Mouth cx={46} y={67} mood={mood} hw={7} />
      <Cheeks lx={26} ly={60} rx={66} ry={60} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function DragonSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="dra-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#B090F0" />
          <stop offset="55%" stopColor="#8860D0" />
          <stop offset="100%" stopColor="#6040A0" />
        </radialGradient>
        <radialGradient id="dra-bg" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#A080E8" />
          <stop offset="100%" stopColor="#7050B8" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <path d="M 18,38 Q 4,22 8,8 Q 22,16 30,30 Q 24,34 18,38" fill="#7050B8" opacity="0.85" />
      <path d="M 20,38 Q 8,24 11,12 Q 22,18 30,30" fill="#9070D0" opacity="0.5" />
      <path d="M 82,38 Q 96,22 92,8 Q 78,16 70,30 Q 76,34 82,38" fill="#7050B8" opacity="0.85" />
      <path d="M 80,38 Q 92,24 89,12 Q 78,18 70,30" fill="#9070D0" opacity="0.5" />
      <ellipse cx="50" cy="78" rx="22" ry="17" fill="url(#dra-bg)" />
      <path d="M 35,73 Q 45,69 55,73 Q 45,67 35,73" fill="#6040A0" opacity="0.35" />
      <path d="M 38,80 Q 50,75 62,80 Q 50,74 38,80" fill="#6040A0" opacity="0.3" />
      <path d="M 36,28 Q 28,18 30,8 Q 34,12 36,20 Q 38,24 38,30" fill="#C060FF" />
      <path d="M 64,28 Q 72,18 70,8 Q 66,12 64,20 Q 62,24 62,30" fill="#C060FF" />
      <circle cx="50" cy="51" r="28" fill="url(#dra-hg)" />
      <path d="M 42,34 Q 50,30 58,34" stroke="#6040A0" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M 40,40 Q 50,36 60,40" stroke="#6040A0" strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round" />
      <ellipse cx="41" cy="41" rx="13" ry="9" fill="white" opacity="0.14" />
      <ellipse cx="46" cy="63" rx="3" ry="2.5" fill="#6040A0" />
      <ellipse cx="54" cy="63" rx="3" ry="2.5" fill="#6040A0" />
      <circle cx="35" cy="49" r="9.5" fill="white" />
      <circle cx="35" cy="49" r="8" fill="#8B40FF" />
      <circle cx="35" cy="49" r="5" fill="#6020D8" />
      <circle cx="35" cy="49" r="3" fill="#1A0860" />
      <circle cx="33" cy="47" r="1.8" fill="white" opacity="0.95" />
      <circle cx="37.5" cy="50.5" r="0.9" fill="white" opacity="0.5" />
      {mood >= 3 && <g transform="translate(44,40) scale(0.58)"><path d="M0,-7 L1.8,-1.8 L7,-1.8 L3,1.5 L4.5,7 L0,4 L-4.5,7 L-3,1.5 L-7,-1.8 L-1.8,-1.8 Z" fill="#FFD700" /></g>}
      <circle cx="65" cy="49" r="9.5" fill="white" />
      <circle cx="65" cy="49" r="8" fill="#8B40FF" />
      <circle cx="65" cy="49" r="5" fill="#6020D8" />
      <circle cx="65" cy="49" r="3" fill="#1A0860" />
      <circle cx="63" cy="47" r="1.8" fill="white" opacity="0.95" />
      <circle cx="67.5" cy="50.5" r="0.9" fill="white" opacity="0.5" />
      <Mouth cx={50} y={68} mood={mood} hw={9} />
      {mood >= 4 && <g><ellipse cx="50" cy="78" rx="6" ry="3" fill="#FF8800" opacity="0.7" /><Sparkles /></g>}
    </>
  );
}

export function DinosaurSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="din-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#88F098" />
          <stop offset="55%" stopColor="#58C868" />
          <stop offset="100%" stopColor="#308840" />
        </radialGradient>
        <radialGradient id="din-bg" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#70D880" />
          <stop offset="100%" stopColor="#3AA848" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <polygon points="28,30 24,14 32,30" fill="#308840" />
      <polygon points="38,24 35,8 42,24" fill="#3A9848" />
      <polygon points="50,22 47,6 54,22" fill="#308840" />
      <polygon points="62,24 58,8 65,24" fill="#3A9848" />
      <polygon points="72,30 68,14 76,30" fill="#308840" />
      <ellipse cx="50" cy="78" rx="25" ry="18" fill="url(#din-bg)" />
      <ellipse cx="50" cy="79" rx="15" ry="12" fill="#A8F0B0" opacity="0.55" />
      <path d="M 32,72 Q 50,68 68,72" stroke="#309840" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M 34,79 Q 50,75 66,79" stroke="#309840" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
      <ellipse cx="50" cy="52" rx="26" ry="25" fill="url(#din-hg)" />
      <circle cx="44" cy="62" r="3.5" fill="#3A9848" />
      <circle cx="56" cy="62" r="3.5" fill="#3A9848" />
      <circle cx="44" cy="62" r="2" fill="#278838" />
      <circle cx="56" cy="62" r="2" fill="#278838" />
      <ellipse cx="41" cy="41" rx="13" ry="9" fill="white" opacity="0.12" />
      <Eye cx={36} cy={49} irisColor="#104820" mood={mood} />
      <Eye cx={64} cy={49} irisColor="#104820" mood={mood} />
      <Mouth cx={50} y={69} mood={mood} hw={9} />
      <Cheeks lx={29} ly={62} rx={71} ry={62} opacity={0.16 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function BatSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="bat-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#B0A0E8" />
          <stop offset="55%" stopColor="#8878C8" />
          <stop offset="100%" stopColor="#5848A0" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <path d="M 28,50 Q 10,38 6,20 Q 14,22 20,30 Q 16,32 28,50" fill="#5848A0" />
      <path d="M 28,54 Q 8,26 12,10 Q 4,16 4,28 Q 6,40 28,54" fill="#6050A8" opacity="0.6" />
      <path d="M 72,50 Q 90,38 94,20 Q 86,22 80,30 Q 84,32 72,50" fill="#5848A0" />
      <path d="M 72,54 Q 92,26 88,10 Q 96,16 96,28 Q 94,40 72,54" fill="#6050A8" opacity="0.6" />
      <polygon points="34,34 28,14 44,32" fill="#5848A0" />
      <polygon points="36,33 32,17 42,31" fill="#7060B8" opacity="0.6" />
      <polygon points="66,34 72,14 56,32" fill="#5848A0" />
      <polygon points="64,33 68,17 58,31" fill="#7060B8" opacity="0.6" />
      <ellipse cx="50" cy="72" rx="18" ry="14" fill="#6050A8" />
      <ellipse cx="50" cy="72" rx="11" ry="9" fill="#8070C0" opacity="0.5" />
      <circle cx="50" cy="50" r="24" fill="url(#bat-hg)" />
      <ellipse cx="42" cy="41" rx="11" ry="8" fill="white" opacity="0.14" />
      <ellipse cx="50" cy="60" rx="4" ry="3" fill="#3828A0" />
      <ellipse cx="50" cy="59.5" rx="2.5" ry="1.8" fill="#4838B0" />
      <circle cx="48.5" cy="58.8" r="1" fill="white" opacity="0.25" />
      <Eye cx={37} cy={49} irisColor="#3828A0" mood={mood} />
      <Eye cx={63} cy={49} irisColor="#3828A0" mood={mood} />
      <Mouth cx={50} y={66} mood={mood} hw={7} />
      <Cheeks lx={30} ly={59} rx={70} ry={59} opacity={0.18 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

export function SnakeSVG({ mood }: AnimalSVGProps) {
  return (
    <>
      <defs>
        <radialGradient id="sna-hg" cx="38%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#A8E888" />
          <stop offset="55%" stopColor="#78B858" />
          <stop offset="100%" stopColor="#489028" />
        </radialGradient>
      </defs>
      <GroundShadow />
      <path d="M 50,88 Q 82,86 84,72 Q 86,58 70,54 Q 58,52 56,62 Q 54,72 66,74 Q 76,76 76,68 Q 76,62 68,60"
        stroke="#78B858" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M 50,88 Q 82,86 84,72 Q 86,58 70,54 Q 58,52 56,62 Q 54,72 66,74 Q 76,76 76,68 Q 76,62 68,60"
        stroke="#A8E888" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 50,88 Q 82,86 84,72 Q 86,58 70,54"
        stroke="#FFFFA0" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
      <circle cx="40" cy="38" r="24" fill="url(#sna-hg)" />
      <ellipse cx="32" cy="48" rx="10" ry="7" fill="#90C878" opacity="0.7" />
      <ellipse cx="33" cy="30" rx="11" ry="7.5" fill="white" opacity="0.14" />
      <circle cx="28" cy="48" r="2.5" fill="#489028" />
      <circle cx="36" cy="50" r="2.5" fill="#489028" />
      <Eye cx={36} cy={34} irisColor="#2A5010" mood={mood} />
      <Eye cx={52} cy={32} irisColor="#2A5010" mood={mood} />
      {mood >= 1 && (
        <g>
          <path d="M 22,50 L 14,55" stroke="#FF4060" strokeWidth="2" strokeLinecap="round" />
          <path d="M 14,55 L 10,52 M 14,55 L 10,58" stroke="#FF4060" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      <Mouth cx={34} y={55} mood={mood} hw={7} />
      <Cheeks lx={26} ly={44} rx={52} ry={38} opacity={0.18 + mood * 0.04} />
      {mood >= 4 && <Sparkles />}
    </>
  );
}

// ── Animal registry ────────────────────────────────────────────────────────────

const ANIMAL_MAP: Record<string, React.ComponentType<AnimalSVGProps>> = {
  cat: CatSVG,
  dog: DogSVG,
  rabbit: RabbitSVG,
  owl: OwlSVG,
  elephant: ElephantSVG,
  duck: DuckSVG,
  lion: LionSVG,
  tiger: TigerSVG,
  giraffe: GiraffeSVG,
  panda: PandaSVG,
  fox: FoxSVG,
  bear: BearSVG,
  deer: DeerSVG,
  koala: KoalaSVG,
  penguin: PenguinSVG,
  monkey: MonkeySVG,
  squirrel: SquirrelSVG,
  dragon: DragonSVG,
  dinosaur: DinosaurSVG,
  bat: BatSVG,
  snake: SnakeSVG,
};

export function getAnimalComponent(id: string): React.ComponentType<AnimalSVGProps> {
  return ANIMAL_MAP[id] ?? CatSVG;
}

// ── Accessory overlay ──────────────────────────────────────────────────────────

export function AccessoryOverlay({ accessoryId, color }: { accessoryId: string; color?: string }) {
  const c = color || '#FFD700';
  switch (accessoryId) {
    case 'party_hat':
      return (
        <g>
          <polygon points="50,5 34,34 66,34" fill="#FF6B9D" />
          <polygon points="50,5 38,30 62,30" fill="#FF9DC5" opacity="0.5" />
          <ellipse cx="50" cy="34" rx="16" ry="4" fill="#FF8BB0" />
          <circle cx="50" cy="5" r="3" fill="#FFD700" />
          <circle cx="42" cy="16" r="2" fill="#FFD700" />
          <circle cx="58" cy="16" r="2" fill="#7EC8E3" />
        </g>
      );
    case 'top_hat':
      return (
        <g>
          <rect x="36" y="12" width="28" height="22" rx="3" fill="#2A2A2A" />
          <rect x="30" y="32" width="40" height="6" rx="2" fill="#1A1A1A" />
          <rect x="38" y="32" width="24" height="3" rx="1" fill="#8B4513" opacity="0.6" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <polygon points="22,35 30,15 38,30 50,10 62,30 70,15 78,35" fill={c} />
          <rect x="22" y="33" width="56" height="8" rx="3" fill={c} />
          <circle cx="50" cy="12" r="4" fill="#FF4444" />
          <circle cx="32" cy="18" r="3" fill="#4488FF" />
          <circle cx="68" cy="18" r="3" fill="#4488FF" />
        </g>
      );
    case 'glasses':
      return (
        <g>
          <circle cx="36" cy="50" r="9" fill="none" stroke="#4A3020" strokeWidth="2.5" />
          <circle cx="64" cy="50" r="9" fill="none" stroke="#4A3020" strokeWidth="2.5" />
          <circle cx="36" cy="50" r="8.5" fill="rgba(150,210,255,0.25)" />
          <circle cx="64" cy="50" r="8.5" fill="rgba(150,210,255,0.25)" />
          <line x1="45" y1="50" x2="55" y2="50" stroke="#4A3020" strokeWidth="2" />
          <line x1="14" y1="50" x2="27" y2="50" stroke="#4A3020" strokeWidth="2" />
          <line x1="73" y1="50" x2="86" y2="50" stroke="#4A3020" strokeWidth="2" />
        </g>
      );
    case 'sunglasses':
      return (
        <g>
          <ellipse cx="36" cy="50" rx="10" ry="8" fill="#1A1A1A" />
          <ellipse cx="64" cy="50" rx="10" ry="8" fill="#1A1A1A" />
          <ellipse cx="36" cy="50" rx="9.5" ry="7.5" fill="#333" opacity="0.8" />
          <ellipse cx="64" cy="50" rx="9.5" ry="7.5" fill="#333" opacity="0.8" />
          <line x1="46" y1="50" x2="54" y2="50" stroke="#1A1A1A" strokeWidth="2.5" />
          <line x1="12" y1="48" x2="26" y2="50" stroke="#1A1A1A" strokeWidth="2.5" />
          <line x1="88" y1="48" x2="74" y2="50" stroke="#1A1A1A" strokeWidth="2.5" />
          <ellipse cx="30" cy="46" rx="3" ry="2" fill="white" opacity="0.25" />
          <ellipse cx="58" cy="46" rx="3" ry="2" fill="white" opacity="0.25" />
        </g>
      );
    case 'bow_tie':
      return (
        <g transform="translate(50,82)">
          <polygon points="-14,-7 -2,-1 -14,5" fill="#FF4488" />
          <polygon points="14,-7 2,-1 14,5" fill="#FF4488" />
          <ellipse cx="0" cy="0" rx="4" ry="4.5" fill="#CC2266" />
          <polygon points="-12,-6 -3,-1 -12,4" fill="#FF88BB" opacity="0.5" />
          <polygon points="12,-6 3,-1 12,4" fill="#FF88BB" opacity="0.5" />
        </g>
      );
    case 'star_badge':
      return (
        <g transform="translate(76,72)">
          <path d="M0,-12 L3,-4 L11,-4 L5,2 L7,10 L0,5 L-7,10 L-5,2 L-11,-4 L-3,-4 Z" fill="#FFD700" />
          <path d="M0,-10 L2.5,-3.5 L9,-3.5 L4,1.5 L6,9 L0,4 L-6,9 L-4,1.5 L-9,-3.5 L-2.5,-3.5 Z" fill="#FFE855" opacity="0.6" />
        </g>
      );
    case 'scarf':
      return (
        <g>
          <ellipse cx="50" cy="77" rx="22" ry="5" fill="#E53535" />
          <ellipse cx="50" cy="76" rx="22" ry="4" fill="#FF5555" opacity="0.6" />
          <path d="M 62,77 Q 66,82 64,88 Q 62,92 60,88" fill="#E53535" />
          <path d="M 62,77 Q 65,81 63,86" stroke="#FF7777" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case 'medal':
      return (
        <g transform="translate(50,82)">
          <line x1="0" y1="-12" x2="0" y2="-3" stroke="#DAA520" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="9" fill="#DAA520" />
          <circle cx="0" cy="0" r="7.5" fill="#FFD700" />
          <circle cx="0" cy="0" r="6" fill="#FFA500" opacity="0.5" />
          <text x="0" y="3.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#8B4513">1</text>
        </g>
      );
    case 'cape':
      return (
        <g>
          <path d="M 24,42 Q 20,58 22,76 Q 36,82 50,80 Q 64,82 78,76 Q 80,58 76,42 Q 62,50 50,48 Q 38,50 24,42 Z"
            fill="#CC0000" opacity="0.88" />
          <path d="M 24,42 Q 20,58 22,76 Q 36,82 50,80 Q 64,82 78,76 Q 80,58 76,42 Q 62,50 50,48 Q 38,50 24,42 Z"
            fill="none" stroke="#990000" strokeWidth="1" />
          <path d="M 26,44 Q 22,58 24,74" stroke="#FF4444" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M 50,48 Q 50,60 50,78" stroke="#FF4444" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}
