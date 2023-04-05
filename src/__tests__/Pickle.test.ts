import {
  chkCustomType,
  chkObjectOfType,
  FreikTypeTag,
  hasField,
  hasFieldType,
  hasStrField,
  isArray,
  isBigInt,
  isDate,
  isRegex,
  isSymbol,
  Pickle,
  RegisterForPickling,
  SimpleObject,
  UnsafelyUnpickle,
} from '../index';
import { FromFlat, SafelyUnpickle, Unpickle } from '../Pickle';

const TestSymbol = Symbol.for('pickler.Test');
const Test2Symbol = Symbol.for('pickler.Test2');
const Test3Symbol = Symbol.for('pickler.Test3');

function MakeType() {
  return {
    value1: 'a',
    value2: /a/gi,
    [FreikTypeTag]: TestSymbol,
    toJSON: () => 'My Test Thingy',
  };
}

function MakeType2() {
  return {
    value1: 'a',
    value2: /a/gi,
    [FreikTypeTag]: Test2Symbol,
  };
}

type Type3 = {
  value1: string;
  value2: string;
  toJSON: () => SimpleObject;
  [FreikTypeTag]: symbol;
};

function MakeType3(v1: string, v2: string): Type3 {
  return {
    value1: v1,
    value2: v2,
    toJSON: () => ({ value1: v1, value2: v2 }),
    [FreikTypeTag]: Test3Symbol,
  };
}

beforeAll(() => {
  RegisterForPickling<unknown>(TestSymbol, (data) => MakeType());
  RegisterForPickling(
    Test2Symbol,
    (data) => MakeType2(),
    (data) => 'My Test2 Thingy',
  );
});

test('Pickling sanity', () => {
  expect(Pickle([])).toBeDefined();
});

test('Pickling set roundtrip', () => {
  const set = [new Set<string>(['a', 'b'])];
  const setString = Pickle(set);
  const newSet = UnsafelyUnpickle(setString);
  expect(isArray(newSet)).toBe(true);
  expect((newSet as any as Set<unknown>[])[0]).toBeInstanceOf(Set);
  const next = Pickle(newSet);
  expect(next).toEqual(setString);
});

test('Pickling map roundtrip', () => {
  const map = {
    a: new Map<string, string>([
      ['a', 'b'],
      ['c', 'd'],
    ]),
  };
  const mapString = Pickle(map);
  const newMap = UnsafelyUnpickle(mapString);
  expect(hasField(newMap, 'a')).toBe(true);
  expect((newMap as any).a).toBeInstanceOf(Map);
  const next = Pickle(newMap);
  expect(next).toEqual(mapString);
});

test('Other random pickling stuff', () => {
  const sp = Pickle({ value: TestSymbol });
  const rs = Unpickle(sp);
  const has = hasFieldType(rs, 'value', isSymbol);
  expect(has).toBeTruthy();
  if (!has) throw Error('oops');
  expect(rs.value).toBe(TestSymbol);
  const obj = {
    regex: /a/i,
    date: new Date(),
    bi: BigInt('132341293874129387412'),
  };
  type TheType = typeof obj;
  const chkTheType = chkObjectOfType<TheType>({
    regex: isRegex,
    date: isDate,
    bi: isBigInt,
  });
  const other = Pickle(obj);
  const ro = Unpickle(other);
  expect(ro).toEqual(obj);
  const typedThing = SafelyUnpickle<TheType>(other, chkTheType);
  const notTheThing = SafelyUnpickle<TheType>(sp, chkTheType);
  expect(typedThing).toEqual(obj);
  expect(notTheThing).toBeUndefined();
});

const Type3Unpickle: FromFlat<Type3> = (
  so: SimpleObject,
): Type3 | undefined => {
  if (hasStrField(so, 'value1') && hasStrField(so, 'value2')) {
    return MakeType3(so.value1, so.value2);
  }
};

test('Custom pickling tests', () => {
  const t1 = MakeType();
  const t2 = MakeType2();
  RegisterForPickling(Test3Symbol, Type3Unpickle);
  const str = Pickle({ a: t1, b: t2 });
  const val = Unpickle(str);
  const str2 = Pickle(val);
  expect(str).toEqual(str2);
  const t3 = MakeType3('hello', 'world');
  const str3 = Pickle(t3);
  const t3b = SafelyUnpickle<Type3>(str3, chkCustomType<Type3>(Test3Symbol));
  expect(t3b).toBeDefined();
});
