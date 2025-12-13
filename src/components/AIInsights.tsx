/**
 * STRATFIT AIInsights — Intelligence Panel
 * 
 * Features:
 * - Typewriter effect (character by character)
 * - 3 tabs: Key Highlights, Risks, Recommendations
 * - Live pulse indicator
 * - Generate PDF button
 * - Metric badges
 */

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

type AITab = 'highlights' | 'risks' | 'recommendations';

interface MetricBadge {
  label: string;
  value: string;
  color: string;
}

interface AIInsightsProps {
  insights: Record<AITab, string>;
  badges: MetricBadge[];
  onGeneratePDF?: () => void;
}

// ============================================================================
// STYLES
// ============================================================================

const COLORS = {
  cardBg: '#11161F',
  borderColor: '#1e293b',
  textMuted: '#94a3b8',
  textBright: '#e2e8f0',
  cyanGlow: '#22d3ee',
  greenGlow: '#22c55e',
};

const TABS: { id: AITab; label: string }[] = [
  { id: 'highlights', label: 'Key Highlights' },
  { id: 'risks', label: 'Risks' },
  { id: 'recommendations', label: 'Recommendations' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function AIInsights({ insights, badges, onGeneratePDF }: AIInsightsProps) {
  const [activeTab, setActiveTab] = useState<AITab>('highlights');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textRef = useRef('');

  // Typewriter effect
  useEffect(() => {
    const fullText = insights[activeTab];
    if (fullText === textRef.current) return;

    textRef.current = fullText;
    setIsTyping(true);
    setDisplayedText('');

    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [activeTab, insights]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.borderColor}`,
        borderRadius: 10,
        padding: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.span
            animate={{
              opacity: isTyping ? [1, 0.4, 1] : 1,
              scale: isTyping ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.8,
              repeat: isTyping ? Infinity : 0,
              ease: 'easeInOut',
            }}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: COLORS.greenGlow,
              boxShadow: `0 0 10px ${COLORS.greenGlow}`,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            AI Insights
          </span>
          <AnimatePresence>
            {isTyping && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLORS.greenGlow,
                  marginLeft: 4,
                }}
              >
                LIVE
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={onGeneratePDF}
          whileHover={{ scale: 1.02, borderColor: COLORS.cyanGlow }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'transparent',
            border: `1px solid ${COLORS.borderColor}`,
            borderRadius: 6,
            color: COLORS.textMuted,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span>📄</span>
          Generate PDF
        </motion.button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Content with typewriter */}
      <div style={{ minHeight: 80, marginBottom: 16 }}>
        <p
          style={{
            color: COLORS.textBright,
            fontSize: 14,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {displayedText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{ color: COLORS.cyanGlow }}
            >
              ▋
            </motion.span>
          )}
        </p>
      </div>

      {/* Metric Badges */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {badges.map((badge, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: `${badge.color}15`,
              border: `1px solid ${badge.color}40`,
            }}
          >
            <span style={{ fontSize: 12, color: badge.color, fontWeight: 500 }}>
              {badge.label}: {badge.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// TAB BUTTON
// ============================================================================

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = memo(function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        background: isActive ? 'rgba(34, 211, 238, 0.12)' : 'transparent',
        borderColor: isActive ? COLORS.cyanGlow : COLORS.borderColor,
        color: isActive ? COLORS.cyanGlow : COLORS.textMuted,
      }}
      style={{
        padding: '8px 14px',
        border: `1px solid ${COLORS.borderColor}`,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </motion.button>
  );
});
