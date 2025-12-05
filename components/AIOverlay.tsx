import React from 'react';
import { SparklesIcon } from './Icons';

interface AIOverlayProps {
  onSummarize: () => void;
  onFixGrammar: () => void;
  onElaborate: () => void;
  onClose: () => void;
  isProcessing: boolean;
}

const AIOverlay: React.FC<AIOverlayProps> = ({ onSummarize, onFixGrammar, onElaborate, onClose, isProcessing }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-dark-surface rounded-t-2xl p-6 pb-10 border-t border-white/10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-6 text-brand-500">
          <SparklesIcon />
          <h3 className="text-lg font-bold">AI Assistant</h3>
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
             <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-gray-400 text-sm">Gemini is thinking...</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <button 
              onClick={onSummarize}
              className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center gap-3 border border-white/5"
            >
              <span className="text-2xl">📝</span>
              <div>
                <div className="font-semibold">Summarize</div>
                <div className="text-xs text-gray-400">Create a brief overview of this note</div>
              </div>
            </button>
            <button 
              onClick={onFixGrammar}
              className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center gap-3 border border-white/5"
            >
              <span className="text-2xl">✨</span>
              <div>
                <div className="font-semibold">Fix Grammar & Polish</div>
                <div className="text-xs text-gray-400">Improve writing style and fix errors</div>
              </div>
            </button>
            <button 
              onClick={onElaborate}
              className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center gap-3 border border-white/5"
            >
              <span className="text-2xl">🧠</span>
              <div>
                <div className="font-semibold">Elaborate</div>
                <div className="text-xs text-gray-400">Expand on these ideas</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOverlay;
