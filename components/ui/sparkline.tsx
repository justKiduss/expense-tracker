import { useId } from 'react';

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const W = 100, H = 32, pad = 2;
  const points = data.map((v, i) => [(i / (data.length - 1)) * W, H - pad - ((v - min) / range) * (H - pad * 2)]);
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}