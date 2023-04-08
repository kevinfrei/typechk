/**
 * A symbol used to assist with the Pickle/Unpickle stuff for custom types
 * If this symbol is present on your object, it will pass typechecking without
 * validation, and can be registered with the Pickle JSON marshalling code
 *
 * @example
 * const myObj = {a:b, FreikTypeTag:Symbol.for('uniqName.MyType'), c:JustACache()};
 *
 */
export const FreikTypeTag = Symbol.for('freik.typetag');

/**
 * This is, in spirit, a "json"-able object
 */
export type SimpleObject =
  | string
  | number
  | boolean
  | null
  | { [key: string | number]: SimpleObject }
  | SimpleObject[];

/**
 * Shorthand for a function that will validate the type of an unknown object
 * for the Typescript type-checker.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type typecheck<T> = (val: unknown) => val is T;

// eslint-disable-next-line @typescript-eslint/naming-convention
export type boolcheck = (val: unknown) => boolean;
