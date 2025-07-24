import { useState, useEffect } from 'react';

export default function useLocalStorage<T>(key: string, defaultValue: T = <T>undefined): [T | typeof defaultValue, (value: T | typeof defaultValue) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    try { return <T>JSON.parse(stored) }
    catch (ignore) {}
    return defaultValue;
  });

  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.storageArea === localStorage && e.key === key) {
        setValue(e.newValue ? JSON.parse(e.newValue) : e.newValue);
      }
    };
    addEventListener('storage', listener);
    return () => removeEventListener('storage', listener);
  }, [key, defaultValue]);

  return [value, (newValue: T | typeof defaultValue) => {
    setValue((currentValue: any | undefined) => {
      const result = typeof newValue === 'function'
        ? newValue(currentValue)
        : newValue;
      if (result === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(result));
      return result;
    });
  }];
}
