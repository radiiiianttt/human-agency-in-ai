import type {ComponentProps} from 'react';

export function Label({className = '', ...props}: ComponentProps<'label'>) {
  return <label {...props} data-slot="label" className={`ui-label ${className}`}/>;
}
