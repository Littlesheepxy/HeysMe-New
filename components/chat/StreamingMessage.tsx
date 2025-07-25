'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { InteractionPanel } from './InteractionPanel';

interface StreamableAgentResponse {
  immediate_display?: {
    reply: string;
    thinking?: string;
  };
  interaction?: {
    type: 'choice' | 'input' | 'form' | 'confirmation';
    elements: any[];
  };
  system_state?: {
    progress?: number;
    intent: string;
    done: boolean;
  };
}

export function StreamingMessage({ 
  response, 
  onInteraction 
}: { 
  response: Partial<StreamableAgentResponse>;
  onInteraction: (type: string, data: any) => void;
}) {
  const [visibleContent, setVisibleContent] = useState('');
  const [showInteraction, setShowInteraction] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    if (response.immediate_display?.reply) {
      animateTextDisplay(response.immediate_display.reply);
    }
  }, [response.immediate_display]);
  
  const animateTextDisplay = (text: string) => {
    setIsTyping(true);
    let i = 0;
    
    const timer = setInterval(() => {
      setVisibleContent(text.slice(0, i));
      i++;
      
      if (i > text.length) {
        clearInterval(timer);
        setIsTyping(false);
        setShowInteraction(true);
      }
    }, 30);
  };
  
  return (
    <motion.div 
      className="message-container bg-white p-4 rounded-lg shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="reply-content text-gray-800">
        {visibleContent}
        {isTyping && (
          <motion.span 
            className="inline-block w-2 h-5 bg-blue-500 ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      
      {response.system_state?.progress && (
        <div className="mt-3">
          <ProgressBar progress={response.system_state.progress} />
        </div>
      )}
      
      {showInteraction && response.interaction && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <InteractionPanel
            interaction={response.interaction}
            onSubmit={(data) => onInteraction('interaction', data)}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
