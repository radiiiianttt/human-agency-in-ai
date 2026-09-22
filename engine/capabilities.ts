export const CAPABILITIES = {
  list: ["add_item"],
  task: ["create"],
  document: ["create", "edit", "delete"],
  calendar: ["move", "cancel"],
  message: ["send"],
  account: ["delete"],
  finance: ["transfer"],
} as const;

export type ResourceType = keyof typeof CAPABILITIES;

export type CapabilityOperation<T extends ResourceType> =
  (typeof CAPABILITIES)[T][number];

export function isSupportedCapability(
  resourceType: ResourceType,
  operation: string
): boolean {
  return (CAPABILITIES[resourceType] as readonly string[]).includes(operation);
}