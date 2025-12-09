import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Note } from './types';
import * as Storage from './services/storage';
import * as Gemini from './services/gemini';
import { blobToBase64 } from './services/audio';
import { 
  PlusIcon, HomeIcon, LockIcon, UnlockIcon, ShareIcon, SparklesIcon, 
  PlayIcon, StopIcon, ArrowLeftIcon, TrashIcon, MicIcon, SettingsIcon,
  GridIcon, ListIcon, ShieldIcon, PinIcon, EyeIcon, EyeOffIcon,
  SunIcon, MoonIcon, PaletteIcon
} from './components/Icons';
import AIOverlay from './components/AIOverlay';

// --- Constants & Types ---

const NOTE_COLORS: Record<string, string> = {
  default: 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/5',
  red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/50',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50',
  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50',
  teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-900/50',
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900/50',
  pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-900/50',
};

// --- Components ---

const BottomNav = ({ activeTab, onTabChange, onAdd }: { activeTab: 'home' | 'vault', onTabChange: (tab: 'home' | 'vault') => void, onAdd: () => void }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200 dark:border-white/5 flex items-center justify-around z-40 pb-4 transition-colors duration-300">
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'home' ? 'text-brand-500' : 'text-gray-400'}`}
      >
        <HomeIcon />
        <span className="text-[10px] font-bold">Home</span>
      </button>

      <div className="relative -top-6">
        <button 
          onClick={onAdd}
          className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-900/50 active:scale-95 transition-transform"
        >
          <PlusIcon />
        </button>
      </div>

      <button 
        onClick={() => onTabChange('vault')}
        className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'vault' ? 'text-red-400' : 'text-gray-400'}`}
      >
        <ShieldIcon />
        <span className="text-[10px] font-bold">Vault</span>
      </button>
    </div>
  );
};

// --- Home Page ---
const HomePage = ({ isDarkMode, toggleTheme }: { isDarkMode: boolean, toggleTheme: () => void }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'vault'>('home');
  const [layout, setLayout] = useState<'list' | 'grid'>('grid');
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPin, setVaultPin] = useState('');
  const [inputVaultPin, setInputVaultPin] = useState('');
  const [showVaultAuth, setShowVaultAuth] = useState(false);
  const [isSettingUpVault, setIsSettingUpVault] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadNotes();
    const storedVaultPin = localStorage.getItem('neuronotes_vault_pin');
    if (storedVaultPin) {
      setVaultPin(storedVaultPin);
    }
  }, []);

  const loadNotes = () => {
    setNotes(Storage.getNotes());
  };

  const handleTabChange = (tab: 'home' | 'vault') => {
    if (tab === 'vault' && !vaultUnlocked) {
      setShowVaultAuth(true);
      if (!vaultPin) {
        setIsSettingUpVault(true);
      }
    } else {
      setActiveTab(tab);
    }
  };

  const handleVaultAuth = () => {
    if (isSettingUpVault) {
      if (inputVaultPin.length < 4) {
        alert("PIN must be at least 4 digits");
        return;
      }
      localStorage.setItem('neuronotes_vault_pin', inputVaultPin);
      setVaultPin(inputVaultPin);
      setVaultUnlocked(true);
      setActiveTab('vault');
      setShowVaultAuth(false);
      setInputVaultPin('');
    } else {
      if (inputVaultPin === vaultPin) {
        setVaultUnlocked(true);
        setActiveTab('vault');
        setShowVaultAuth(false);
        setInputVaultPin('');
      } else {
        alert("Incorrect PIN");
        setInputVaultPin('');
      }
    }
  };

  const togglePin = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const updated = { ...note, isPinned: !note.isPinned };
    Storage.saveNote(updated);
    loadNotes();
  };

  // Filter and Sort
  const filteredNotes = notes
    .filter(n => activeTab === 'vault' ? n.isSecret : !n.isSecret)
    .sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by date
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="pt-12 pb-4 px-4 flex justify-between items-center sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm z-30 border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">
            {activeTab === 'vault' ? 'Secret Vault' : 'NeuroNotes'}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">
            {activeTab === 'vault' ? 'Secure encrypted storage' : 'Your external brain'}
          </p>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-gray-300 active:bg-black/10 dark:active:bg-white/10 transition-colors"
          >
            {isDarkMode ? <MoonIcon /> : <SunIcon />}
          </button>

          <button 
            onClick={() => setLayout(l => l === 'grid' ? 'list' : 'grid')}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-gray-300 active:bg-black/10 dark:active:bg-white/10 transition-colors"
          >
            {layout === 'grid' ? <ListIcon /> : <GridIcon />}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 overflow-y-auto pt-4">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-32 opacity-50">
            <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-gray-400">
              {activeTab === 'vault' ? <ShieldIcon /> : <PlusIcon />}
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              {activeTab === 'vault' ? 'No secret notes yet' : 'No notes. Tap + to create'}
            </p>
          </div>
        ) : (
          <div className={`grid gap-3 ${layout === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {filteredNotes.map(note => {
               const colorClass = note.color && NOTE_COLORS[note.color] ? NOTE_COLORS[note.color] : NOTE_COLORS['default'];
               
               return (
                <div 
                  key={note.id} 
                  onClick={() => navigate(`/note/${note.id}`)}
                  className={`${colorClass} p-4 rounded-2xl border active:scale-95 transition-all cursor-pointer relative overflow-hidden group flex flex-col shadow-sm ${layout === 'grid' ? 'h-48' : 'h-auto'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base truncate w-3/4 text-slate-800 dark:text-slate-100">{note.title || 'Untitled'}</h3>
                    <button 
                      onClick={(e) => togglePin(e, note)} 
                      className={`p-1 rounded-full ${note.isPinned ? 'text-brand-500 bg-brand-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                      <PinIcon filled={note.isPinned} />
                    </button>
                  </div>
                  
                  <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed flex-1 overflow-hidden">
                    {note.isLocked 
                      ? <span className="flex items-center gap-1 text-amber-500/80"><LockIcon /> Locked Content</span> 
                      : (note.content ? (layout === 'grid' ? note.content.slice(0, 80) + '...' : note.content) : "No content")
                    }
                  </p>

                  <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-[10px] text-slate-400 dark:text-gray-500">
                    <span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                    {note.isSecret && <span className="text-red-400 flex items-center gap-1"><ShieldIcon /> Secret</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vault Auth Modal */}
      {showVaultAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-white/10 flex flex-col items-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
              <ShieldIcon />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
              {isSettingUpVault ? "Setup Vault PIN" : "Enter Vault PIN"}
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-xs mb-6 text-center">
              {isSettingUpVault 
                ? "Create a secure PIN to access your secret notes." 
                : "Security check required to access secret notes."}
            </p>
            
            <input 
              type="password"
              pattern="[0-9]*"
              inputMode="numeric" 
              maxLength={6}
              value={inputVaultPin}
              onChange={(e) => setInputVaultPin(e.target.value)}
              className="w-full bg-slate-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-3 mb-6 text-center text-2xl tracking-[0.5em] focus:border-red-500 outline-none transition-colors text-slate-900 dark:text-white"
              placeholder="••••"
              autoFocus
            />
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => { setShowVaultAuth(false); setInputVaultPin(''); }}
                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-slate-600 dark:text-gray-400 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleVaultAuth}
                className="flex-1 py-3 bg-red-600 rounded-xl text-white font-bold hover:bg-red-500 shadow-lg shadow-red-900/20"
              >
                {isSettingUpVault ? "Set PIN" : "Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onAdd={() => navigate('/new')} />
    </div>
  );
};

// --- Editor Page ---
const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note>({
    id: Date.now().toString(),
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    lockPin: '',
    tags: [],
    isSecret: false,
    isPinned: false,
    color: 'default'
  });
  
  // Media State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isRecording, setIsRecording] = useState(false);
  
  // UI State
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Dialog State
  const [inputPin, setInputPin] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [setupPin, setSetupPin] = useState('');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (id) {
      const existing = Storage.getNote(id);
      if (existing) {
        setNote(existing);
        if (existing.isLocked) setIsLocked(true);
      }
    }
  }, [id]);

  const save = useCallback((updatedNote: Note) => {
    setNote(updatedNote);
    Storage.saveNote(updatedNote);
  }, []);

  // --- Lock System ---
  const handleUnlock = () => {
    if (inputPin === note.lockPin) {
      setIsLocked(false);
      setInputPin('');
    } else {
      alert("Incorrect PIN");
    }
  };

  const toggleLock = () => {
    if (note.isLocked) {
      if (confirm("Remove lock from this note?")) {
        save({...note, isLocked: false, lockPin: undefined});
      }
    } else {
      setShowPinSetup(true);
    }
  };

  const confirmLock = () => {
    if (setupPin.length < 4) {
      alert("PIN must be at least 4 digits");
      return;
    }
    save({...note, isLocked: true, lockPin: setupPin});
    setShowPinSetup(false);
    setSetupPin('');
  };

  // --- Secret Toggle ---
  const toggleSecret = () => {
     save({...note, isSecret: !note.isSecret});
  };

  // --- Color System ---
  const changeColor = (colorKey: string) => {
    save({...note, color: colorKey});
    setShowColorMenu(false);
  };

  // --- Audio System ---
  const handleTTS = async () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (!note.content) return;

    try {
      setIsProcessing(true);
      const audioBuffer = await Gemini.textToSpeech(note.content);
      
      if (!audioBuffer) {
        throw new Error("Could not generate audio");
      }

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
      });
      audioContextRef.current = ctx;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackSpeed;
      source.connect(ctx.destination);
      
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);

    } catch (e: any) {
      console.error(e);
      alert(`Read failed: ${e.message}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = speed;
    }
    setShowSpeedMenu(false);
  };

  // --- Dictation System ---
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          setIsProcessing(true);
          try {
            const base64 = await blobToBase64(audioBlob);
            const text = await Gemini.transcribeAudio(base64, mediaRecorder.mimeType);
            
            if (text) {
               const newContent = note.content ? `${note.content} ${text}` : text;
               save({...note, content: newContent, updatedAt: Date.now()});
            }
          } catch (e: any) {
            alert(`Transcription failed: ${e.message}`);
          } finally {
            setIsProcessing(false);
          }
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        alert("Microphone permission denied or not supported.");
      }
    }
  };

  // --- Generic Handlers ---
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.content,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      alert("Sharing not supported.");
    }
  };

  const handleDelete = () => {
    if (confirm("Delete this note?")) {
      if (id) Storage.deleteNote(id);
      navigate('/');
    }
  };

  const runAI = async (action: 'summarize' | 'grammar' | 'elaborate') => {
    setIsProcessing(true);
    try {
      let result = '';
      if (action === 'summarize') {
        const summary = await Gemini.generateSummary(note.content);
        result = note.content + `\n\n**AI Summary:**\n${summary}`;
      } else if (action === 'grammar') {
        result = await Gemini.enhanceNote(note.content, "Fix grammar, spelling, and improve flow without changing the meaning.");
      } else if (action === 'elaborate') {
         result = await Gemini.enhanceNote(note.content, "Elaborate on the key points, adding detail and depth.");
      }

      if (result) {
        const updated = { ...note, content: result, updatedAt: Date.now() };
        save(updated);
      }
    } catch (e: any) {
      alert(`AI request failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
      setShowAIMenu(false);
    }
  };

  // --- Render Lock Screen ---
  if (isLocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 animate-fade-in transition-colors">
        <div className="bg-brand-500/10 p-4 rounded-full mb-4 text-brand-500">
             <LockIcon />
        </div>
        <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Note Locked</h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">Enter your PIN to unlock</p>
        <div className="flex gap-2">
          <input 
            type="password" 
            maxLength={6}
            value={inputPin}
            onChange={(e) => setInputPin(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-center tracking-widest text-xl w-32 focus:outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
            placeholder="****"
          />
          <button 
            onClick={handleUnlock}
            className="bg-brand-600 px-4 py-2 rounded-lg font-bold hover:bg-brand-500 transition-colors text-white"
          >
            Unlock
          </button>
        </div>
        <button onClick={() => navigate('/')} className="mt-8 text-slate-500 hover:text-slate-800 dark:text-gray-500 dark:hover:text-gray-300 text-sm">Go Back</button>
      </div>
    );
  }
  
  const currentThemeClasses = note.color && NOTE_COLORS[note.color] ? NOTE_COLORS[note.color] : NOTE_COLORS['default'];

  // --- Render Editor ---
  return (
    <div className={`h-screen flex flex-col ${currentThemeClasses} transition-colors duration-300 relative`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-transparent z-10">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-600 dark:text-gray-300">
          <ArrowLeftIcon />
        </button>
        <div className="flex items-center gap-1">
           {/* Color Picker */}
           <div className="relative">
             <button 
               onClick={() => setShowColorMenu(!showColorMenu)}
               className="p-2 text-slate-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
             >
               <PaletteIcon />
             </button>
             {showColorMenu && (
               <div className="absolute top-10 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-30 p-2 grid grid-cols-3 gap-2 w-32 animate-fade-in">
                 {Object.keys(NOTE_COLORS).map(colorKey => (
                   <button
                     key={colorKey}
                     onClick={() => changeColor(colorKey)}
                     className={`w-8 h-8 rounded-full border-2 ${note.color === colorKey ? 'border-brand-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                     style={{ 
                       backgroundColor: colorKey === 'default' ? 'transparent' : 
                         (colorKey === 'white' ? '#ffffff' : `var(--color-${colorKey})`) 
                     }}
                   >
                     <div className={`w-full h-full rounded-full ${NOTE_COLORS[colorKey].split(' ')[0]}`}></div>
                   </button>
                 ))}
               </div>
             )}
           </div>

           {/* Playback Speed Control */}
           <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 rounded-full font-bold text-xs"
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                 <div className="absolute top-10 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-30 flex flex-col w-20 overflow-hidden">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                       <button 
                         key={speed}
                         onClick={() => changeSpeed(speed)}
                         className={`py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 ${speed === playbackSpeed ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-gray-300'}`}
                       >
                         {speed}x
                       </button>
                    ))}
                 </div>
              )}
           </div>

          <button 
            onClick={handleTTS}
            disabled={isRecording}
            className={`p-2 rounded-full transition-colors ${isPlaying ? 'text-red-500 bg-red-500/10' : 'text-brand-600 dark:text-brand-400 hover:bg-brand-500/10'}`}
          >
            {isPlaying ? <StopIcon /> : <PlayIcon />}
          </button>
          
          <button 
            onClick={toggleLock}
            className={`p-2 rounded-full transition-colors ${note.isLocked ? 'text-amber-500' : 'text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white'}`}
          >
            {note.isLocked ? <LockIcon /> : <UnlockIcon />}
          </button>

          <button 
            onClick={toggleSecret}
            className={`p-2 rounded-full transition-colors ${note.isSecret ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white'}`}
            title="Toggle Secret"
          >
            {note.isSecret ? <EyeOffIcon /> : <EyeIcon />}
          </button>
          
          <button onClick={handleShare} className="p-2 text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white rounded-full">
            <ShareIcon />
          </button>
          
          <button onClick={handleDelete} className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-full">
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <input
          type="text"
          value={note.title}
          onChange={(e) => save({ ...note, title: e.target.value, updatedAt: Date.now() })}
          placeholder="Title"
          className="bg-transparent text-2xl font-bold px-6 py-4 outline-none placeholder-slate-400 dark:placeholder-gray-600 text-slate-900 dark:text-slate-100"
        />
        <textarea
          value={note.content}
          onChange={(e) => save({ ...note, content: e.target.value, updatedAt: Date.now() })}
          placeholder="Start typing..."
          className="flex-1 bg-transparent px-6 py-2 outline-none resize-none text-lg leading-relaxed text-slate-700 dark:text-gray-300 placeholder-slate-400 dark:placeholder-gray-700"
        />
        
        {/* Recording Overlay */}
        {isRecording && (
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-2 rounded-full flex items-center gap-2 animate-pulse-fast shadow-lg z-20">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="font-bold text-sm">Recording... Tap mic to stop</span>
           </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
           <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center flex-col gap-4">
               <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="font-semibold text-brand-700 dark:text-brand-100">AI is working...</p>
           </div>
        )}
      </div>

      {/* Pin Setup Modal */}
      {showPinSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-white/10 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Set PIN for this note</h3>
            <input 
              type="number"
              value={setupPin}
              onChange={(e) => setSetupPin(e.target.value)}
              placeholder="Enter PIN (min 4 digits)"
              className="w-full bg-slate-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-3 mb-4 text-center text-xl tracking-widest focus:border-brand-500 outline-none text-slate-900 dark:text-white"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowPinSetup(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-slate-600 dark:text-gray-400 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLock}
                className="flex-1 py-3 bg-brand-600 rounded-xl text-white font-bold hover:bg-brand-500"
              >
                Lock Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-4 items-center">
        {/* Dictation */}
        <button 
          onClick={toggleRecording}
          disabled={isPlaying || isProcessing}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isRecording ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-brand-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
        >
          {isRecording ? <div className="w-5 h-5 bg-white rounded-sm"></div> : <MicIcon />}
        </button>

        {/* AI Menu */}
        <button 
          onClick={() => setShowAIMenu(true)}
          disabled={isRecording}
          className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-brand-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/40 text-white active:scale-95 transition-transform"
        >
          <SparklesIcon />
        </button>
      </div>

      {showAIMenu && (
        <AIOverlay 
          isProcessing={isProcessing}
          onClose={() => setShowAIMenu(false)}
          onSummarize={() => runAI('summarize')}
          onFixGrammar={() => runAI('grammar')}
          onElaborate={() => runAI('elaborate')}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage or system preference on mount
    const storedTheme = localStorage.getItem('neuronotes_theme');
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    } else {
      // Default to dark mode as per original design, or check system:
      // const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme class to html element
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('neuronotes_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('neuronotes_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
        <Route path="/new" element={<EditorPage />} />
        <Route path="/note/:id" element={<EditorPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;