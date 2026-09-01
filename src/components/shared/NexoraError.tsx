"use client";

import React from 'react';
import { AlertTriangle, ShieldAlert, WifiOff, XCircle } from 'lucide-react';

export type ErrorType = 'AUTH_REQUIRED' | 'DATA_ACCESS_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';

interface NexoraErrorProps {
  title?: string;
  message?: string;
  errorType?: ErrorType;
  reset?: () => void;
}

export function NexoraError({ 
  title = "An Error Occurred", 
  message = "Something went wrong while processing your request.", 
  errorType = 'UNKNOWN_ERROR',
  reset 
}: NexoraErrorProps) {
  
  const getIcon = () => {
    switch (errorType) {
      case 'AUTH_REQUIRED':
        return <ShieldAlert className="w-12 h-12 text-[var(--nexora-warning)] mb-4" />;
      case 'DATA_ACCESS_DENIED':
        return <AlertTriangle className="w-12 h-12 text-[var(--nexora-danger)] mb-4" />;
      case 'NETWORK_ERROR':
        return <WifiOff className="w-12 h-12 text-[var(--nexora-muted)] mb-4" />;
      default:
        return <XCircle className="w-12 h-12 text-[var(--nexora-danger)] mb-4" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[var(--nexora-surface)] rounded-2xl shadow-[0_12px_35px_rgba(23,21,59,0.04)] border border-[var(--nexora-border)] text-center max-w-md mx-auto my-8">
      {getIcon()}
      <h3 className="text-xl font-semibold text-[var(--nexora-ink)] mb-2">{title}</h3>
      <p className="text-[var(--nexora-muted)] text-sm mb-6">{message}</p>
      
      {reset && (
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[var(--nexora-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--nexora-indigo)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--nexora-lavender)] focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
