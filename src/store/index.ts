import reducer from './reducers';
import { GameProps } from './reducers/game.ts';
import { SnackbarProps } from '../components/Snackbar';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch as useAppDispatch, useSelector as useAppSelector, TypedUseSelectorHook } from 'react-redux';


const store = configureStore({ reducer });

export type RootState = ReturnType<typeof reducer>;

export type AppDispatch = typeof store.dispatch;

const { dispatch } = store;

const useDispatch = () => useAppDispatch<AppDispatch>();
const useSelector: TypedUseSelectorHook<RootState> = useAppSelector;

export type RootStateProps = {
  snackbar: SnackbarProps;
  game: GameProps;
};

export { store, dispatch, useSelector, useDispatch };
