"use client"

import * as React from "react";
import type { Reducer } from 'react';

type History<T> = {
  past: T[];
  present: T;
  future: T[];
};

type Action<T> =
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET'; newPresent: T }
  | { type: 'RESET'; newPresent: T };

const reducer = <T>(state: History<T>, action: Action<T>): History<T> => {
  const { past, present, future } = state;

  switch (action.type) {
    case 'UNDO': {
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    }
    case 'REDO': {
      if (future.length === 0) return state;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    }
    case 'SET': {
      const { newPresent } = action;
      if (newPresent === present) return state;
      return {
        past: [...past, present],
        present: newPresent,
        future: [],
      };
    }
    case 'RESET': {
      return {
        past: [],
        present: action.newPresent,
        future: [],
      };
    }
    default: {
      return state;
    }
  }
};


export const useHistory = <T>(initialPresent: T) => {
  const [state, dispatch] = React.useReducer<Reducer<History<T>, Action<T>>>(
    reducer,
    {
      past: [],
      present: initialPresent,
      future: [],
    }
  );

  const canUndo = state.past.length !== 0;
  const canRedo = state.future.length !== 0;

  const undo = React.useCallback(() => dispatch({ type: 'UNDO' }), []);

  const redo = React.useCallback(() => dispatch({ type: 'REDO' }), []);

  const set = React.useCallback((newPresent: T | ((currentState: T) => T)) => {
    const newPresentValue =
      typeof newPresent === 'function'
        ? (newPresent as (currentState: T) => T)(state.present)
        : newPresent;
    dispatch({ type: 'SET', newPresent: newPresentValue });
  }, [state.present]);

  const reset = React.useCallback((newPresent: T) => {
    dispatch({ type: 'RESET', newPresent });
  }, []);

  return { state: state.present, set, undo, redo, reset, canUndo, canRedo };
};
