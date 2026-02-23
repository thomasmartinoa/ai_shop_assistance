'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Simple Sheet using CSS without @radix-ui/react-dialog dependency conflicts
interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  return <>{children}</>;
};

const SheetTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, onClick, ...props }, ref) => (
    <button ref={ref} className={className} onClick={onClick} {...props}>{children}</button>
  )
);
SheetTrigger.displayName = 'SheetTrigger';

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right' | 'top' | 'bottom';
  open?: boolean;
  onClose?: () => void;
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, side = 'right', open, onClose, ...props }, ref) => {
    if (!open) return null;
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
        <div
          ref={ref}
          className={cn(
            'fixed z-50 gap-4 bg-background p-6 shadow-lg',
            side === 'left' && 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm',
            side === 'right' && 'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm',
            side === 'top' && 'inset-x-0 top-0 w-full',
            side === 'bottom' && 'inset-x-0 bottom-0 w-full',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);

const SheetTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref as any} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
);
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
);
SheetDescription.displayName = 'SheetDescription';

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
