import type {HTMLAttributes} from 'react';

export function Card({as: Tag = 'div', className = '', ...props}: HTMLAttributes<HTMLElement> & {as?: 'div' | 'article' | 'section'}) {
  return <Tag {...props} data-slot="card" className={`ui-card ${className}`}/>;
}
