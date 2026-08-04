'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// ── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  bg: '#0A0A0B',
  surface: '#141416',
  border: '#2A2A2E',
  text1: '#FFFFFF',
  text2: '#A1A1AA',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',
};

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast('success', message, duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast('error', message, duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast('warning', message, duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast('info', message, duration);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} color={THEME.success} />;
      case 'error': return <XCircle size={20} color={THEME.error} />;
      case 'warning': return <AlertCircle size={20} color={THEME.warning} />;
      case 'info': return <Info size={20} color={THEME.info} />;
    }
  };

  const getBackgroundColor = (type: ToastType) => {
    switch (type) {
      case 'success': return `${THEME.success}15`;
      case 'error': return `${THEME.error}15`;
      case 'warning': return `${THEME.warning}15`;
      case 'info': return `${THEME.info}15`;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success': return `${THEME.success}30`;
      case 'error': return `${THEME.error}30`;
      case 'warning': return `${THEME.warning}30`;
      case 'info': return `${THEME.info}30`;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              minWidth: 320,
              maxWidth: 420,
              padding: 16,
              borderRadius: 12,
              background: getBackgroundColor(toast.type),
              border: `1px solid ${getBorderColor(toast.type)}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              {getIcon(toast.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: 14, 
                fontWeight: 500, 
                color: THEME.text1,
                lineHeight: 1.5,
              }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                flexShrink: 0,
                width: 24,
                height: 24,
                borderRadius: 4,
                background: 'transparent',
                border: 'none',
                color: THEME.text2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = THEME.text1}
              onMouseLeave={(e) => e.currentTarget.style.color = THEME.text2}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}