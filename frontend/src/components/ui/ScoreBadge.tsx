interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const getColor = () => {
    if (score >= 85) return 'text-secondary';
    if (score >= 70) return 'text-surface-tint';
    return 'text-error';
  };

  const getTrackColor = () => 'text-surface-container-highest';

  const dims = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const r = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;
  const cx = size === 'sm' ? 20 : size === 'lg' ? 32 : 24;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const strokeWidth = size === 'sm' ? 3 : 4;

  return (
    <div className={`${dims} relative`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className={getTrackColor()}
          cx={cx}
          cy={cx}
          r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          className={getColor()}
          cx={cx}
          cy={cx}
          r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
