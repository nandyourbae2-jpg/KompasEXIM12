import React from 'react';

const LineChart = ({ data, lines }) => {
  // data: [{ name: 'Jan', Export: 10, Import: 20 }, ...]
  // lines: [{ key: 'Export', color: '#ff2d55' }, { key: 'Import', color: '#5856d6' }]
  
  if (!data || data.length === 0) return <div>Belum ada data</div>;

  const width = 600;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  // Find max value
  let maxVal = 0;
  data.forEach(d => {
    lines.forEach(l => {
      if (d[l.key] > maxVal) maxVal = d[l.key];
    });
  });
  
  // Provide some headroom
  maxVal = maxVal > 0 ? maxVal + (maxVal * 0.2) : 10;
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  
  const getX = (index) => padding.left + (index * (innerWidth / (data.length - 1 || 1)));
  const getY = (val) => height - padding.bottom - ((val / maxVal) * innerHeight);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Y Axis Grid Lines & Labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = height - padding.bottom - (innerHeight * ratio);
        const val = Math.round(maxVal * ratio);
        return (
          <g key={`y-${i}`}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--color-hairline)" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={y + 4} fontSize="11" fill="var(--color-ink-muted-48)" textAnchor="end">{val}</text>
          </g>
        );
      })}

      {/* X Axis Labels */}
      {data.map((d, i) => (
        <text key={`x-${i}`} x={getX(i)} y={height - padding.bottom + 20} fontSize="11" fill="var(--color-ink-muted-80)" textAnchor="middle">
          {d.name}
        </text>
      ))}

      {/* Lines */}
      {lines.map((l, lineIdx) => {
        const points = data.map((d, i) => `${getX(i)},${getY(d[l.key] || 0)}`).join(' ');
        return (
          <g key={`line-${lineIdx}`}>
            <polyline 
              fill="none" 
              stroke={l.color} 
              strokeWidth="3" 
              points={points} 
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />
            {data.map((d, i) => (
              <circle 
                key={`dot-${lineIdx}-${i}`} 
                cx={getX(i)} 
                cy={getY(d[l.key] || 0)} 
                r="4" 
                fill={l.color} 
                stroke="var(--color-canvas)" 
                strokeWidth="2" 
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export default LineChart;
