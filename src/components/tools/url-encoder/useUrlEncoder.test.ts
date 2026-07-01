/// <reference types="vitest" />

import { renderHook, act } from '@testing-library/react';
import { expect, it, describe } from 'vitest';
import { useUrlEncoder } from './useUrlEncoder';

describe('useUrlEncoder hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [state] = result.current;

    expect(state.text).toBe('');
    expect(state.direction).toBe('encode');
    expect(state.mode).toBe('component');
    expect(state.charset).toBe('utf-8');
    expect(state.result).toBeNull();
    expect(state.error).toBeNull();
  });

  it('sets text correctly', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setText('hello world');
    });

    const [state] = result.current;
    expect(state.text).toBe('hello world');
  });

  it('truncates text at INPUT_MAX_LEN', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;
    const longText = 'a'.repeat(15000);

    act(() => {
      actions.setText(longText);
    });

    const [state] = result.current;
    expect(state.text.length).toBe(10000);
  });

  it('toggles direction', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setDirection('decode');
    });

    const [state] = result.current;
    expect(state.direction).toBe('decode');

    act(() => {
      actions.setDirection('encode');
    });

    expect(result.current[0].direction).toBe('encode');
  });

  it('toggles mode', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setMode('uri');
    });

    const [state] = result.current;
    expect(state.mode).toBe('uri');
  });

  it('changes charset', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setCharset('euc-kr');
    });

    const [state] = result.current;
    expect(state.charset).toBe('euc-kr');
  });

  it('processes UTF-8 encode', async () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setText('hello world');
      actions.setDirection('encode');
      actions.setMode('component');
    });

    await act(async () => {
      await actions.process();
    });

    const [state] = result.current;
    expect(state.result).toBe('hello%20world');
    expect(state.error).toBeNull();
  });

  it('processes UTF-8 decode', async () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setText('hello%20world');
      actions.setDirection('decode');
      actions.setMode('component');
    });

    await act(async () => {
      await actions.process();
    });

    const [state] = result.current;
    expect(state.result).toBe('hello world');
    expect(state.error).toBeNull();
  });

  it('handles empty input gracefully', async () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setText('');
    });

    await act(async () => {
      await actions.process();
    });

    const [state] = result.current;
    expect(state.result).toBeNull();
  });

  it('clears state with clearAll', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setText('hello');
    });

    act(() => {
      actions.clearAll();
    });

    const [state] = result.current;
    expect(state.text).toBe('');
  });

  it('toggles batch mode', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setBatchMode(true);
    });

    const [state] = result.current;
    expect(state.batchMode).toBe(true);
  });

  it('toggles plus as space', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.setPlusAsSpace(true);
    });

    const [state] = result.current;
    expect(state.plusAsSpace).toBe(true);
  });

  it('adds recent entries', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.addRecent('test1');
      actions.addRecent('test2');
    });

    const [state] = result.current;
    expect(state.recents).toContain('test1');
    expect(state.recents).toContain('test2');
    expect(state.recents[0]).toBe('test2');
  });

  it('clears recents', () => {
    const { result } = renderHook(() => useUrlEncoder());
    const [, actions] = result.current;

    act(() => {
      actions.addRecent('test');
    });

    let state = result.current[0];
    expect(state.recents.length).toBeGreaterThan(0);

    act(() => {
      actions.clearRecents();
    });

    state = result.current[0];
    expect(state.recents).toHaveLength(0);
  });
});
