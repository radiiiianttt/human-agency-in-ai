import type {ComponentProps} from 'react';

export function Input({className = '', ...props}: ComponentProps<'input'>) {
  return <input {...props} data-slot="input" className={`ui-input ${className}`}/>;
}
