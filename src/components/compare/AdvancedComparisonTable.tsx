import React from 'react';

interface MetricComparison {
  category: string;
  leftValue: string;
  leftChange: string;
  rightValue: string;
  rightChange: string;
  deltaPercent: number;
}

interface AdvancedComparisonTableProps {
  leftScenario: any;
  rightScenario: any;
}

const AdvancedComparisonTable: React.FC<AdvancedComparisonTableProps> = ({
  leftScenario,
  rightScenario
}) => {
  const comparisonData: MetricComparison[] = [
    {
      category: 'Cash Flow',
      leftValue: '$' + (leftScenario.cash / 1000000).toFixed(2) + 'M',
      leftChange: '+15%',
      rightValue: '$' + (rightScenario.cash / 1000000).toFixed(2) + 'M',
      rightChange: '-8%',
      deltaPercent: ((leftScenario.cash - rightScenario.cash) / rightScenario.cash) * 100
    },
    {
      category: 'Burn Rate',
      leftValue: '$' + (leftScenario.cash / leftScenario.runway / 1000).toFixed(0) + 'K/mo',
      leftChange: '+12%',
      rightValue: '$' + (rightScenario.cash / rightScenario.runway / 1000).toFixed(0) + 'K/mo',
      rightChange: '+25%',
      deltaPercent: -((rightScenario.cash / rightScenario.runway - leftScenario.cash / leftScenario.runway) / (rightScenario.cash / rightScenario.runway)) * 100
    },
    {
      category: 'Runway',
      leftValue: leftScenario.runway + ' months',
      leftChange: '+3mo',
      rightValue: rightScenario.runway + ' months',
      rightChange: '-5mo',
      deltaPercent: ((leftScenario.runway - rightScenario.runway) / rightScenario.runway) * 100
    },
    {
      category: 'Team Size',
      leftValue: '45',
      leftChange: '+8',
      rightValue: '28',
      rightChange: '-9',
      deltaPercent: 60.7
    },
    {
      category: 'Revenue',
      leftValue: '$2.8M',
      leftChange: '+45%',
      rightValue: '$1.2M',
      rightChange: '-15%',
      deltaPercent: 133
    },
    {
      category: 'Customer Count',
      leftValue: '1,240',
      leftChange: '+380',
      rightValue: '620',
      rightChange: '-140',
      deltaPercent: 100
    },
    {
      category: 'Churn Rate',
      leftValue: '2.5%',
      leftChange: '-0.8%',
      rightValue: '8.2%',
      rightChange: '+3.1%',
      deltaPercent: -69.5
    },
    {
      category: 'Expansion MRR',
      leftValue: '$180K',
      leftChange: '+$45K',
      rightValue: '$65K',
      rightChange: '-$22K',
      deltaPercent: 176.9
    }
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(10, 14, 26, 0.98) 100%)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(0, 212, 255, 0.2)',
      padding: '32px',
      position: 'relative'
    }}>
      {/* Animated top border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(0, 212, 255, 0.6) 50%, transparent 100%)',
        animation: 'borderPulse 3s ease-in-out infinite'
      }} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{
          color: '#00d4ff',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.1em',
          margin: 0,
          textTransform: 'uppercase'
        }}>
          Scenario Comparison
        </h3>
        
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: leftScenario.color,
              boxShadow: `0 0 10px ${leftScenario.color}80`
            }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
              {leftScenario.label}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: rightScenario.color,
              boxShadow: `0 0 10px ${rightScenario.color}80`
            }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
              {rightScenario.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main comparison grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 120px 1fr',
        gap: '0',
        position: 'relative'
      }}>
        {/* Header row */}
        <div style={{ 
          gridColumn: '1 / -1',
          display: 'grid',
          gridTemplateColumns: '180px 1fr 120px 1fr',
          gap: '16px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
          marginBottom: '8px'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', fontWeight: '600' }}>
            METRIC
          </div>
          <div style={{ color: leftScenario.color, fontSize: '11px', fontWeight: '600', textAlign: 'right' }}>
            {leftScenario.name.toUpperCase()}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', fontWeight: '600', textAlign: 'center' }}>
            DELTA
          </div>
          <div style={{ color: rightScenario.color, fontSize: '11px', fontWeight: '600', textAlign: 'left' }}>
            {rightScenario.name.toUpperCase()}
          </div>
        </div>

        {/* Data rows */}
        {comparisonData.map((item, index) => (
          <ComparisonRow
            key={index}
            data={item}
            leftColor={leftScenario.color}
            rightColor={rightScenario.color}
            index={index}
          />
        ))}
      </div>

      {/* Bottom summary */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(0, 212, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
          <span style={{ color: '#00d4ff', fontWeight: '600' }}>Analysis:</span>
          {' '}The {leftScenario.label} shows {Math.abs(comparisonData[0].deltaPercent).toFixed(0)}% better cash position with significantly reduced burn rate and extended runway.
        </div>
        
        <div style={{
          padding: '6px 12px',
          background: leftScenario.color + '20',
          border: `1px solid ${leftScenario.color}`,
          borderRadius: '4px',
          color: leftScenario.color,
          fontSize: '11px',
          fontWeight: '700',
          whiteSpace: 'nowrap'
        }}>
          RECOMMENDED PATH
        </div>
      </div>
    </div>
  );
};

// Individual comparison row component
const ComparisonRow: React.FC<{
  data: MetricComparison;
  leftColor: string;
  rightColor: string;
  index: number;
}> = ({ data, leftColor, rightColor, index }) => {
  const isPositiveDelta = data.deltaPercent > 0;
  const deltaColor = isPositiveDelta ? '#00ff9d' : '#ff4757';
  
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'grid',
      gridTemplateColumns: '180px 1fr 120px 1fr',
      gap: '16px',
      padding: '12px 16px',
      backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      cursor: 'default',
      animation: `fadeInRow 0.4s ease-out ${index * 0.05}s both`
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.08)';
      e.currentTarget.style.transform = 'translateX(4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
    >
      {/* Category */}
      <div style={{
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '13px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center'
      }}>
        {data.category}
      </div>

      {/* Left value with change */}
      <div style={{
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '2px'
      }}>
        <div style={{
          color: leftColor,
          fontSize: '15px',
          fontWeight: '600',
          textShadow: `0 0 10px ${leftColor}40`
        }}>
          {data.leftValue}
        </div>
        <div style={{
          color: data.leftChange.startsWith('+') ? '#00ff9d' : '#ff4757',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          {data.leftChange}
        </div>
      </div>

      {/* Delta indicator */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px'
      }}>
        <div style={{
          padding: '4px 10px',
          borderRadius: '12px',
          background: `${deltaColor}15`,
          border: `1px solid ${deltaColor}40`,
          color: deltaColor,
          fontSize: '12px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: `0 0 15px ${deltaColor}20`
        }}>
          <span style={{ fontSize: '10px' }}>
            {isPositiveDelta ? '▲' : '▼'}
          </span>
          {Math.abs(data.deltaPercent).toFixed(1)}%
        </div>
      </div>

      {/* Right value with change */}
      <div style={{
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '2px'
      }}>
        <div style={{
          color: rightColor,
          fontSize: '15px',
          fontWeight: '600',
          textShadow: `0 0 10px ${rightColor}40`
        }}>
          {data.rightValue}
        </div>
        <div style={{
          color: data.rightChange.startsWith('+') ? '#00ff9d' : '#ff4757',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          {data.rightChange}
        </div>
      </div>
    </div>
  );
};

export default AdvancedComparisonTable;

