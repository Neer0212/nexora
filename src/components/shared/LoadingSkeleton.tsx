import React from 'react';

export function CardSkeleton() {
  return (
    <div className="p-6 bg-[var(--nexora-surface)] rounded-2xl border border-[var(--nexora-border)] shadow-[0_12px_35px_rgba(23,21,59,0.04)] animate-pulse flex flex-col space-y-4">
      <div className="h-4 bg-[var(--nexora-border)] rounded w-1/3"></div>
      <div className="h-8 bg-[var(--nexora-background)] rounded w-1/2"></div>
      <div className="h-4 bg-[var(--nexora-border)] rounded w-full"></div>
      <div className="h-4 bg-[var(--nexora-border)] rounded w-4/5"></div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="w-full bg-[var(--nexora-surface)] rounded-2xl border border-[var(--nexora-border)] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--nexora-border)] bg-[var(--nexora-background)]">
        <div className="h-5 bg-[var(--nexora-border)] rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex space-x-4 animate-pulse">
              <div className="h-4 bg-[var(--nexora-background)] rounded w-1/4"></div>
              <div className="h-4 bg-[var(--nexora-border)] rounded w-1/4"></div>
              <div className="h-4 bg-[var(--nexora-background)] rounded w-1/4"></div>
              <div className="h-4 bg-[var(--nexora-border)] rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-[1500px] mx-auto p-6 lg:p-8 space-y-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="space-y-2">
          <div className="h-8 bg-[var(--nexora-border)] rounded w-64"></div>
          <div className="h-4 bg-[var(--nexora-background)] rounded w-96"></div>
        </div>
        <div className="h-10 bg-[var(--nexora-border)] rounded w-32"></div>
      </div>

      {/* Stats/Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TableSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
