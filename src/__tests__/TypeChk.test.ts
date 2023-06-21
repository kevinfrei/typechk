import {
  asArrayOfString,
  asNumber,
  asNumberOrString,
  asSimpleObject,
  asString,
  chk2TupleOf,
  chk3TupleOf,
  chkArrayOf,
  chkBothOf,
  chkCustomType,
  chkField,
  chkFieldType,
  chkMapOf,
  chkObjectOf,
  chkObjectOfExactType,
  chkObjectOfType,
  chkPartialOf,
  chkSetOf,
  chkStrField,
  is2TupleOf,
  is3TupleOf,
  isArray,
  isArrayOf,
  isArrayOfString,
  isBothOf,
  isCustomType,
  isDate,
  isDefined,
  isFunction,
  isIterable,
  isIterableOf,
  isMapOf,
  isMapOfStrings,
  isNonNullable,
  isNull,
  isNumber,
  isNumberOrString,
  isObject,
  isObjectOf,
  isObjectOfExactType,
  isObjectOfString,
  isObjectOfType,
  isPartialOf,
  isPromise,
  isPromiseOf,
  isRegex,
  isSetOf,
  isSetOfString,
  isSimpleObject,
  isString,
  toArrayOfString,
  toString,
} from '../TypeChk';
import { FreikTypeTag } from '../Types';

test('isString', () => {
  expect(isString('')).toBe(true);
  expect(isString('s')).toBe(true);
  expect(isString(0)).toBe(false);
});
test('isRegex', () => {
  expect(isRegex({ source: 'abc', flags: 'i' })).toBeFalsy();
  expect(isRegex(/abc/i)).toBeTruthy();
  expect(isRegex(new RegExp('abc', 'i'))).toBeTruthy();
});
test('isDate', () => {
  expect(isDate(Date())).toBeFalsy();
  expect(isDate(new Date())).toBeTruthy();
});
test('Stragglers', () => {
  const required = ['a', 'b'];
  let bar: unknown;
  expect(isDefined(required)).toBeTruthy();
  expect(isDefined(bar)).toBeFalsy();
  expect(isNonNullable(required)).toBeTruthy();
  expect(isNonNullable(null)).toBeFalsy();
  expect(isNonNullable(bar)).toBeFalsy();
  expect(isNonNullable(required[3])).toBeFalsy();
  expect(isArrayOf(required, isString)).toBeTruthy();
  expect(chkArrayOf(isString)(required)).toBeTruthy();
  expect(chkStrField('a')({ a: 'a' })).toBeTruthy();
  expect(chkStrField('b')({ a: 'a' })).toBeFalsy();
  expect(chkFieldType('a', isString)({ a: 'b' })).toBeTruthy();
  expect(chkField('a')({ b: 1 })).toBeFalsy();
  expect(isSetOf(required, isString)).toBeFalsy();
});
test('isObjectOf tests', () => {
  type T = { a: number; b: () => number; c?: Set<string> };
  type OptT = { a: number; b: () => number };
  const theType = { a: 1, b: () => 0, c: new Set<string>(['a']) };
  const theOptionalType = { a: 2, b: () => 1 };
  const required = { a: isNumber, b: isFunction };
  const optional = { c: isSetOfString };
  const allOf = { ...required, ...optional };
  const arrOf = [theType, theType];
  const isType = chkObjectOfType<OptT>(required);
  expect(isObjectOfType<T>(theType, required, optional)).toBeTruthy();
  // This shouldn't work at compile time :D
  // expect(isObjectOfType<T>(theType, optional, required)).toBeTruthy();
  expect(isObjectOfType<T>(theType, allOf)).toBeTruthy();
  expect(isType(theOptionalType)).toBeTruthy();
  expect(isObjectOf(null, isString)).toBeFalsy();
  expect(isPartialOf<typeof theType>(theOptionalType, allOf)).toBeTruthy();
  expect(chkPartialOf<typeof theType>(allOf)(allOf)).toBeFalsy();
  expect(isPartialOf<typeof theType>(null, allOf)).toBeFalsy();
  expect(
    isPartialOf<typeof theType>({ ...theOptionalType, bar: null }, allOf),
  ).toBeTruthy();
  expect(isObjectOfType<T>(theOptionalType, allOf)).toBeFalsy();
  expect(isArrayOf(arrOf, chkObjectOfType<T>(required, optional))).toBeTruthy();
  expect(
    isObjectOfType<T>({ a: 2, b: () => '' }, required, optional),
  ).toBeTruthy();
  expect(isObjectOfType({ a: 2, b: 1 }, required, optional)).toBeFalsy();
  expect(
    isObjectOfType<T>({ a: 2, c: new Set(['a', 'b']) }, required, optional),
  ).toBeFalsy();
  expect(
    isObjectOfType<T>(
      { a: 2, b: () => 0, c: new Set([1, 2]) },
      required,
      optional,
    ),
  ).toBeFalsy();
  expect(isObjectOfType<T>(null, required, optional)).toBeFalsy();
  expect(
    isObjectOfType<T>({ a: 2, b: () => '', d: null }, required, optional),
  ).toBeTruthy();
  expect(
    isObjectOfExactType<T>({ a: 2, b: () => '', d: '' }, required, optional),
  ).toBeFalsy();
  expect(
    isObjectOfType<T>({ a: 2, b: () => '', d: '' }, required, optional),
  ).toBeTruthy();
  expect(
    isArrayOf(
      [{ a: 2, b: () => '', d: '' }],
      chkObjectOfExactType(required, optional),
    ),
  ).toBeFalsy();
});
test('The simple is/as tests', () => {
  expect(asNumber({}, 1)).toEqual(1);
  expect(asNumber(1 / 0, 1)).toEqual(Number.POSITIVE_INFINITY);
  expect(asNumberOrString('a', 0)).toEqual('a');
  expect(asNumberOrString({}, 'b')).toEqual('b');
  expect(asNumberOrString(null, 3)).toEqual(3);
  expect(asString(1, 'b')).toEqual('b');
  expect(toString(1, 'b')).toEqual('1');
  expect(toString('s')).toEqual('s');
  expect(toString(undefined)).toEqual('');
  const myThing = { toString: () => 'myThing' };
  expect(toString(myThing)).toEqual('myThing');
  expect(toString({ a: 1 })).toEqual('');
  expect(asString(myThing)).toEqual('');
  expect(isObject({})).toBeTruthy();
  expect(isObject(1)).toBeFalsy();
  expect(isObject(null)).toBeTruthy();
  expect(isObject(undefined)).toBeFalsy();
  expect(isNull(null)).toBeTruthy();
  expect(isNull(undefined)).toBeFalsy();
  expect(isNull('')).toBeFalsy();
  expect(isNull({})).toBeFalsy();
  expect(isNull(0)).toBeFalsy();
  expect(isNull([])).toBeFalsy();
  const val = () => {};
  val.tester = 'foo';
  expect(isFunction(val)).toBeTruthy();
});
test('is/as/toArrayOfString tests', () => {
  expect(asArrayOfString([0, 'a'])).toEqual(['a']);
  expect(asArrayOfString({ a: 1 })).toEqual([]);
  expect(asArrayOfString(() => [], ['bcd'])).toEqual(['bcd']);
  expect(asArrayOfString([1, 'a'], 'b')).toEqual(['b', 'a']);
  expect(asArrayOfString([{}, 'a'], 'b')).toEqual(['b', 'a']);
  expect(asArrayOfString(['1', 1], ['nope'])).toEqual(['nope']);
  expect(asArrayOfString(['1', '1'], ['nope'])).toEqual(['1', '1']);
  expect(toArrayOfString([1, 2, 'a'])).toEqual(['1', '2', 'a']);
  expect(toArrayOfString({}, ['hello'])).toEqual(['hello']);
  expect(toArrayOfString({})).toEqual([]);
  expect(toArrayOfString([{}, {}], 'a')).toEqual(['a', 'a']);
  expect(toArrayOfString([{}, 'A'])).toEqual(['A']);
  expect(toArrayOfString([{}, 'A'], 'B')).toEqual(['B', 'A']);
  expect(toArrayOfString([{}, 'A'], ['hola'])).toEqual(['hola']);
  expect(toArrayOfString(['B', 'A'], ['hola'])).toEqual(['B', 'A']);
  expect(isArrayOfString(['a', 'b'])).toBeTruthy();
  expect(isArrayOfString(['a', 1])).toBeFalsy();
});
test('Miscellaneous type checks', async () => {
  expect(isObjectOfString({ a: 'b' })).toBeTruthy();
  expect(isObjectOfString({ b: 1 })).toBeFalsy();
  expect(isObjectOfString({ [Symbol.iterator]: 'a' })).toBeFalsy();
  expect(isObjectOf({ [Symbol.iterator]: 1 }, isString)).toBeFalsy();
  expect(isObjectOf({ [Symbol.iterator]: 'b' }, isString)).toBeTruthy();
  const mapOfStr = new Map([
    ['a', 'b'],
    ['c', 'd'],
  ]);
  const mapOfStrNum = new Map<string, string | number>([
    ['a', 'b'],
    ['c', 1],
  ]);
  const mapOfNumStr = new Map<string | number, string>([
    [1, 'b'],
    ['c', 'd'],
  ]);
  expect(isMapOfStrings(mapOfStr)).toBeTruthy();
  expect(isMapOfStrings(mapOfNumStr)).toBeFalsy();
  expect(isMapOfStrings(mapOfStrNum)).toBeFalsy();
  expect(chkMapOf(isString, isNumberOrString)(mapOfStrNum)).toBeTruthy();
  expect(chkMapOf(isString, isNumberOrString)(mapOfNumStr)).toBeFalsy();
  expect(isMapOf(1, isString, isNull)).toBeFalsy();
  expect(is2TupleOf([1, 'a'], isNumber, isString)).toBeTruthy();
  expect(chk2TupleOf(isNumber, isString)([1, 'a'])).toBeTruthy();
  expect(is2TupleOf([1, 2], isNumber, isString)).toBeFalsy();
  expect(is3TupleOf([1, 2, 'a'], isNumber, isNumber, isString)).toBeTruthy();
  expect(is3TupleOf([1, 2, 'a'], isNumber, isString, isString)).toBeFalsy();
  expect(chk3TupleOf(isNumber, isString, isString)([1, 2, 'a'])).toBeFalsy();
  expect(
    is3TupleOf(
      [1, new Set([2, 3, '4']), 5],
      isNumber,
      chkSetOf(isNumberOrString),
      isNumber,
    ),
  ).toBeTruthy();
  expect(
    chkObjectOf(chkArrayOf(isNumberOrString))({
      a: [1],
      b: [2, '3', 4],
      c: ['five'],
    }),
  ).toBeTruthy();
  const obj = { [Symbol.iterator]: [1, 'two'] };
  expect(
    isArrayOf(
      [obj],
      chkFieldType(Symbol.iterator, chkArrayOf(isNumberOrString)),
    ),
  ).toBeTruthy();
  expect(isArrayOf([obj], chkField(Symbol.iterator))).toBeTruthy();
  expect(isPromise(new Promise(() => {}))).toBeTruthy();
  expect(isPromise({ then: () => {} })).toBeFalsy();
  expect(
    isPromiseOf<string>(
      new Promise(() => {
        return '';
      }),
    ),
  ).toBeTruthy();
  expect(isIterable([1, 2, 3])).toBeTruthy();
  expect(isIterableOf<string>(['a', 'b', 'c'])).toBeTruthy();
  expect(isIterable(new Promise(() => {}))).toBeFalsy();
  const MyGoofyTypeTag: symbol = Symbol.for('MyGoofyType');
  type MyGoofyType = { a: string; [FreikTypeTag]: symbol };
  const myGoofyObj = { a: 'goofy', [FreikTypeTag]: MyGoofyTypeTag };
  expect(isCustomType<MyGoofyType>([1], MyGoofyTypeTag)).toBeFalsy();
  expect(chkCustomType<MyGoofyType>(MyGoofyTypeTag)(myGoofyObj)).toBeTruthy();
});

test('is/asSimpleObject, chk/isBothOf tests', () => {
  const arr = [null, 'a', 12, true];
  const arrr = [...arr, () => {}];
  const sarr = asSimpleObject(arr);
  if (!isArray(sarr)) throw 'oops';
  expect(arr).toEqual(sarr);
  const sarrr = asSimpleObject(arrr);
  if (!isArray(sarrr)) throw 'oops';
  // The function should be removed
  expect(arr.length).toEqual(sarrr.length);
  expect(isSimpleObject(arr)).toBeTruthy();
  expect(isSimpleObject(arrr)).toBeFalsy();
  expect(isSimpleObject(sarr)).toBeTruthy();
  const obj = { a: arr, b: 1, c: null, d: true, e: 'a' };
  const sobj = asSimpleObject(obj);
  expect(sobj).toStrictEqual(obj);
  expect(asSimpleObject(() => {})).toBeNull();
  expect(isSimpleObject(() => {})).toBeFalsy();
  expect(
    isBothOf(['a', 'b'], isArrayOfString, chk2TupleOf(isString, isString)),
  ).toBeTruthy();
  expect(
    isArrayOf(
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
      chkBothOf(isArrayOfString, chk2TupleOf(isString, isString)),
    ),
  ).toBeTruthy();
});
