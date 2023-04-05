/* eslint-disable no-empty */
import {
  hasFieldType,
  hasStrField,
  is2Tuple,
  isArray,
  isArrayOf,
  isBigInt,
  isDate,
  isFunction,
  isIterable,
  isMap,
  isRegex,
  isSet,
  isSimpleObject,
  isString,
  isSymbol,
} from './TypeChk.js';
import { FreikTypeTag, SimpleObject, typecheck } from './Types.js';

type FlattenedCustom = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '@dataType': string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '@dataValue': SimpleObject;
};

function isFlattened(obj: unknown): obj is FlattenedCustom {
  return (
    hasStrField(obj, '@dataType') &&
    hasFieldType(obj, '@dataValue', isSimpleObject)
  );
}

function MakeFlat(name: string, data: SimpleObject): FlattenedCustom {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return { '@dataType': name, '@dataValue': data };
}

function GetFlat(val: FlattenedCustom): [string, SimpleObject] {
  return [val['@dataType'], val['@dataValue']];
}

const SetTag = Symbol.for('freik.Set');
const MapTag = Symbol.for('freik.Map');
const SymbolTag = Symbol.for('freik.Symbol');
const RegexTag = Symbol.for('freik.RegExp');
const DateTag = Symbol.for('freik.Date');
const BigIntTag = Symbol.for('freik.BigInt');

export type ToFlat<T> = (data: T) => SimpleObject;
export type FromFlat<T> = (data: SimpleObject) => T | undefined;

function MapPickle(val: Map<unknown, unknown>): [unknown, unknown][] {
  return [...val.entries()];
}

function MapUnpickle(val: SimpleObject): Map<unknown, unknown> | undefined {
  return isArrayOf(val, is2Tuple)
    ? new Map(val)
    : /* istanbul ignore next */
      undefined;
}

function SetPickle(val: Set<unknown>): unknown[] {
  return [...val];
}

function SetUnpickle(val: unknown): Set<unknown> | undefined {
  return isArray(val) ? new Set(val) : /* istanbul ignore next */ undefined;
}

function SymbolPickle(val: symbol): string {
  const theKey = Symbol.keyFor(val);
  /* istanbul ignore if */
  if (theKey === undefined)
    throw new Error('Unable to get a key for a symbol for pickling');
  return theKey;
}

function SymbolUnpickle(val: unknown): symbol | undefined {
  return isString(val) ? Symbol.for(val) : /* istanbul ignore next */ undefined;
}

function RegexPickle(val: RegExp): { source: string; flags: string } {
  return { source: val.source, flags: val.flags };
}

function RegexUnpickle(val: unknown): RegExp | undefined {
  /* istanbul ignore else */
  if (hasStrField(val, 'source') && hasStrField(val, 'flags')) {
    return new RegExp(val.source, val.flags);
  }
}

function DatePickle(val: Date): string {
  return val.toJSON();
}

function DateUnpickle(val: unknown): Date | undefined {
  try {
    /* istanbul ignore next */
    return isString(val) ? new Date(val) : undefined;
  } catch (e) {
    /* istanbul ignore next */
    return undefined;
  }
}

function BigIntPickle(val: bigint): string {
  return val.toString();
}

function BigIntUnpickle(val: unknown): bigint | undefined {
  try {
    /* istanbul ignore next */
    return isString(val) ? BigInt(val) : undefined;
  } catch (e) {
    /* istanbul ignore next */
    return undefined;
  }
}

const builtInPickleTypes: [typecheck<unknown>, symbol][] = [
  [isMap, MapTag],
  [isSet, SetTag],
  [isSymbol, SymbolTag],
  [isRegex, RegexTag],
  [isDate, DateTag],
  [isBigInt, BigIntTag],
];

const picklers = new Map<symbol, ToFlat<unknown>>([
  [MapTag, MapPickle as ToFlat<unknown>],
  [SetTag, SetPickle as ToFlat<unknown>],
  [SymbolTag, SymbolPickle as ToFlat<unknown>],
  [RegexTag, RegexPickle as ToFlat<unknown>],
  [DateTag, DatePickle as ToFlat<unknown>],
  [BigIntTag, BigIntPickle as ToFlat<unknown>],
]);

const unpicklers = new Map<symbol, FromFlat<unknown>>([
  [MapTag, MapUnpickle],
  [SetTag, SetUnpickle],
  [SymbolTag, SymbolUnpickle],
  [RegexTag, RegexUnpickle],
  [DateTag, DateUnpickle],
  [BigIntTag, BigIntUnpickle],
]);

function getPickler(obj: unknown): [symbol, ToFlat<unknown>] | undefined {
  if (hasFieldType(obj, FreikTypeTag, isSymbol)) {
    const s = obj[FreikTypeTag];
    const p = picklers.get(s);
    if (p) {
      return [s, p];
    } else if (hasFieldType(obj, 'toJSON', isFunction)) {
      return [
        s,
        (val: unknown): string =>
          hasFieldType(val, 'toJSON', isFunction)
            ? (val.toJSON() as string)
            : /* istanbul ignore next */
              'ERROR',
      ];
    }
  }
  // If we don't have a PickleTag, then check to see if it's a built-in type
  // that we'll handle properly
  for (const [checker, symb] of builtInPickleTypes) {
    if (checker(obj)) {
      const p = picklers.get(symb);
      if (p) {
        return [symb, p];
      }
    }
  }
}

function getUnpickler(keyName: string): FromFlat<any> | undefined {
  return unpicklers.get(Symbol.for(keyName));
}

function replacer(
  this: any,
  key: string,
  value: unknown,
): unknown | FlattenedCustom {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const originalObject: unknown = this[key];
  const pickler = getPickler(originalObject);
  if (pickler) {
    const [sym, toFlat] = pickler;
    const keyFor = Symbol.keyFor(sym);
    /* istanbul ignore if */
    if (!keyFor) {
      return value;
    }
    return MakeFlat(keyFor, toFlat(originalObject));
  } else if (isIterable(originalObject)) {
    return [...originalObject];
  }
  return value;
}

function reviver(key: unknown, value: unknown): unknown {
  if (isFlattened(value)) {
    const [name, forUnpickling] = GetFlat(value);
    const pickler = getUnpickler(name);
    if (pickler) {
      const res = pickler(forUnpickling) as unknown;
      if (res !== undefined) {
        return res;
      }
    }
  }
  return value;
}

export function Pickle(input: unknown): string {
  return JSON.stringify(input, replacer);
}

export function Unpickle(input: string): unknown {
  return JSON.parse(input, reviver);
}

export function UnsafelyUnpickle<T>(input: string): T {
  return Unpickle(input) as T;
}

export function SafelyUnpickle<T>(
  input: string,
  check: typecheck<T>,
): T | undefined {
  const res = UnsafelyUnpickle<unknown>(input);
  return check(res) ? res : undefined;
}

// You don't need a toString method, if you use toJSON on your object instead
export function RegisterForPickling<T>(
  pickleTag: symbol,
  fromString: FromFlat<T>,
  toString?: ToFlat<T>,
): void {
  if (toString) {
    picklers.set(pickleTag, toString as ToFlat<unknown>);
  }
  unpicklers.set(pickleTag, fromString);
}
