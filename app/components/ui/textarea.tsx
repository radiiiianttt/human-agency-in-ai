import type {ComponentProps} from 'react';

export function Textarea({className = '', compact = false, ...props}: ComponentProps<'textarea'> & {compact?: boolean}) {
  return <textarea {...props} data-slot="textarea" data-compact={compact || undefined} className={`ui-textarea ${className}`}/>;
}
