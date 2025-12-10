import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface AIInsightsPanelProps {
  insights: string;
  activeKPI: string | null;
}

export default function AIInsightsPanel({ insights, activeKPI }: AIInsightsPanelProps) {
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setText('');
    setTyping(true);
    let i = 0;
    const timer = setInterval(() => {
      if (i < insights.length) {
        setText(insights.slice(0, i + 1));
        i++;
      } else {
        setTyping(false);
        clearInterval(timer);
      }
    }, 5);
    return () => clearInterval(timer);
  }, [insights]);

  return (
    <div
      className="h-full rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,22,40,0.98), rgba(2,6,23,0.99))',
        border: '1px solid rgba(94,234,212,0.2)',
        boxShadow: '0 0 50px rgba(94,234,212,0.1)',
      }}
    >
      <div className="flex items-center gap-3 p-4 border-b border-[#0d4f4f]/50">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#0d4f4f] to-[#14b8a6]"
          animate={{
            boxShadow: [
              '0 0 20px rgba(94,234,212,0.4)',
              '0 0 35px rgba(94,234,212,0.6)',
              '0 0 20px rgba(94,234,212,0.4)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="w-5 h-5 text-[#5eead4]" />
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">CFO Intelligence</div>
          <div className="text-[10px] text-[#64748b]">
            {activeKPI ? `Analyzing: ${activeKPI}` : 'Cash Sensitivity Engine'}
          </div>
        </div>
        {typing && (
          <div className="flex gap-1">
            {[0, 1, 2].map((idx) => (
              <motion.div
                key={idx}
                className="w-1.5 h-1.5 rounded-full bg-[#5eead4]"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: idx * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-[11px] text-[#94a3b8] leading-relaxed font-mono whitespace-pre-wrap">
          {text}
          {typing && (
            <motion.span
              className="inline-block w-1.5 h-3.5 bg-[#5eead4] ml-0.5"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </div>
  );
}