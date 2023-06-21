import { FreikTypeTag, SimpleObject, boolcheck, typecheck } from './Types.js';

/**
 * Type check for undefined
 *
 * @param {unknown} obj - The value being checked
 * @returns {boolean} true iff `obj` is undefined
 */
export function isUndefined(obj: unknown): obj is undefined {
  return obj === undefined;
}

/**
 * Type check for a defined value
 *
 * @param {unknown} obj - The value being checked
 * @returns true if the `obj` is NOT undefined
 */
export function isDefined(obj: unknown): obj is NonNullable<unknown> | null {
  return !isUndefined(obj);
}

/**
 * Type check for null
 *
 * @param {unknown} obj - The value being checked
 * @returns true if the object is null
 */
export function isNull(obj: unknown): obj is null {
  return obj === null;
}

/**
 * Type check for null or undefined
 *
 * @param {unknown} obj - The value being checked
 * @returns true if the object is null or undefined
 */
export function isEmpty(obj: unknown): obj is null | undefined {
  return obj === undefined || obj === null;
}

/**
 * Type check for NOT empty (nonnullable)
 *
 * @param {unknown} obj - The value being checked
 * @returns true if the object is a NonNullable
 */
export function isNonNullable(obj: unknown): obj is NonNullable<unknown> {
  return !isEmpty(obj);
}

/**
 * Type check for one of two types
 *
 * @param {unknown} obj - The value being checked
 * @param chk1 - Type Checker #1
 * @param chk2 - Type Checker #2
 * @returns true if the object is either type T or type U
 */
export function isOneOf<T, U>(
  obj: unknown,
  chk1: typecheck<T>,
  chk2: typecheck<U>,
): obj is T | U {
  return chk1(obj) || chk2(obj);
}

/**
 * Generate a type check function for one of two types
 *
 * @param chk1 - Type Checker #1
 * @param chk2 - Type Checker #2
 * @returns A type check function for {@link isOneOf}
 */
export function chkOneOf<T, U>(
  chk1: typecheck<T>,
  chk2: typecheck<U>,
): typecheck<T | U> {
  return (obj: unknown): obj is T | U => isOneOf(obj, chk1, chk2);
}

/**
 * Type check for meeting both of two types
 *
 * @param {unknown} obj - The value being checked
 * @param chk1 - Type Checker #1
 * @param chk2 - Type Checker #2
 * @returns true if the object is both type T and type U
 */
export function isBothOf<T, U>(
  obj: unknown,
  chk1: typecheck<T>,
  chk2: typecheck<U>,
): obj is T & U {
  return chk1(obj) && chk2(obj);
}

/**
 * Generate a type check function for two types
 *
 * @param chk1 - Type Checker #1
 * @param chk2 - Type Checker #2
 * @returns A type check function for {@link isOneOf}
 */
export function chkBothOf<T, U>(
  chk1: typecheck<T>,
  chk2: typecheck<U>,
): typecheck<T & U> {
  return (obj: unknown): obj is T & U => isBothOf(obj, chk1, chk2);
}

/**
 * Type check for a non-null object
 *
 * @param {unknown} obj - The value being checked
 * @returns true if the value is an object, and is not null
 */
export function isObjectNonNull(obj: unknown): obj is NonNullable<object> {
  return isBothOf(obj, isObject, isNonNullable);
}

/**
 * Type check for object (or null)
 *
 * @param {unknown} obj - The value being checked
 * @returns True if obj is null, or an object (of any type)
 */
export function isObject(obj: unknown): obj is object | null {
  return typeof obj === 'object';
}

/**
 * Type check for an array (of any type)
 *
 * @param {unknown} obj - The value being checked
 * @returns True if obj is an array (of any type)
 */
export function isArray(obj: unknown): obj is unknown[] {
  return Array.isArray(obj);
}

/**
 * Type check for 2 element tuples
 *
 * @param {unknown} obj - The value being checked
 * @returns True of obj is a 2 element tuple (of any type!)
 */
export function is2Tuple(obj: unknown): obj is [unknown, unknown] {
  return Array.isArray(obj) && obj.length === 2;
}

/**
 * Type check for 3 element tuples
 *
 * @param {unknown} obj - The value being checked
 * @returns True of obj is a 3 element tuple (of any type!)
 */
export function is3Tuple(obj: unknown): obj is [unknown, unknown, unknown] {
  return Array.isArray(obj) && obj.length === 3;
}

/**
 * Generate a 'coercion' function that will return a value of type T,
 * either the object provided to the function, or `defVal` if it's not that type
 *
 * @param chk - The typecheck<T> function to validate the type
 * @param defVal - The value to return of the object isn't the correct type
 * @returns A function that takes an object and coerces it to type T
 */
export function as<T>(chk: typecheck<T>, defVal: T): (o: unknown) => T {
  return (o) => (chk(o) ? o : defVal);
}

/**
 * Type check for a string
 *
 * @param {unknown} obj - The value being checked
 * @returns True if `obj` is a string
 */
export function isString(obj: unknown): obj is string {
  return typeof obj === 'string';
}

/**
 * Type filtering for strings. Will NOT coerce the thing to a string..
 *
 * @param {unknown} obj - The value being coerced
 * @param notStr = the value to return if obj is not a string
 * @returns Either obj or notStr (whichever is a string)
 */
export function asString(obj: unknown, notStr = ''): string {
  return as(isString, notStr)(obj);
}

/**
 * Type coercion to a string. Will try to *lightly* coerce the thing to a string if possible.
 *
 * @param {unknown} obj - The value being coerced
 * @param notStr = the value to return if obj is not a string
 * @returns Either obj, obj.toString() or notStr (in that preferred order)
 */
export function toString(obj: unknown, notStr = ''): string {
  if (isString(obj)) {
    return obj;
  }
  if (isNumber(obj) || isDate(obj) || isBoolean(obj) || isBigInt(obj)) {
    try {
      const val = '' + (obj as any as string);
      if (isString(val)) {
        return val;
      }
    } catch (e) {}
  }
  if (hasFieldType(obj, 'toString', isFunction)) {
    try {
      const res: unknown = obj.toString();
      // A bit of a hack...
      if (isString(res) && res !== '[object Object]') {
        return res;
      }
    } catch (e) {}
  }
  return notStr;
}

/**
 * Type check for number (and not NaN)
 *
 * @param {unknown} obj - The value being checked
 * @returns True if obj is a number and NOT a NaN
 */
export function isNumber(obj: unknown): obj is number {
  return typeof obj === 'number' && !isNaN(obj - 0);
}

/**
 * If obj is a number (and not a NaN!) return that value, otherwise, return notNum
 *
 * @param {unknown} obj - The value being coerced
 * @param notNum - The value to return if obj is not a number (or a NaN)
 * @returns obj, if it's a number, otherwise returns nonNum
 */
export function asNumber(obj: unknown, notNum: number): number {
  return as(isNumber, notNum)(obj);
}

/**
 * Type check for number (and not NaN) or a string
 *
 * @param {unknown} obj - The value being checked
 * @returns True if obj is a number and NOT a NaN, or a string
 */
export const isNumberOrString: typecheck<number | string> = chkOneOf(
  isString,
  isNumber,
);

/**
 * If obj is a number (and not NaN) or a string, return that values, otherwise return notNumOrStr
 * @param  {unknown} obj
 * @param  {number|string} notNumOrStr
 * @returns {number|string} obj, if it's a number and NOT a NaN, or a string, otherwise notNumOrStr
 */
export function asNumberOrString(
  obj: unknown,
  notNumOrStr: number | string,
): number | string {
  return as(isNumberOrString, notNumOrStr)(obj);
}

/**
 * Type check for boolean
 * @param  {unknown} obj
 * @returns {boolean} true iff obj is a boolean expression
 */
export function isBoolean(obj: unknown): obj is boolean {
  return typeof obj === 'boolean';
}

/**
 * Type check for Date
 * @param  {unknown} obj
 * @returns {boolean} true iff obj is a Dat
 */
export function isDate(obj: unknown): obj is Date {
  return obj instanceof Date;
}

/**
 * Type check for BigInt
 * @param  {unknown} obj
 * @returns {boolean} true iff obj is a BigInt
 */
export function isBigInt(obj: unknown): obj is bigint {
  return typeof obj === 'bigint';
}

/**
 * Type check for Function
 * @param  {unknown} obj
 * @returns {boolean} true iff obj is a function
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction(obj: unknown): obj is Function {
  return typeof obj === 'function';
}

/**
 * Type check for RegExp
 * @param  {unknown} obj
 * @returns {boolean} true iff obj is a Regular Expression
 */
export function isRegex(obj: unknown): obj is RegExp {
  return obj instanceof RegExp;
}

/**
 * Type check for Map
 * @param  {unknown} obj
 * @returns {boolean} true iff obj is a Map (of any key and value type)
 */
export function isMap(obj: unknown): obj is Map<unknown, unknown> {
  return obj instanceof Map;
}

/**
 * Type check for Set
 * @param  {unknown} obj
 * @returns {boolean} true iff obj is a Set (of any key type)
 */
export function isSet(obj: unknown): obj is Set<unknown> {
  return obj instanceof Set;
}

/**
 * Type check for T[] (Array<T>)
 * @param  {unknown} obj
 * @param  {typecheck<T>} chk - TypeCheck function for Type T
 * @returns {boolean} true iff obj is an Array of type T (or an empty array!)
 */
export function isArrayOf<T>(obj: unknown, chk: typecheck<T>): obj is T[] {
  if (!isArray(obj)) return false;
  for (const t of obj) {
    if (!chk(t)) return false;
  }
  return true;
}

/**
 * Generate a type check function for T[] (Array<T>)
 * @param {typecheck<T>} chk - TypeCheck function for Type T
 * @returns {typecheck<T[]>} return a typechk function for {@link isArrayOf}
 */
export function chkArrayOf<T>(chk: typecheck<T>): typecheck<T[]> {
  return (obj: unknown): obj is T[] => isArrayOf(obj, chk);
}

/**
 * Type check for Tuple of [T, U]
 * @param  {unknown} obj
 * @param  {typecheck<T>} t - TypeCheck function for Type T
 * @param  {typecheck<U>} u - TypeCheck function for Type U
 * @returns {boolean} true iff obj is a Tuple of type [T, U]
 */
export function is2TupleOf<T, U>(
  obj: unknown,
  t: typecheck<T>,
  u: typecheck<U>,
): obj is [T, U] {
  return is2Tuple(obj) && t(obj[0]) && u(obj[1]);
}

/**
 * Generate a type check function for Tuple of [T, U]
 * @param  {typecheck<T>} t - TypeCheck function for Type T
 * @param  {typecheck<U>} u - TypeCheck function for Type U
 * @returns {typecheck<[T, U]>}
 */
export function chk2TupleOf<T, U>(
  t: typecheck<T>,
  u: typecheck<U>,
): typecheck<[T, U]> {
  return (obj: unknown): obj is [T, U] => is2TupleOf(obj, t, u);
}

/**
 * Type check for Tuple of [T, U, V]
 * @param  {unknown} obj
 * @param  {typecheck<T>} t - TypeCheck function for Type T
 * @param  {typecheck<U>} u - TypeCheck function for Type U
 * @param  {typecheck<V>} v - TypeCheck function for Type V
 * @returns {obj_is<Tuple<T, U, V>>}
 */
export function is3TupleOf<T, U, V>(
  obj: unknown,
  t: typecheck<T>,
  u: typecheck<U>,
  v: typecheck<V>,
): obj is [T, U, V] {
  return is3Tuple(obj) && t(obj[0]) && u(obj[1]) && v(obj[2]);
}
/**
 * Generate a type check function for Tuple of [T, U, V]
 * @param  {typecheck<T>} t - TypeCheck function for Type T
 * @param  {typecheck<U>} u - TypeCheck function for Type U
 * @param  {typecheck<V>} v - TypeCheck function for Type V
 * @returns {typecheck<[T, U, V]>}
 */
export function chk3TupleOf<T, U, V>(
  t: typecheck<T>,
  u: typecheck<U>,
  v: typecheck<V>,
): typecheck<[T, U, V]> {
  return (obj: unknown): obj is [T, U, V] => is3TupleOf(obj, t, u, v);
}
/**
 * Type check for string[]
 * @param  {unknown} obj
 * @returns {obj_is<string[]>}
 */
export function isArrayOfString(obj: unknown): obj is string[] {
  return isArrayOf(obj, isString);
}

/**
 * Filter obj to an array of strings. If defVal is an array of strings, even if
 * a single element of obj is not a string, defVal will be used instead. If
 * defVal is a string, it will be used to replace any values in obj that are not
 * strings. If defVal isn't provided, only strings will be left in obj.
 * @param  {unknown} obj
 * @param  {string[]|string} defVal?
 * @returns {string[]}
 */
export function asArrayOfString(
  obj: unknown,
  defVal?: string[] | string,
): string[] {
  if (!isArray(obj)) {
    return isArray(defVal) ? defVal : [];
  }
  if (isArray(defVal)) {
    return isArrayOf(obj, isString) ? obj : defVal;
  } else {
    return defVal === null || defVal === undefined
      ? (obj.filter((val) => isString(val)) as string[])
      : obj.map((val) => asString(val, defVal));
  }
}
/**
 * Coerce obj to an array of strings. If defVal is an array of strings, even if
 * a single element of obj is not a string, defVal will be used instead. If
 * defVal is a string, it will be used to replace any values in obj that cannot
 * be coerced to strings. If defVal isn't provided, only strings, or items that
 * can be coerced to strings, will be left in obj.
 * @param obj - The value being coerced to `string[]`
 * @param defVal? - The default value used for coercion
 */
export function toArrayOfString(
  obj: unknown,
  defVal?: string[] | string,
): string[] {
  if (!isArray(obj)) {
    // Return either defVal or an empty string
    return isArray(defVal) ? defVal : [];
  }
  const defStr = '$$HIGHLY@@UNLIKELY!!';
  const mapped = obj.map((val) => toString(val, defStr));
  if (isArray(defVal)) {
    // if we have *any* elements that can't be coerced to a string, use defVal
    if (mapped.indexOf(defStr) >= 0) {
      return defVal;
    } else {
      return mapped;
    }
  }
  return isNull(defVal) || isUndefined(defVal)
    ? mapped.filter((val) => val !== defStr)
    : mapped.map((val) => (val === defStr ? defVal : val));
}
/**
 * Type check for Map<K, V>
 * @param  {unknown} obj
 * @param  {typecheck<K>} key - A K type checking function (obj:unknown) => obj is K
 * @param  {typecheck<V>} val - A V type checking function (obj:unknown) => obj is V
 * @returns {obj_is<Map<K, V>>}
 */
export function isMapOf<K, V>(
  obj: unknown,
  key: typecheck<K>,
  val: typecheck<V>,
): obj is Map<K, V> {
  if (!isMap(obj)) return false;

  for (const [k, v] of obj) {
    if (!key(k)) return false;
    if (!val(v)) return false;
  }
  return true;
}
/**
 * Generate a type check function for Map<K, V>
 * @param  {typecheck<K>} key - A K type checking function (obj:unknown) => obj is K
 * @param  {typecheck<V>} val - A V type checking function (obj:unknown) => obj is V
 * @returns {typecheck<Map<K, V>>}
 */
export function chkMapOf<K, V>(
  key: typecheck<K>,
  val: typecheck<V>,
): typecheck<Map<K, V>> {
  return (obj: unknown): obj is Map<K, V> => isMapOf(obj, key, val);
}
/**
 * Type check for Map<string, string>
 * @param  {unknown} obj
 * @returns {obj_is<Map<string, string>>}
 */
export function isMapOfStrings(obj: unknown): obj is Map<string, string> {
  return isMapOf(obj, isString, isString);
}

/**
 * Type check for Set<T>
 * @param  {unknown} obj
 * @param  {typecheck<T>} chk - A T type checking function (obj:unknow) => obj is T
 * @returns {obj_is<Set<T>>}
 */
export function isSetOf<T>(obj: unknown, chk: typecheck<T>): obj is Set<T> {
  if (!isSet(obj)) return false;
  for (const t of obj) {
    if (!chk(t)) return false;
  }
  return true;
}
/**
 * Generate a type check function for Set<T>
 * @param  {typecheck<T>} chk - A T type checking function (obj:unknow) => obj is T
 * @returns {typecheck<Set<T>>}
 */
export function chkSetOf<T>(chk: typecheck<T>): typecheck<Set<T>> {
  return (obj: unknown): obj is Set<T> => isSetOf(obj, chk);
}
/**
 * Type check for Set<string>
 * @param  {unknown} obj
 * @returns {obj_is<Set<string>>}
 */
export function isSetOfString(obj: unknown): obj is Set<string> {
  return isSetOf(obj, isString);
}
/**
 * Type check of \{ [key: string | symbol]: T \} types
 * @param  {unknown} obj
 * @param  {typecheck<T>} chk - a T type-checking function (obj: unknown) => obj is T
 * @returns {obj_is<{any:T}>}
 */
export function isObjectOf<T>(
  obj: unknown,
  chk: typecheck<T>,
): obj is NonNullable<{ [key: string | number | symbol]: T }> {
  if (!isObjectNonNull(obj)) {
    return false;
  }
  for (const k of [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)]) {
    if (!hasFieldType(obj, k, chk)) {
      return false;
    }
  }
  return true;
}
/**
 * Type check of \{ [key: string | symbol]: T \} types
 * @param  {unknown} obj
 * @param  {typecheck<T>} chk - a T type-checking function (obj: unknown) => obj is T
 * @returns {obj_is<{any:T}>}
 */
export function chkObjectOf<T>(
  chk: typecheck<T>,
): typecheck<{ [key: string | number | symbol]: T }> {
  return (obj: unknown): obj is { [key: string | number | symbol]: T } =>
    isObjectOf(obj, chk);
}
/**
 * Type checking function for \{ [key: string | symbol]: string \} types
 * @param  {unknown} obj
 * @returns {obj_is<{any:string}>}
 */
export function isObjectOfString(
  obj: unknown,
): obj is { [key: string]: string } {
  return (
    isObjectOf(obj, isString) && Object.getOwnPropertySymbols(obj).length === 0
  );
}
/**
 * Type check function for a Promise<T>, though T is not (and can't be...) validated.
 * This is a simple check for a "then-able" object type.
 * @param  {unknown} obj
 * @returns {obj_is<Promise<T>>}
 */
export function isPromise(obj: unknown): obj is Promise<unknown> {
  return (
    hasField(obj, 'then') &&
    hasField(obj, 'catch') &&
    hasField(obj, 'finally') &&
    Symbol.species in obj.constructor
  );
}

/**
 * Pay no attention to the man behind the curtain!!!
 * @param obj
 * @returns
 */
export function isPromiseOf<T>(obj: unknown): obj is Promise<T> {
  return isPromise(obj);
}

/**
 * Type check for a Javascript symbol type
 * @param  {unknown} obj
 * @returns {obj_is<symbol>}
 */
export function isSymbol(obj: unknown): obj is symbol {
  return typeof obj === 'symbol';
}
/**
 * Type check for a particular key in obj.
 * After a conditional, you can use obj[key] or obj.key safely.
 * @param  {unknown} obj
 * @param  {K} key
 * @returns {obj_is<{key: unknown}>}
 */
export function hasField<K extends string | number | symbol>(
  obj: unknown,
  key: K,
  // eslint-disable-next-line no-shadow
): obj is NonNullable<{ [key in K]: unknown }> {
  return isObjectNonNull(obj) && key in obj;
}

export function chkField<K extends string | number | symbol>(
  key: K,
  // eslint-disable-next-line no-shadow
): typecheck<NonNullable<{ [key in K]: unknown }>> {
  // eslint-disable-next-line no-shadow
  return (obj: unknown): obj is { [key in K]: unknown } => hasField(obj, key);
}

/**
 * Type check for a key of type T in obj.
 * After a conditional, you can use obj[key] or obj.key with the type T for
 * key safely.
 * @param  {unknown} obj
 * @param  {K} key
 * @param  {typecheck<T>} checker - A Type checking function for T
 * @returns {obj_is<{key: T}>}
 */
export function hasFieldType<T, K extends string | number | symbol>(
  obj: unknown,
  key: K,
  checker: typecheck<T>,
  // eslint-disable-next-line no-shadow
): obj is NonNullable<{ [key in K]: T }> {
  return hasField(obj, key) && checker(obj[key]);
}
export function chkFieldType<T, K extends string | number | symbol>(
  key: K,
  checker: typecheck<T>,
  // eslint-disable-next-line no-shadow
): typecheck<NonNullable<{ [key in K]: T }>> {
  // eslint-disable-next-line no-shadow
  return (obj: unknown): obj is { [key in K]: T } =>
    hasFieldType(obj, key, checker);
}
/**
 * Type check for a string typed key in obj.
 * After a conditional, you can use obj[key] or obj.key as a string safely.
 * @param  {unknown} obj
 * @param  {K} key
 * @returns {obj_is<{key: string}>}
 */
export function hasStrField<K extends string | number | symbol>(
  obj: unknown,
  key: K,
  // eslint-disable-next-line no-shadow
): obj is NonNullable<{ [key in K]: string }> {
  return hasFieldType(obj, key, isString);
}
export function chkStrField<K extends string>(
  key: K,
  // eslint-disable-next-line no-shadow
): typecheck<NonNullable<{ [key in K]: string }>> {
  return chkFieldType(key, isString);
}

export function isIterable(
  obj: unknown,
): obj is NonNullable<{ [Symbol.iterator]: () => IterableIterator<unknown> }> {
  return hasField(obj, Symbol.iterator);
}

export function isIterableOf<T>(
  obj: unknown,
): obj is NonNullable<{ [Symbol.iterator]: () => IterableIterator<T> }> {
  return hasField(obj, Symbol.iterator);
}

export function isSimpleObject(x: unknown): x is SimpleObject {
  return (
    x === null ||
    isString(x) ||
    isNumber(x) ||
    isBoolean(x) ||
    isArrayOf(x, isSimpleObject) ||
    (isObjectNonNull(x) &&
      isArrayOf(Object.keys(x), chkOneOf(isString, isNumber)) &&
      isObjectOf(x, isSimpleObject))
  );
}

export function asSimpleObject(
  x: unknown,
  def: SimpleObject = null,
): SimpleObject {
  if (x === null || isString(x) || isNumber(x) || isBoolean(x)) {
    return x;
  }
  if (isArray(x)) {
    return x.filter((val) => isSimpleObject(val)) as SimpleObject;
  }
  if (isObjectNonNull(x)) {
    const res: SimpleObject = {};
    Object.keys(x).forEach((key) => {
      if (isString(key) && hasField(x, key)) {
        res[key] = asSimpleObject(x[key]);
      }
    });
    return res;
  }
  return def;
}

export function isCustomType<T>(obj: unknown, sym: symbol): obj is T {
  return hasField(obj, FreikTypeTag) && obj[FreikTypeTag] === sym;
}

export function chkCustomType<T>(sym: symbol): typecheck<T> {
  return (obj: unknown): obj is T => isCustomType<T>(obj, sym);
}

// Type metaprogramming is very useful, if I can get this right.
// This should force you to validate every single field of the type you claim to be checking
// Property in keyof T is a "mapped type" that gives you all the keys from T
// R extending from Partial<{...}> means that it should be a distinct subset of T
// So you have to provide *all* keys for the type in the 'required' section, or else

// Swiped shamelessly from type-fest
export type OptionalKeysOf<BaseType extends object> = Exclude<
  {
    [Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
      ? never
      : Key;
  }[keyof BaseType],
  undefined
>;

export type RequiredKeysOf<BaseType extends object> = Exclude<
  {
    [Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
      ? Key
      : never;
  }[keyof BaseType],
  undefined
>;

function isObjOfHelper<T extends NonNullable<object>>(
  exact: boolean,
  obj: unknown,
  requiredFields: Record<RequiredKeysOf<T>, boolcheck>,
  optionalFields: Record<OptionalKeysOf<T>, boolcheck> | Record<string, never>,
): obj is T {
  if (!isObjectNonNull(obj)) {
    return false;
  }
  let required = Object.keys(requiredFields).length;
  const keys = Object.keys(obj);
  let len = keys.length;
  for (const fieldName of keys) {
    /* istanbul ignore if */
    if (!hasField(obj, fieldName)) continue;
    const theVal = obj[fieldName];
    // TODO: Not sure if this is a good idea or not. Deleting out nulls?
    if (isUndefined(theVal) || obj[fieldName] === null) {
      delete obj[fieldName];
      len--;
      continue;
    }
    if (hasFieldType(optionalFields, fieldName, isFunction)) {
      const checker: boolcheck =
        optionalFields[fieldName as keyof typeof optionalFields];
      if (!checker(theVal)) {
        return false;
      }
      len--;
    } else if (hasFieldType(requiredFields, fieldName, isFunction)) {
      const fieldTypeChecker =
        requiredFields[fieldName as keyof typeof requiredFields];
      if (!fieldTypeChecker(theVal)) {
        return false;
      }
      required--;
      len--;
    }
  }
  // If len is 0, then we validated all the fields, so it's an exact type
  // If len isn't 0, then there were some extra fields we didn't validate
  return required === 0 && (len === 0 || !exact);
}

export function isObjectOfExactType<T extends NonNullable<object>>(
  obj: unknown,
  requiredFields: Record<RequiredKeysOf<T>, boolcheck>,
  optionalFields:
    | Record<OptionalKeysOf<T>, boolcheck>
    | Record<string, never> = {},
): obj is T {
  return isObjOfHelper<T>(true, obj, requiredFields, optionalFields);
}

export function isObjectOfType<T extends NonNullable<object>>(
  obj: unknown,
  requiredFields: Record<RequiredKeysOf<T>, boolcheck>,
  optionalFields:
    | Record<OptionalKeysOf<T>, boolcheck>
    | Record<string, never> = {},
): obj is T {
  return isObjOfHelper<T>(false, obj, requiredFields, optionalFields);
}

export function chkObjectOfType<T extends object>(
  requiredFields: Record<RequiredKeysOf<T>, boolcheck>,
  optionalFields:
    | Record<OptionalKeysOf<T>, boolcheck>
    | Record<string, never> = {},
): typecheck<T> {
  return (obj): obj is T =>
    isObjOfHelper(false, obj, requiredFields, optionalFields);
}

export function chkObjectOfExactType<T extends object>(
  requiredFields: Record<RequiredKeysOf<T>, boolcheck>,
  optionalFields:
    | Record<OptionalKeysOf<T>, boolcheck>
    | Record<string, never> = {},
): typecheck<T> {
  return (obj): obj is T =>
    isObjOfHelper(true, obj, requiredFields, optionalFields);
}

export function isPartialOf<T extends object>(
  obj: unknown,
  fields: Record<keyof T, boolcheck>,
): obj is Partial<T> {
  if (!isObjectNonNull(obj)) {
    return false;
  }
  const keys = Object.keys(obj);
  let len = keys.length;
  for (const fieldName of keys) {
    /* istanbul ignore if */
    if (!hasField(obj, fieldName)) continue;
    const theVal = obj[fieldName];
    if (isUndefined(theVal) || obj[fieldName] === null) {
      delete obj[fieldName];
      len--;
      continue;
    }
    if (hasFieldType(fields, fieldName, isFunction)) {
      const checker: boolcheck = fields[fieldName as keyof T];
      if (!checker(theVal)) {
        return false;
      }
      len--;
    }
  }
  return len === 0;
}

export function chkPartialOf<T extends object>(
  fields: Record<keyof T, boolcheck>,
): typecheck<Partial<T>> {
  return (obj): obj is Partial<T> => isPartialOf<T>(obj, fields);
}
