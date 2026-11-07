'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type {ComponentProps, ReactNode} from 'react';
import {Button} from './button';

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
  onCloseAutoFocus?: ComponentProps<typeof DialogPrimitive.Content>['onCloseAutoFocus'];
};

export function Sheet({open, onOpenChange, title, description, className = '', children, onCloseAutoFocus}: SheetProps) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="ui-sheet-overlay"/>
      <DialogPrimitive.Content className={`ui-sheet ${className}`} data-slot="sheet" onCloseAutoFocus={onCloseAutoFocus}>
        <header className="drawer-header">
          <div><span className="step-label">SECONDARY VIEW</span><DialogPrimitive.Title className="ui-sheet-title">{title}</DialogPrimitive.Title></div>
          <DialogPrimitive.Close asChild><Button variant="ghost" size="icon" className="close-button" aria-label="Close panel"><span aria-hidden="true">×</span></Button></DialogPrimitive.Close>
        </header>
        <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
