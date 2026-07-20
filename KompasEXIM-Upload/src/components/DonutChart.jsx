import React from 'react';

const DonutChart = ({ data }) => {
  // data: [{ name: 'Selesai', value: 10, color: '#34c759' }]
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2.5;
  const strokeWidth = 24;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--color-hairline)" strokeWidth={strokeWidth} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-ink-muted-48)">No Data</text>
      </svg>
    );
  }

  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = cx + radius * Math.cos(2 * Math.PI * percent - Math.PI / 2);
    const y = cy + radius * Math.sin(2 * Math.PI * percent - Math.PI / 2);
    return [x, y];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((slice, i) => {
          if (slice.value === 0) return null;
          
          const percent = slice.value / total;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += percent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          
          const largeArcFlag = percent > 0.5 ? 1 : 0;
          
          // Special case for 100%
          if (percent === 1) {
            return <circle key={i} cx={cx} cy={cy} r={radius} fill="none" stroke={slice.color} strokeWidth={strokeWidth} />;
          }

          const pathData = [
            `M ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
          ].join(' ');

          return (
            <path 
              key={i} 
              d={pathData} 
              fill="none" 
              stroke={slice.color} 
              strokeWidth={strokeWidth} 
            />
          );
        })}
        <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="600" fill="var(--color-ink)">{total}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-ink-muted-80)">Total Tugas</text>
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
        {data.map((slice, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-ink)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: slice.color }}></span>
            <span>{slice.name} ({slice.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
