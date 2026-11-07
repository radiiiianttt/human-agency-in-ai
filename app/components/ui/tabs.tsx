'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import type {ComponentProps} from 'react';

export function Tabs({className = '', ...props}: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root {...props} className={`ui-tabs ${className}`} data-slot="tabs"/>;
}
export function TabsList({className = '', ...props}: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List {...props} className={`ui-tabs-list ${className}`} data-slot="tabs-list"/>;
}
export function TabsTrigger({className = '', ...props}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger {...props} className={`ui-tabs-trigger ${className}`} data-slot="tabs-trigger"/>;
}
export function TabsContent({className = '', ...props}: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content {...props} className={`ui-tabs-content ${className}`} data-slot="tabs-content"/>;
}
