import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  MessageSquare, 
  AlertCircle,
  ChevronRight,
  Database,
  Search,
  Cpu
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Rule-based local EMIS assistant - no external AI API required
async function generateLocalResponse(userMessage: string, data: any): Promise<string> {
  const msg = userMessage.toLowerCase();
  
  const schools = data?.schools || [];
  const teachers = data?.teachers || [];
  const inspections = data?.inspections || [];
  const tpd = data?.tpd || [];
  const resources = data?.resources || [];

  // Teacher-related queries
  if (msg.includes('teacher') && (msg.includes('ratio') || msg.includes('student'))) {
    if (schools.length === 0) return "No school data available to calculate teacher-to-student ratios.";
    const ratios = schools.map((s: any) => {
      const schoolTeachers = teachers.filter((t: any) => t.schoolId === s.id);
      const enrollment = s.enrollment?.total || 0;
      const ratio = schoolTeachers.length > 0 ? Math.round(enrollment / schoolTeachers.length) : 0;
      return { name: s.name, teachers: schoolTeachers.length, enrollment, ratio };
    }).filter((s: any) => s.ratio > 0).sort((a: any, b: any) => b.ratio - a.ratio);
    
    const top5 = ratios.slice(0, 5);
    return `## Schools with Highest Student-to-Teacher Ratios\n\n| School | Teachers | Enrollment | Ratio |\n|--------|----------|------------|-------|\n${top5.map((s: any) => `| ${s.name} | ${s.teachers} | ${s.enrollment} | ${s.ratio}:1 |`).join('\n')}\n\n**Recommendation:** Schools with ratios above 40:1 may need additional staffing support.`;
  }

  if (msg.includes('teacher') && (msg.includes('count') || msg.includes('how many') || msg.includes('total'))) {
    const active = teachers.filter((t: any) => t.status === 'Active').length;
    return `## Teacher Statistics\n\n- **Total Registered Teachers:** ${teachers.length}\n- **Active Teachers:** ${active}\n- **Other Status:** ${teachers.length - active}\n\nTeachers are distributed across ${schools.length} registered schools.`;
  }

  if (msg.includes('retire') || msg.includes('retirement')) {
    const now = new Date();
    const retiring = teachers.filter((t: any) => {
      if (!t.retirementDate) return false;
      const rd = new Date(t.retirementDate);
      const months = (rd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return months <= 12 && months >= 0;
    });
    if (retiring.length === 0) return "No teachers are scheduled to retire within the next 12 months.";
    return `## Teachers Retiring Within 12 Months\n\n${retiring.map((t: any) => `- **${t.firstName} ${t.lastName}** — ${data.schools?.find((s: any) => s.id === t.schoolId)?.name || 'Unknown School'} (Retirement: ${t.retirementDate})`).join('\n')}\n\n**Action Required:** Plan for replacements to maintain teacher coverage.`;
  }

  // Inspection-related queries
  if (msg.includes('inspection') || msg.includes('zone') && msg.includes('performance')) {
    if (inspections.length === 0) return "No inspection data is currently available.";
    const byZone: Record<string, number[]> = {};
    inspections.forEach((i: any) => {
      const school = schools.find((s: any) => s.id === i.schoolId);
      const zone = school?.zone || 'Unknown';
      if (!byZone[zone]) byZone[zone] = [];
      byZone[zone].push(i.score);
    });
    const summary = Object.entries(byZone).map(([zone, scores]: [string, number[]]) => ({
      zone,
      avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      count: scores.length
    })).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));
    return `## Inspection Performance by Zone\n\n| Zone | Avg Score | Inspections |\n|------|-----------|-------------|\n${summary.map(z => `| ${z.zone} | ${z.avg} | ${z.count} |`).join('\n')}\n\nScores are out of 100. Zones scoring below 60 may require targeted support.`;
  }

  // Resource queries
  if (msg.includes('resource') || msg.includes('shortage')) {
    if (resources.length === 0) return "No resource data is currently available.";
    const critical = resources.filter((r: any) => r.status === 'Critical' || r.quantity < 5);
    if (critical.length === 0) return "No critical resource shortages identified at this time.";
    return `## Critical Resource Shortages\n\n${critical.map((r: any) => `- **${r.name}**: Quantity ${r.quantity} (Status: ${r.status || 'Low'})`).join('\n')}\n\n**Recommendation:** Prioritize procurement for items marked Critical.`;
  }

  // School queries
  if (msg.includes('school') && (msg.includes('how many') || msg.includes('count') || msg.includes('total'))) {
    const byType: Record<string, number> = {};
    schools.forEach((s: any) => { byType[s.type] = (byType[s.type] || 0) + 1; });
    return `## School Registry Summary\n\n- **Total Schools:** ${schools.length}\n\n**By Type:**\n${Object.entries(byType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}`;
  }

  if (msg.includes('enrollment') || msg.includes('enrolment')) {
    const totalEnrollment = schools.reduce((sum: number, s: any) => sum + (s.enrollment?.total || 0), 0);
    const avgEnrollment = schools.length > 0 ? Math.round(totalEnrollment / schools.length) : 0;
    return `## Enrollment Overview\n\n- **Total Students Enrolled:** ${totalEnrollment.toLocaleString()}\n- **Average per School:** ${avgEnrollment}\n- **Schools with Data:** ${schools.filter((s: any) => s.enrollment?.total > 0).length} of ${schools.length}`;
  }

  // TPD queries
  if (msg.includes('tpd') || msg.includes('professional development') || msg.includes('training')) {
    return `## Teacher Professional Development (TPD)\n\n- **Total TPD Programs:** ${tpd.length}\n\nTPD programs help improve teacher competency and school performance. Regular participation is encouraged for all registered teachers.`;
  }

  // Summary/overview
  if (msg.includes('summary') || msg.includes('overview') || msg.includes('report')) {
    return `## EMIS System Overview\n\n| Category | Count |\n|----------|-------|\n| Schools | ${schools.length} |\n| Teachers | ${teachers.length} |\n| Inspections | ${inspections.length} |\n| TPD Programs | ${tpd.length} |\n| Resources Tracked | ${resources.length} |\n\nThe system covers schools across multiple zones in the region. Use the sidebar to navigate to specific modules for detailed data entry and reporting.`;
  }

  // Default helpful response
  return `## EMIS Data Assistant\n\nI can help you analyze your EMIS data. Here are some things you can ask:\n\n- **Teachers:** "Which schools have the lowest teacher-to-student ratio?" or "How many teachers are retiring soon?"\n- **Inspections:** "Summarize inspection performance by zone"\n- **Resources:** "What are the critical resource shortages?"\n- **Schools:** "How many schools are registered?" or "Show enrollment overview"\n- **Overview:** "Give me a system summary"\n\nCurrent data loaded: **${schools.length}** schools, **${teachers.length}** teachers, **${inspections.length}** inspections.`;
}

export const EMISAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm your EMIS Assistant. I can help you analyze school data, teacher performance, inspection results, and resource distribution. What would you like to know today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const data = await dataService.getAllData();
      const aiResponse = await generateLocalResponse(userMessage, data);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error: any) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I encountered an error while analyzing the data: ${error.message}. Please check your connection to the backend server.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Which schools have the lowest teacher-to-student ratio?",
    "Summarize the inspection performance by zone.",
    "Which teachers are retiring soon?",
    "What are the critical resource shortages?",
    "Give me a system summary.",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={24} />
            EMIS Data Assistant
          </h2>
          <p className="text-sm text-zinc-500">Intelligent data analysis powered by local rule-based engine — no external AI required.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
          <Cpu size={14} />
          Local Engine · No API Key Needed
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'assistant' ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-600"
              )}>
                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'assistant' 
                  ? "bg-zinc-50 text-zinc-800 border border-zinc-100" 
                  : "bg-emerald-600 text-white"
              )}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot size={20} />
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 text-zinc-800 border border-zinc-100 shadow-sm flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-emerald-500" />
                <span className="text-sm font-medium italic">Analyzing EMIS data...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search size={12} />
              Try asking about
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-zinc-50/50 border-t border-zinc-100">
          <div className="relative flex items-center gap-2">
            <Input
              placeholder="Ask anything about the EMIS data..."
              className="pr-12 h-12 rounded-2xl border-zinc-200 focus:ring-emerald-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              className="absolute right-1.5 h-9 w-9 p-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-center text-zinc-400">
            Responses are generated from live EMIS data using a local rule-based engine. No external API required.
          </p>
        </div>
      </div>
    </div>
  );
};
