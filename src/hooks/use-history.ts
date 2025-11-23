"use client"

import { useState, useCallback } from 'react';

type History<T> = {
  past: T[];
  present: T;
  future: T[];
};

export const useHistory = <T>(initialPresent: T) => {
  const [state, setState] = useState<History<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const canUndo = state.past.length !== 0;
  const canRedo = state.future.length !== 0;

  const undo = useCallback(() => {
    if (!canUndo) return;

    const { past, present, future } = state;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setState({
      past: newPast,
      present: previous,
      future: [present, ...future],
    });
  }, [canUndo, state]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    const { past, present, future } = state;
    const next = future[0];
    const newFuture = future.slice(1);

    setState({
      past: [...past, present],
      present: next,
      future: newFuture,
    });
  }, [canRedo, state]);

  const set = useCallback((newPresent: T | ((currentState: T) => T)) => {
    const { past, present } = state;

    const newPresentValue = typeof newPresent === 'function' 
      ? (newPresent as (currentState: T) => T)(present) 
      : newPresent;

    if (newPresentValue === present) return;

    setState({
      past: [...past, present],
      present: newPresentValue,
      future: [],
    });
  }, [state]);

  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  return { state: state.present, set, undo, redo, reset, canUndo, canRedo };
};
