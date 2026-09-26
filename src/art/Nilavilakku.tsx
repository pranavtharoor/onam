/** Nilavilakku: Kerala's tall brass standing lamp, with a lit wick. viewBox-free: drawn around (0,0) = flame tip, 200 units tall. */
export function Nilavilakku({ flameClass }: { flameClass?: string }) {
  return (
    <g>
      <ellipse cx={0} cy={214} rx={58} ry={9} fill="rgb(23 19 15 / 0.35)" />
      <path d="M-46,210 C-46,196 -20,192 0,192 C20,192 46,196 46,210Z" fill="var(--c-brass)" />
      <path d="M-30,194 C-24,184 -10,182 -8,176 L8,176 C10,182 24,184 30,194Z" fill="#c9a24e" />
      <rect x={-6} y={70} width={12} height={108} fill="var(--c-brass)" />
      {[88, 120, 152].map((y) => <ellipse key={y} cx={0} cy={y} rx={13} ry={5} fill="#c9a24e" />)}
      <path d="M-40,58 C-40,70 -20,76 0,76 C20,76 40,70 40,58 Z" fill="var(--c-brass)" />
      <path d="M-40,58 L40,58" stroke="#8a6a2a" strokeWidth={3} />
      <path d="M-10,58 L0,30 L10,58Z" fill="#c9a24e" />
      <g className={flameClass}>
        <circle cx={0} cy={40} r={46} fill="var(--c-yellow-ochre)" opacity={0.16} />
        <circle cx={0} cy={44} r={20} fill="#ffd98a" opacity={0.35} />
        <path d="M0,4 C9,20 9,38 0,50 C-9,38 -9,20 0,4Z" fill="#ffd98a" />
        <path d="M0,22 C4,30 4,40 0,48 C-4,40 -4,30 0,22Z" fill="#fff4d6" />
      </g>
    </g>
  )
}
