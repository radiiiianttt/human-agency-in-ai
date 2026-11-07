import type {ComponentProps, ReactNode} from 'react';

export function Collapsible({summary, children, className = '', ...props}: Omit<ComponentProps<'details'>, 'children'> & {summary: ReactNode; children: ReactNode}) {
  return <details {...props} data-slot="collapsible" className={`ui-collapsible ${className}`}>
    <summary>{summary}<img className="ui-collapsible-chevron" src="/design-system/accordion-chevron.svg" width={16} height={16} alt="" aria-hidden="true"/></summary>
    {children}
  </details>;
}
