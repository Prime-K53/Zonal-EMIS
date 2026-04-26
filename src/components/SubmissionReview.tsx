import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  History, 
  ArrowLeft, 
  Save, 
  X, 
  AlertCircle,
  MessageSquare,
  FileText,
  Clock,
  User,
  ShieldCheck
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Submission, SubmissionAuditLog } from '../types';

interface SubmissionReviewProps {
  submissionId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export const SubmissionReview: React.FC<SubmissionReviewProps> = ({ submissionId, onBack, onUpdate }) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [auditLogs, setAuditLogs] = useState<SubmissionAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editReason, setEditReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/submissions/${submissionId}`);
        if (res.ok) {
          const data = await res.json();
          setSubmission(data);
          setEditData(data.data);
        }
        
        const logs = await dataService.getSubmissionAuditLogs(submissionId);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to fetch submission details', err);
        setError('Failed to load submission details');
        toast.error('Failed to load submission details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [submissionId]);

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !feedback) {
      setError('Please provide feedback for rejection');
      return;
    }

    setLoading(true);
    try {
      await dataService.updateSubmissionStatus(submissionId, status, feedback);
      toast.success(`Submission ${status.toLowerCase()} successfully`);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
      toast.error(err.message || 'Failed to update status');
      setLoading(false);
    }
  };

  const handleTDCEdit = async () => {
    if (!editReason) {
      setError('Please provide a reason for the edit');
      return;
    }

    setLoading(true);
    try {
      await dataService.editSubmissionByTDC(submissionId, editData, editReason);
      toast.success('Submission updated successfully');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to save edits');
      toast.error(err.message || 'Failed to save edits');
      setLoading(false);
    }
  };

  if (loading && !submission) {
    return (
      <div className="p-20 text-center">
        <div className="w-12 h-12 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#5A5A40]/60 italic">Loading submission details...</p>
      </div>
    );
  }

  if (!submission) return null;

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[#5A5A40]/60 hover:text-[#5A5A40] mb-8 transition-all font-medium"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-[#5A5A40]/10 overflow-hidden"
          >
            <div className="p-8 border-b border-[#5A5A40]/10 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-[#1a1a1a]">Manage Record</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                    submission.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    submission.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {submission.status === 'APPROVED' ? 'FINALIZED' : submission.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[#5A5A40]/60 italic font-serif">
                  {submission.type.replace(/_/g, ' ')} for School ID: {submission.schoolId}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAudit(!showAudit)}
                  className={`p-3 rounded-xl transition-all ${showAudit ? 'bg-[#5A5A40] text-white' : 'bg-[#f5f5f0] text-[#5A5A40] hover:bg-[#5A5A40]/10'}`}
                  title="View Audit History"
                >
                  <History size={20} />
                </button>
                {!isEditing && submission.status !== 'APPROVED' && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-3 bg-[#f5f5f0] text-[#5A5A40] rounded-xl hover:bg-[#5A5A40]/10 transition-all"
                    title="Edit Data"
                  >
                    <Edit3 size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-8">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm mb-8">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              {isEditing ? (
                <div className="space-y-8">
                  <div className="p-8 bg-[#f5f5f0]/30 rounded-3xl border border-[#5A5A40]/10">
                    <h3 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                      <Edit3 size={18} className="text-[#5A5A40]" />
                      Editing Submission Data
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      {Object.keys(editData).map(key => (
                        <div key={key} className="space-y-2">
                          <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                          <input 
                            type={typeof editData[key] === 'number' ? 'number' : 'text'}
                            value={editData[key]}
                            onChange={(e) => setEditData({ ...editData, [key]: typeof editData[key] === 'number' ? parseInt(e.target.value) : e.target.value })}
                            className="w-full p-3 bg-white border border-[#5A5A40]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 font-sans"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} />
                      Reason for Modification (Required)
                    </label>
                    <textarea 
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="w-full p-4 bg-[#f5f5f0]/50 border border-[#5A5A40]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 font-sans min-h-[100px]"
                      placeholder="Explain why this data is being modified by a TDC Officer..."
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(submission.data);
                        setEditReason('');
                      }}
                      className="px-8 py-4 text-[#5A5A40] font-bold hover:bg-[#f5f5f0] rounded-2xl transition-all"
                    >
                      Cancel Edits
                    </button>
                    <button 
                      onClick={handleTDCEdit}
                      disabled={loading}
                      className="px-10 py-4 bg-[#5A5A40] text-white font-bold rounded-2xl shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all flex items-center gap-2"
                    >
                      <Save size={20} />
                      {loading ? "Saving..." : "Save & Log Modification"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    {Object.entries(submission.data).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-6 bg-[#f5f5f0]/20 rounded-2xl border border-[#5A5A40]/5">
                        <p className="text-xs text-[#5A5A40]/40 uppercase tracking-widest mb-1 font-sans">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-2xl font-bold text-[#1a1a1a]">{value.toString()}</p>
                      </div>
                    ))}
                  </div>

                  {submission.feedback && (
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                      <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                        <MessageSquare size={16} />
                        Reviewer Feedback
                      </h4>
                      <p className="text-amber-700 italic text-sm">"{submission.feedback}"</p>
                    </div>
                  )}

                  {submission.status === 'PENDING' && (
                    <div className="pt-8 border-t border-[#5A5A40]/10 space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[#5A5A40] uppercase tracking-widest">Add Review Feedback</label>
                        <textarea 
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full p-4 bg-[#f5f5f0]/50 border border-[#5A5A40]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 font-sans min-h-[100px]"
                          placeholder="Provide feedback for the TDC Officer..."
                        />
                      </div>
                      <div className="flex justify-end gap-4">
                        <button 
                          onClick={() => handleStatusUpdate('REJECTED')}
                          disabled={loading}
                          className="px-8 py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-all flex items-center gap-2"
                        >
                          <XCircle size={20} />
                          Archive Record
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate('APPROVED')}
                          disabled={loading}
                          className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 size={20} />
                          Finalize Record
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-[#5A5A40]/10 shadow-sm">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
              <FileText size={18} className="text-[#5A5A40]" />
              Record Info
            </h3>
            <div className="space-y-4">
              <InfoRow icon={<User size={14} />} label="Officer ID" value={submission.userId} />
              <InfoRow icon={<Clock size={14} />} label="Recorded On" value={new Date(submission.createdAt).toLocaleString()} />
              <InfoRow icon={<Clock size={14} />} label="Last Modified" value={new Date(submission.updatedAt).toLocaleString()} />
              <InfoRow icon={<ShieldCheck size={14} />} label="Version" value={`v${submission.version}`} />
            </div>
          </div>

          <AnimatePresence>
            {showAudit && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-8 rounded-3xl border border-[#5A5A40]/10 shadow-sm"
              >
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                  <History size={18} className="text-[#5A5A40]" />
                  Audit History
                </h3>
                <div className="space-y-6">
                  {auditLogs.length > 0 ? auditLogs.map(log => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-[#5A5A40]/10 pb-6 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-[#5A5A40] rounded-full" />
                      <p className="text-xs font-bold text-[#1a1a1a] mb-1">{new Date(log.timestamp).toLocaleString()}</p>
                      <p className="text-xs text-[#5A5A40]/60 italic mb-2">"{log.reason}"</p>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#5A5A40]/10 rounded-full flex items-center justify-center">
                          <User size={10} className="text-[#5A5A40]" />
                        </div>
                        <p className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-tighter">Modified by TDC</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-[#5A5A40]/40 italic text-center py-4">No modifications recorded.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 text-[#5A5A40]/40">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-[#1a1a1a] break-all">{value}</p>
    </div>
  </div>
);
