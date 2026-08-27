import { useId, useState } from 'react';


const CENTER = 500;
const RADIUS = 335;

const SEGMENTS = [
  {
    code: 'S6',
    label: 'Antibiotic Resistance',
    position: 'antibiotic',
    start: -120,
    end: -61,
    labelDirection: 'forward',
    colors: ['#d9ebff', '#9fc9f7'],
    outline: '#78afea',
  },
  {
    code: 'S1',
    label: 'Promoter',
    position: 'promoter',
    start: -45,
    end: 7,
    labelDirection: 'forward',
    colors: ['#ffd2b5', '#ff9f62'],
    outline: '#f48843',
  },
  {
    code: 'S2',
    label: 'Major Function',
    position: 'function',
    start: 23,
    end: 65,
    labelDirection: 'reverse',
    colors: ['#eef1f6', '#c9ced8'],
    outline: '#a9b0bc',
  },
  {
    code: 'S3',
    label: 'Tag',
    position: 'tag',
    start: 81,
    end: 109,
    labelDirection: 'reverse',
    colors: ['#ead6ff', '#c69ae9'],
    outline: '#a96edc',
  },
  {
    code: 'S4',
    label: 'Fluorescence',
    position: 'fluorescence',
    start: 125,
    end: 165,
    labelDirection: 'reverse',
    colors: ['#baf4bd', '#6bdc72'],
    outline: '#3fbf49',
  },
  {
    code: 'S5',
    label: 'Selection Marker',
    position: 'selection',
    start: 181,
    end: 224,
    labelDirection: 'forward',
    colors: ['#82ddff', '#26b4eb'],
    outline: '#0b9bd4',
  },
];

const polarPoint = (angle, radius = RADIUS) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
};

const arcPath = (startAngle, endAngle, sweep = 1) => {
  const start = polarPoint(startAngle);
  const end = polarPoint(endAngle);
  const arcSize = Math.abs(endAngle - startAngle);
  return [
    `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${RADIUS} ${RADIUS} 0 ${arcSize > 180 ? 1 : 0} ${sweep} ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
  ].join(' ');
};

const segmentValue = (segment, selectedValues, functionTypeName) => (
  segment.code === 'S2'
    ? functionTypeName || selectedValues[segment.code]
    : selectedValues[segment.code]
);

function GeneStructureVisual({
  structureSelections,
  functionTypeName,
  deliveryTypeName,
  targetGeneName,
}) {
  const [rotation, setRotation] = useState(0);
  const [spotlightCode, setSpotlightCode] = useState('');
  const svgId = useId().replace(/:/g, '');
  const selectedValues = Object.fromEntries(
    structureSelections.map(({ substep, option }) => [substep.code, option?.value || '']),
  );
  const leadingName = [functionTypeName, deliveryTypeName].filter(Boolean).join(' ');
  const designName = [leadingName, targetGeneName].filter(Boolean).join(' - ');
  const spotlightSegment = SEGMENTS.find(({ code }) => code === spotlightCode);
  const spotlightValue = spotlightSegment
    ? segmentValue(spotlightSegment, selectedValues, functionTypeName)
    : '';

  const toggleSpotlight = (code) => {
    setSpotlightCode((current) => (current === code ? '' : code));
  };

  const handleSegmentKeyDown = (event, code) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSpotlight(code);
    }
  };

  return (
    <figure className="design-gene-visual" aria-label={`Designed gene structure${designName ? `: ${designName}` : ''}`}>
      <button
        type="button"
        className="design-gene-rotate-button"
        onClick={() => setRotation((current) => current + 60)}
        aria-label="Rotate gene structure clockwise"
        title="Rotate gene structure"
      >
        <span aria-hidden="true">&#8635;</span>
        Rotate
      </button>

      <div
        className="design-gene-rotating-layer"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg
          className="design-gene-svg"
          viewBox="0 0 1000 1000"
          role="img"
          aria-labelledby={`${svgId}-title ${svgId}-description`}
        >
          <title id={`${svgId}-title`}>Interactive circular gene structure</title>
          <desc id={`${svgId}-description`}>
            Six selectable vector sections for promoter, major function, tag, fluorescence,
            selection marker, and antibiotic resistance.
          </desc>
          <defs>
            <filter id={`${svgId}-shadow`} x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#0a2742" floodOpacity="0.16" />
            </filter>
            {SEGMENTS.map((segment) => (
              <linearGradient
                id={`${svgId}-gradient-${segment.code}`}
                key={`${segment.code}-gradient`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={segment.colors[0]} />
                <stop offset="100%" stopColor={segment.colors[1]} />
              </linearGradient>
            ))}
            {SEGMENTS.map((segment) => {
              const isReverse = segment.labelDirection === 'reverse';
              return (
                <path
                  id={`${svgId}-label-${segment.code}`}
                  key={`${segment.code}-label-path`}
                  d={isReverse
                    ? arcPath(segment.end, segment.start, 0)
                    : arcPath(segment.start, segment.end, 1)}
                />
              );
            })}
          </defs>

          <circle
            className="design-gene-svg-backbone"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            filter={`url(#${svgId}-shadow)`}
          />
          {SEGMENTS.map((segment) => {
            const value = segmentValue(segment, selectedValues, functionTypeName);
            const isSpotlighted = spotlightCode === segment.code;
            return (
              <g
                className={`design-gene-svg-segment is-${segment.position} ${value ? 'has-value' : ''} ${isSpotlighted ? 'is-spotlighted' : ''}`}
                key={segment.code}
                data-step={segment.code}
                data-segment={segment.position}
                role="button"
                tabIndex="0"
                aria-label={`${segment.code}, ${segment.label}: ${value || 'Not selected'}`}
                aria-pressed={isSpotlighted}
                onClick={() => toggleSpotlight(segment.code)}
                onKeyDown={(event) => handleSegmentKeyDown(event, segment.code)}
              >
                <title>{`${segment.label}: ${value || 'Not selected'}`}</title>
                <path
                  className="design-gene-svg-segment-hit-area"
                  d={arcPath(segment.start, segment.end)}
                />
                <path
                  className="design-gene-svg-segment-arc"
                  d={arcPath(segment.start, segment.end)}
                  stroke={`url(#${svgId}-gradient-${segment.code})`}
                  style={{ '--gene-svg-outline': segment.outline }}
                />
                <text className="design-gene-svg-segment-label">
                  <textPath
                    href={`#${svgId}-label-${segment.code}`}
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    {segment.label}
                  </textPath>
                </text>
              </g>
            );
          })}
        </svg>

        {SEGMENTS.map((segment) => {
          const value = segmentValue(segment, selectedValues, functionTypeName);
          return (
            <div
              className={`design-gene-segment-value is-${segment.position} ${value ? 'has-value' : ''} ${spotlightCode === segment.code ? 'is-spotlighted' : ''}`}
              key={segment.code}
              title={`${segment.label}: ${value || 'Not selected'}`}
            >
              <span
                className="design-gene-segment-content"
                style={{ transform: `rotate(${-rotation}deg)` }}
              >
                <small>{segment.code}</small>
                <strong>{value || '-'}</strong>
              </span>
            </div>
          );
        })}
      </div>

      <figcaption className="design-gene-visual-name">
        <small>Designed Gene</small>
        <strong>{designName || 'Complete Steps 2, 3, and 5'}</strong>
        {spotlightSegment && (
          <span className="design-gene-spotlight-detail" aria-live="polite">
            <b>{spotlightSegment.code}</b>
            {spotlightSegment.label}: {spotlightValue || 'Not selected'}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

export default GeneStructureVisual;
