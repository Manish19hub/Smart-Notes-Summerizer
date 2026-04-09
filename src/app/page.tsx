'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Copy, Download, KeyRound, Clock, AlignLeft, CheckCircle2, AlertTriangle, Settings, X } from 'lucide-react';

const CustomSparkleIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 4 C12 8.5 15.5 12 20 12 C15.5 12 12 15.5 12 20 C12 15.5 8.5 12 4 12 C8.5 12 12 8.5 12 4 Z" />
    <path d="M18 4.5v4m-2-2h4" />
    <circle cx="6" cy="18" r="1.5" />
  </svg>
);
export default function Home() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Derived state
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200) || 0;

  // Load API key from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please paste some notes first!');
      return;
    }
    
    setLoading(true);
    setError('');
    setSummary('');
    setKeywords([]);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize text');
      }

      const data = await response.json();
      setSummary(data.summary);
      setKeywords(data.keywords || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSummary = () => {
    if (!summary) return;
    const content = `SMART NOTES SUMMARY\n\nWord Count: ${wordCount}\nReading Time: ${readingTime} min \n\nSUMMARY:\n${summary}\n\nKEYWORDS:\n${keywords.join(', ')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'summary.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen pt-8 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600/20 p-2.5 rounded-2xl border border-brand-500/30 flex items-center justify-center">
            <CustomSparkleIcon className="text-brand-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Smart<span className="text-brand-500">Notes</span>
            </h1>
            <p className="text-xs text-brand-100/70 font-medium tracking-wide uppercase">AI-Powered Summarizer</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-card-border rounded-full hover:bg-white/5 transition-colors text-sm text-gray-300 font-medium"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </header>

      {/* Main Board */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 relative z-10">
        
        {/* Left Column - Input Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col bg-card-bg border border-card-border rounded-[2rem] p-6 lg:p-8 backdrop-blur-xl shadow-2xl h-[600px] md:h-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-brand-500" /> 
              Raw Notes
            </h2>
            <div className="flex gap-4 text-sm font-medium text-gray-400">
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full"><Clock className="w-4 h-4"/> {readingTime}m read</span>
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full">{wordCount} words</span>
            </div>
          </div>
          
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your long text, meeting notes, or article here... The AI will distill it into the essential points and keywords."
            className="flex-1 bg-black/20 border border-white/5 rounded-2xl p-5 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none transition-all leading-relax custom-scrollbar"
          />

          <div className="mt-6">
            {error && (
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-4 h-4"/> {error}
              </motion.div>
            )}
            
            <button 
              onClick={handleSummarize}
              disabled={loading || !text.trim()}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Text...
                </>
              ) : (
                <>
                  <CustomSparkleIcon className="w-5 h-5" />
                  Generate Smart Summary
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Right Column - Results */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-6"
        >
          {/* Summary Card */}
          <div className="bg-card-bg border border-card-border rounded-[2rem] p-6 lg:p-8 backdrop-blur-xl shadow-2xl flex-1 flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-brand-500" /> 
                AI Summary
              </h2>
              
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  disabled={!summary}
                  className="p-2 bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl transition-colors disabled:opacity-50 text-gray-300 hover:text-white"
                  title="Copy to clipboard"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
                <button 
                  onClick={downloadSummary}
                  disabled={!summary}
                  className="p-2 bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl transition-colors disabled:opacity-50 text-gray-300 hover:text-white"
                  title="Download .txt"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black/20 border border-white/5 rounded-2xl p-5 overflow-y-auto">
              {summary ? (
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                  <Bot className="w-12 h-12 opacity-20" />
                  <p>Your brilliant summary will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Keywords Card */}
            <div className="bg-card-bg border border-card-border rounded-[2rem] p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
              <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-500" /> Key Highlights
              </h3>
              
              <div className="min-h-[60px]">
                {keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {keywords.map((kw, i) => (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="bg-brand-900/40 border border-brand-500/30 text-brand-100 px-4 py-1.5 rounded-full text-sm font-medium shadow-lg"
                      >
                        {kw}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Keywords will be extracted from your text.</p>
                )}
              </div>
            </div>
        </motion.div>
        
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1e293b] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><KeyRound className="w-5 h-5 text-brand-500"/> API Settings</h2>
                <p className="text-sm text-gray-400">To start summarizing, provide your own Gemini API key. It is stored securely in your browser's local storage.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key</label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
