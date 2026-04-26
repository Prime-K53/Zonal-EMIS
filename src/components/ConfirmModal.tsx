import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
              variant === 'danger' ? "bg-red-100 text-red-600" : 
              variant === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
            )}>
              <AlertTriangle size={24} />
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-black text-zinc-900 mb-2 tracking-tight">{title}</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">{message}</p>
        </div>
        
        <div className="p-6 bg-zinc-50 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            className={cn(
              "flex-1 rounded-xl",
              variant === 'danger' ? "bg-red-600 hover:bg-red-700" : 
              variant === 'warning' ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
            )}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
