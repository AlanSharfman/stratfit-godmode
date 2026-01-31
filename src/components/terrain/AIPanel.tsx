import React from 'react'
import AIIntelligenceEnhanced from '@/components/AIIntelligenceEnhanced'

/**
 * AIPanel
 * Wrapper around the existing AI Intelligence panel which already implements
 * the 4-tab interface: SUMMARY | RISK MAP | VALUE | MODULES.
 */
export default function AIPanel(props: React.ComponentProps<typeof AIIntelligenceEnhanced>) {
  return <AIIntelligenceEnhanced {...props} />
}


