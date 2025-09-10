'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiGithub } from '@/lib/icons';
import { ThemeLogo } from '@/components/ui/theme-logo';
import { appConfig } from '@/config/app.config';

interface HomeScreenProps {
  showHomeScreen: boolean;
  homeScreenFading: boolean;
  homeUrlInput: string;
  setHomeUrlInput: (value: string) => void;
  homeContextInput: string;
  setHomeContextInput: (value: string) => void;
  selectedStyle: string | null;
  setSelectedStyle: (style: string | null) => void;
  showStyleSelector: boolean;
  setShowStyleSelector: (show: boolean) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function HomeScreen({
  showHomeScreen,
  homeScreenFading,
  homeUrlInput,
  setHomeUrlInput,
  homeContextInput,
  setHomeContextInput,
  selectedStyle,
  setSelectedStyle,
  showStyleSelector,
  setShowStyleSelector,
  aiModel,
  setAiModel,
  onSubmit,
  onClose
}: HomeScreenProps) {
  if (!showHomeScreen) return null;

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-500 ${homeScreenFading ? 'opacity-0' : 'opacity-100'}`}>
      {/* Simple Sun Gradient Background */}
      <div className="absolute inset-0 bg-white overflow-hidden">
        {/* Main Sun - Pulsing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-orange-400/50 via-orange-300/30 to-transparent rounded-full blur-[80px] animate-[sunPulse_4s_ease-in-out_infinite]" />
        
        {/* Inner Sun Core - Brighter */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-yellow-300/40 via-orange-400/30 to-transparent rounded-full blur-[40px] animate-[sunPulse_4s_ease-in-out_infinite_0.5s]" />
        
        {/* Outer Glow - Subtle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-radial from-orange-200/20 to-transparent rounded-full blur-[120px]" />
        
        {/* Giant Glowing Orb - Center Bottom */}
        <div className="absolute bottom-0 left-1/2 w-[800px] h-[800px] animate-[orbShrink_3s_ease-out_forwards]" style={{ transform: 'translateX(-50%) translateY(45%)' }}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-orange-600 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
            <div className="absolute inset-16 bg-orange-500 rounded-full blur-[80px] opacity-40 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute inset-32 bg-orange-400 rounded-full blur-[60px] opacity-50 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            <div className="absolute inset-48 bg-yellow-300 rounded-full blur-[40px] opacity-60"></div>
          </div>
        </div>
      </div>
      
      {/* Close button on hover */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 text-gray-500 hover:text-gray-700 transition-all duration-300 opacity-0 hover:opacity-100 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm"
        style={{ opacity: 0 }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between animate-[fadeIn_0.8s_ease-out]">
        <ThemeLogo />
        <a 
          href="https://github.com/mendableai/open-lovable" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#36322F] text-white px-3 py-2 rounded-[10px] text-sm font-medium [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#171310,_0px_1px_3px_0px_rgba(58,_33,_8,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#171310,_0px_1px_2px_0px_rgba(58,_33,_8,_30%)] transition-all duration-200"
        >
          <FiGithub className="w-4 h-4" />
          <span>Use this template</span>
        </a>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="text-center max-w-4xl min-w-[600px] mx-auto">
          {/* Firecrawl-style Header */}
          <div className="text-center">
            <h1 className="text-[2.5rem] lg:text-[3.8rem] text-center text-[#36322F] font-semibold tracking-tight leading-[0.9] animate-[fadeIn_0.8s_ease-out]">
              <span className="hidden md:inline">Open Lovable</span>
              <span className="md:hidden">Open Lovable</span>
            </h1>
            <motion.p 
              className="text-base lg:text-lg max-w-lg mx-auto mt-2.5 text-zinc-500 text-center text-balance"
              animate={{
                opacity: showStyleSelector ? 0.7 : 1
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              Re-imagine any website, in seconds.
            </motion.p>
          </div>
          
          <form onSubmit={onSubmit} className="mt-5 max-w-3xl mx-auto">
            <div className="w-full relative group">
              <input
                type="text"
                value={homeUrlInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setHomeUrlInput(value);
                  
                  // Check if it's a valid domain
                  const domainRegex = /^(https?:\/\/)?(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(\/?.*)?$/;
                  if (domainRegex.test(value) && value.length > 5) {
                    // Small delay to make the animation feel smoother
                    setTimeout(() => setShowStyleSelector(true), 100);
                  } else {
                    setShowStyleSelector(false);
                    setSelectedStyle(null);
                  }
                }}
                placeholder=" "
                aria-placeholder="https://firecrawl.dev"
                className="h-[3.25rem] w-full resize-none focus-visible:outline-none focus-visible:ring-orange-500 focus-visible:ring-2 rounded-[18px] text-sm text-[#36322F] px-4 pr-12 border-[.75px] border-border bg-white"
                style={{
                  boxShadow: '0 0 0 1px #e3e1de66, 0 1px 2px #5f4a2e14, 0 4px 6px #5f4a2e0a, 0 40px 40px -24px #684b2514',
                  filter: 'drop-shadow(rgba(249, 224, 184, 0.3) -0.731317px -0.731317px 35.6517px)'
                }}
                autoFocus
              />
              <div 
                aria-hidden="true" 
                className={`absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none text-sm text-opacity-50 text-start transition-opacity ${
                  homeUrlInput ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <span className="text-[#605A57]/50" style={{ fontFamily: 'monospace' }}>
                  https://firecrawl.dev
                </span>
              </div>
              <button
                type="submit"
                disabled={!homeUrlInput.trim()}
                className="absolute top-1/2 transform -translate-y-1/2 right-2 flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={selectedStyle ? `Clone with ${selectedStyle} Style` : 'Clone Website'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="9 10 4 15 9 20"></polyline>
                  <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                </svg>
              </button>
            </div>
              
              {/* Style Selector - Slides out when valid domain is entered */}
              {showStyleSelector && (
                <div className="overflow-hidden mt-4">
                  <div className={`transition-all duration-500 ease-out transform ${
                    showStyleSelector ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                  }`}>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-3 font-medium">How do you want your site to look?</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { name: 'Neobrutalist', description: 'Bold colors, thick borders' },
                      { name: 'Glassmorphism', description: 'Frosted glass effects' },
                      { name: 'Minimalist', description: 'Clean and simple' },
                      { name: 'Dark Mode', description: 'Dark theme' },
                      { name: 'Gradient', description: 'Colorful gradients' },
                      { name: 'Retro', description: '80s/90s aesthetic' },
                      { name: 'Modern', description: 'Contemporary design' },
                      { name: 'Monochrome', description: 'Black and white' }
                    ].map((style) => (
                      <button
                        key={style.name}
                        type="button"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            // Submit the form
                            const form = e.currentTarget.closest('form');
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }}
                        onClick={() => {
                          if (selectedStyle === style.name) {
                            // Deselect if clicking the same style
                            setSelectedStyle(null);
                            // Keep only additional context, remove the style theme part
                            const currentAdditional = homeContextInput.replace(/^[^,]+theme\s*,?\s*/, '').trim();
                            setHomeContextInput(currentAdditional);
                          } else {
                            // Select new style
                            setSelectedStyle(style.name);
                            // Extract any additional context (everything after the style theme)
                            const currentAdditional = homeContextInput.replace(/^[^,]+theme\s*,?\s*/, '').trim();
                            setHomeContextInput(style.name.toLowerCase() + ' theme' + (currentAdditional ? ', ' + currentAdditional : ''));
                          }
                        }}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedStyle === style.name
                            ? 'border-orange-400 bg-orange-50 text-gray-900 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50 text-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium">{style.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Additional context input - part of the style selector */}
                  <div className="mt-4 mb-2">
                    <input
                      type="text"
                      value={(() => {
                        if (!selectedStyle) return homeContextInput;
                        // Extract additional context by removing the style theme part
                        const additional = homeContextInput.replace(new RegExp('^' + selectedStyle.toLowerCase() + ' theme\\s*,?\\s*', 'i'), '');
                        return additional;
                      })()}
                      onChange={(e) => {
                        const additionalContext = e.target.value;
                        if (selectedStyle) {
                          setHomeContextInput(selectedStyle.toLowerCase() + ' theme' + (additionalContext.trim() ? ', ' + additionalContext : ''));
                        } else {
                          setHomeContextInput(additionalContext);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const form = e.currentTarget.closest('form');
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                      placeholder="Add more details: specific features, color preferences..."
                      className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all duration-200"
                    />
                  </div>
                </div>
                  </div>
                </div>
              )}
          </form>
          
          {/* Model Selector */}
          <div className="mt-6 flex items-center justify-center animate-[fadeIn_1s_ease-out]">
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#36322F] focus:border-transparent"
              style={{
                boxShadow: '0 0 0 1px #e3e1de66, 0 1px 2px #5f4a2e14'
              }}
            >
              {appConfig.ai.availableModels.map(model => (
                <option key={model} value={model}>
                  {appConfig.ai.models[model as keyof typeof appConfig.ai.models]?.displayName || model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
