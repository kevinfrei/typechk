export const FreikTypeTag = Symbol.for('freik.typetag');

export type SimpleObject =
  | string
  | number
  | boolean
  | null
  | { [key: string | number]: SimpleObject }
  | SimpleObject[];

// eslint-disable-next-line @typescript-eslint/naming-convention
export type typecheck<T> = (val: unknown) => val is T;
// eslint-disable-next-line @typescript-eslint/naming-convention
export type boolcheck = (val: unknown) => boolean;
