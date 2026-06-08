import React from 'react';

interface ResourceChartProps {
  history: { cpu: number; memory: number; timestamp: string }[];
}

export function ResourceChart({ history }: ResourceChartProps) {
  // SVG size specifications
  const width = 800;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value is always 100 on dashboard charts
  const maxVal = 100;

  // Map history values into coordinate points
  const points = history.map((item, index) => {
    const x = paddingLeft + (index / (history.length - 1 || 1)) * chartWidth;
    // In SVG, y=0 is at the top, so we subtract scaled height from bottom
    const yCpu = paddingTop + chartHeight - (item.cpu / maxVal) * chartHeight;
    const yMemory = paddingTop + chartHeight - (item.memory / maxVal) * chartHeight;
    return { x, yCpu, yMemory, ...item };
  });

  // Calculate SVG polyline path strings
  const getLinePath = (pointKey: 'yCpu' | 'yMemory') => {
    if (points.length === 0) return '';
    return points.map(p => `${p.x},${p[pointKey]}`).join(' ');
  };

  const getAreaPath = (pointKey: 'yCpu' | 'yMemory') => {
    if (points.length === 0) return '';
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const bottomY = paddingTop + chartHeight;
    
    // Create closed path by adding points to bottom corners
    const pathPoints = points.map(p => `${p.x},${p[pointKey]}`).join(' ');
    return `M ${startX} ${bottomY} L ${pathPoints} L ${endX} ${bottomY} Z`;
  };

  const cpuLine = getLinePath('yCpu');
  const cpuArea = getAreaPath('yCpu');
  const memoryLine = getLinePath('yMemory');
  const memoryArea = getAreaPath('yMemory');

  // Horizontal grids elements
  const gridLinesY = [0, 25, 50, 75, 100];

  return (
    <div id="resource-utilization-chart" className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200 tracking-wide">Historical Telemetry</h3>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">Real-time usage history (rolling 40-sec window)</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-neutral-300">CPU Usage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            <span className="text-neutral-300">RAM Usage</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Definitions for aesthetic glowing gradients */}
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Draw Grid Lines & Y Axis Labels */}
          {gridLinesY.map((val) => {
            const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
            return (
              <g key={val} className="opacity-40">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#262626" 
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="fill-neutral-500 font-mono"
                  style={{ fontSize: '10px' }}
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Area under charts */}
          {cpuArea && (
            <path d={cpuArea} fill="url(#cpuGradient)" />
          )}
          {memoryArea && (
            <path d={memoryArea} fill="url(#memGradient)" />
          )}

          {/* Line drawings */}
          {memoryLine && (
            <polyline 
              fill="none" 
              stroke="#60a5fa" 
              strokeWidth="2" 
              strokeLinecap="round"
              strokeLinejoin="round"
              points={memoryLine} 
              className="transition-all duration-300"
            />
          )}

          {cpuLine && (
            <polyline 
              fill="none" 
              stroke="#34d399" 
              strokeWidth="2" 
              strokeLinecap="round"
              strokeLinejoin="round"
              points={cpuLine} 
              className="transition-all duration-300"
            />
          )}

          {/* Active tracker dots for the latest values */}
          {points.length > 0 && (
            <>
              {/* Memory tracker point */}
              <circle 
                cx={points[points.length - 1].x} 
                cy={points[points.length - 1].yMemory} 
                r="4.5" 
                fill="#60a5fa" 
                className="animate-pulse"
              />
              {/* CPU tracker point */}
              <circle 
                cx={points[points.length - 1].x} 
                cy={points[points.length - 1].yCpu} 
                r="4.5" 
                fill="#34d399" 
                className="animate-pulse"
              />
            </>
          )}

          {/* X Axis Timeline Labels (Show every 5th item to avoid crowding) */}
          {history.length > 0 && points.map((p, idx) => {
            if (idx % 8 !== 0 && idx !== points.length - 1) return null;
            return (
              <text
                key={idx}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-neutral-500 font-mono"
                style={{ fontSize: '9px' }}
              >
                {p.timestamp}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
