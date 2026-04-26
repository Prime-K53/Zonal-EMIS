import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ className, title, description, children, footer, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="p-6 border-bottom border-zinc-100">
          {title && <h3 className="text-lg font-semibold text-zinc-900 leading-none tracking-tight">{title}</h3>}
          {description && <p className="text-sm text-zinc-500 mt-1.5">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && <div className="p-6 bg-zinc-50 border-t border-zinc-100">{footer}</div>}
    </div>
  );
};
