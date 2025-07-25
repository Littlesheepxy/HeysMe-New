'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export function ProgressBar({ progress, stage }: { progress: number; stage?: string }) {
  return (
    <div className="progress-bar w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">
          {stage ? `${stage} 阶段` : '进度'}
        </span>
        <span className="text-sm font-medium text-blue-600">
          {progress}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      {progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center mt-2 text-green-600"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">完成!</span>
        </motion.div>
      )}
    </div>
  );
}
