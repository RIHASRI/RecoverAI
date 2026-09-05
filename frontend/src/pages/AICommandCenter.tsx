import React, { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw, CornerDownLeft, AlertCircle, ArrowUpRight } from 'lucide-react';

interface AICommandCenterProps {
  onSelectTransaction?: (id: string) => void;
}

export const AICommandCenter: React.FC<AICommandCenterProps> = ({ onSelectTransaction }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    { sender: 'user' | 'ai'; text: string; data?: any; type?: string }[]
  >([
    {
      sender: 'ai',
      text: "Hello! I am **RecoverAI Assistant**, connected directly to your PostgreSQL/SQLite database. Ask me any natural-language question about your failed payments, recovery probabilities, or customer metrics."
    }
  ]);

  const presetQueries = [
    "Which payments should I recover first?",
    "How much revenue can be recovered?",
    "Show high-value failed payments.",
    "Why did this payment fail?"
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || query;
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setQuery('');
    setLoading(true);

    fetch('/api/command-center', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text })
    })
      .then((res) => res.json())
      .then((resData) => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: resData.answer,
            data: resData.data,
            type: resData.type
          }
        ]);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: "Sorry, I encountered an error executing your query against the database."
          }
        ]);
        setLoading(false);
      });
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8C5D3B] to-[#B4886B] p-0.5 shadow-md shadow-[#8C5D3B]/20">
          <div className="w-full h-full bg-[#F9F6F0] rounded-[14px] flex items-center justify-center text-[#8C5D3B]">
            <Bot className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-[#3D2E24] tracking-tight">AI Command Center</h3>
          <p className="text-xs text-[#7C6656]">Natural-language database query interface backed by live transaction data</p>
        </div>
      </div>

      {/* Preset Suggestion Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-[#7C6656] uppercase tracking-wider mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#8C5D3B]" /> Suggested Queries:
        </span>
        {presetQueries.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(preset)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-[#F0E8DD] border border-[#D8CBB5] hover:border-[#8C5D3B]/40 hover:bg-[#E8DFC8] text-[#3D2E24] text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Chat Conversation Thread */}
      <div className="p-6 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] min-h-[450px] max-h-[600px] overflow-y-auto space-y-6 shadow-xs flex flex-col">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              m.sender === 'user'
                ? 'bg-[#8C5D3B] text-white font-bold text-xs'
                : 'bg-[#E8DFC8] text-[#8C5D3B] border border-[#D8CBB5]'
            }`}>
              {m.sender === 'user' ? 'YOU' : <Bot className="w-4 h-4" />}
            </div>

            <div className={`space-y-3 max-w-2xl ${m.sender === 'user' ? 'text-right' : ''}`}>
              <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#8C5D3B] text-white font-semibold shadow-xs'
                  : 'bg-[#F9F6F0] text-[#3D2E24] border border-[#D8CBB5]'
              }`}>
                {m.text}
              </div>

              {/* Data Card Attachments */}
              {m.type === 'TRANSACTION_LIST' && Array.isArray(m.data) && (
                <div className="p-4 rounded-xl bg-[#F9F6F0] border border-[#D8CBB5] space-y-2 text-left text-xs">
                  <span className="font-bold text-[#8C5D3B] uppercase tracking-wider text-[10px] block">
                    Live SQL Database Results ({m.data.length} items)
                  </span>
                  <div className="divide-y divide-[#D8CBB5]">
                    {m.data.map((t: any, tIdx: number) => (
                      <div key={tIdx} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#3D2E24] block">{t.customer_name}</span>
                          <span className="text-[11px] text-[#7C6656]">{t.failure_reason} • {t.action}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-[#047857] block">₹{t.amount?.toLocaleString('en-IN')}</span>
                          <span className="text-[11px] text-[#0284C7] font-semibold">
                            Exp Rec: ₹{t.expected_recovery?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {m.type === 'METRIC_SUMMARY' && m.data && (
                <div className="grid grid-cols-3 gap-3 text-left text-xs">
                  <div className="p-3 rounded-xl bg-[#F9F6F0] border border-[#D8CBB5]">
                    <span className="text-[#7C6656] block text-[11px]">Revenue at Risk</span>
                    <span className="text-lg font-black text-[#C2410C]">₹{m.data.revenue_at_risk?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F9F6F0] border border-[#D8CBB5]">
                    <span className="text-[#7C6656] block text-[11px]">Potentially Recoverable</span>
                    <span className="text-lg font-black text-[#0284C7]">₹{m.data.potentially_recoverable?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F9F6F0] border border-[#047857]/40">
                    <span className="text-[#047857] block text-[11px]">Already Recovered</span>
                    <span className="text-lg font-black text-[#047857]">₹{m.data.already_recovered?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {m.type === 'FAILURE_BREAKDOWN' && Array.isArray(m.data) && (
                <div className="p-4 rounded-xl bg-[#F9F6F0] border border-[#D8CBB5] space-y-2 text-left text-xs">
                  {m.data.map((f: any, fIdx: number) => (
                    <div key={fIdx} className="flex justify-between items-center py-1 border-b border-[#D8CBB5] last:border-none">
                      <span className="text-[#3D2E24] font-semibold">{f.reason}</span>
                      <span className="text-[#047857] font-bold">{f.count} transactions (₹{f.total_amount?.toLocaleString('en-IN')})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-[#7C6656]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#8C5D3B]" />
            Querying SQLite database via AI NLP Engine...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 rounded-2xl bg-[#F0E8DD] border border-[#D8CBB5] flex items-center gap-3 shadow-xs">
        <input
          type="text"
          placeholder="Ask a question about failed payments, customers, or revenue recovery..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-[#3D2E24] placeholder-[#A08C7D] focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8C5D3B] to-[#B4886B] text-white font-bold text-xs shadow-xs hover:from-[#734A2C] hover:to-[#A3775B] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" /> Ask AI
        </button>
      </div>
    </div>
  );
};
