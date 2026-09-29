import React, { useState, useEffect } from 'react';
import { KeyPoolManager, AIProviderName } from '../../services/llm/keyPool';
import { Key, RefreshCw, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { MotionButton } from '../ui/MotionButton';
import { useToast } from '../shared/ToastProvider';

interface ProviderMeta {
  id: AIProviderName;
  name: string;
  description: string;
  badge: string;
}

const PROVIDERS: ProviderMeta[] = [
  { id: 'google', name: 'Google Gemini', description: 'Gemini 3.5 Flash & 3.1 Flash Lite. High reliability & reasoning.', badge: '1,500 RPD' },
  { id: 'groq', name: 'Groq Cloud', description: 'Llama 3.3 70B & DeepSeek R1 Distill. Ultra-fast inference.', badge: '1,000 RPD' },
  { id: 'openrouter', name: 'OpenRouter', description: 'DeepSeek R1, MiniMax, Qwen, Kimi free models.', badge: 'Multi-Model' },
  { id: 'mistral', name: 'Mistral AI', description: 'Mistral Small & Le Chat open models.', badge: 'High Quota' },
  { id: 'cerebras', name: 'Cerebras AI', description: 'GPT-OSS 120B ultra-fast hardware acceleration.', badge: '14,400 RPD' },
  { id: 'cloudflare', name: 'Cloudflare Workers AI', description: 'Edge AI inference for zero latency.', badge: '10,000 RPD' }
];

export const ApiKeyPoolSettings: React.FC = () => {
  const { toast } = useToast();
  const keyPool = KeyPoolManager.getInstance();

  const [rawKeys, setRawKeys] = useState<Record<AIProviderName, string>>({
    google: '',
    groq: '',
    openrouter: '',
    mistral: '',
    cerebras: '',
    cloudflare: ''
  });

  const [stats, setStats] = useState(keyPool.getCallStats());
  const [testingProvider, setTestingProvider] = useState<AIProviderName | null>(null);

  useEffect(() => {
    const loaded: Record<AIProviderName, string> = {
      google: keyPool.getKeys('google').join('\n'),
      groq: keyPool.getKeys('groq').join('\n'),
      openrouter: keyPool.getKeys('openrouter').join('\n'),
      mistral: keyPool.getKeys('mistral').join('\n'),
      cerebras: keyPool.getKeys('cerebras').join('\n'),
      cloudflare: keyPool.getKeys('cloudflare').join('\n')
    };
    setRawKeys(loaded);
  }, []);

  const refreshStats = () => {
    setStats(keyPool.getCallStats());
  };

  const handleSaveProvider = (provider: AIProviderName) => {
    const keys = rawKeys[provider].split('\n').map(k => k.trim()).filter(Boolean);
    keyPool.setKeys(provider, keys);
    refreshStats();
    toast.success(`Updated ${keys.length} key(s) for ${provider.toUpperCase()}`, { title: 'Key Pool Updated' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" /> Multi-Provider API Key Pool
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure multiple API keys per provider. The app automatically rotates keys and falls back if rate limits occur.
          </p>
        </div>
        <MotionButton variant="secondary" size="sm" onClick={refreshStats}>
          <RefreshCw className="w-4 h-4" /> Refresh Stats
        </MotionButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROVIDERS.map(p => {
          const providerStat = stats[p.id];
          return (
            <div key={p.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-200">{p.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active: {providerStat?.activeKeys || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Key className="w-3.5 h-3.5" />
                  <span>Total: {providerStat?.totalKeys || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400 ml-auto">
                  <span>Calls Today: {providerStat?.callsToday || 0}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  API Keys (Paste one key per line)
                </label>
                <textarea
                  rows={3}
                  value={rawKeys[p.id]}
                  onChange={e => setRawKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder={`Paste ${p.name} API keys here...\nAI_KEY_1\nAI_KEY_2`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 custom-scrollbar"
                />
              </div>

              <div className="flex justify-end gap-2">
                <MotionButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveProvider(p.id)}
                >
                  Save {p.name} Keys
                </MotionButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
