interface ProgressRingProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
}

export default function ProgressRing({ value, max, size = 160, strokeWidth = 10, color = 'var(--accent)', label = 'kcal' }: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1);
    const offset = circumference * (1 - progress);
    const remaining = max - value;

    return (
        <div className="progress-ring-container" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.65, 0, 0.35, 1)' }}
                />
            </svg>
            <div className="progress-ring-text">
                <span className="progress-ring-value">{value}</span>
                <span style={{ font: 'var(--caption)', color: 'var(--text-dim)', display: 'block' }}>/ {max}</span>
                <span className="progress-ring-label">{label}</span>
                {remaining > 0 && (
                    <span style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                        Zostało: {remaining}
                    </span>
                )}
            </div>
        </div>
    );
}
