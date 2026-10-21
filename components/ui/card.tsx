import type { ComponentProps } from 'react';
import { cn } from '@/lib/utilis';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-xl border border-line bg-panel p-5', className)} {...props} />;
}