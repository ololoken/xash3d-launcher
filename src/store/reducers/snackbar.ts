import { SnackbarProps } from '../../components/Snackbar';
import { createSlice } from '@reduxjs/toolkit';

const initialState: SnackbarProps = {
  action: false,
  open: false,
  message: 'Something is happening',
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'right'
  },
  variant: 'default',
  alert: {
    color: 'info',
    variant: 'filled'
  },
  transition: 'Fade',
  close: true,
  actionButton: false
};

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    openSnackbar(state, action) {
      const { open, message, anchorOrigin, variant, alert, transition, close, actionButton } = action.payload;

      state.action = !state.action;
      state.open = open || initialState.open;
      state.message = message ?? initialState.message;
      state.anchorOrigin = anchorOrigin ?? initialState.anchorOrigin;
      state.variant = variant ?? initialState.variant;
      state.alert = {
        color: alert?.color ?? initialState.alert.color,
        variant: alert?.variant ?? initialState.alert.variant
      };
      state.transition = transition ?? initialState.transition;
      state.close = close ?? initialState.close;
      state.actionButton = actionButton ?? initialState.actionButton;
    },

    closeSnackbar(state) {
      state.open = false;
    }
  }
});

export default snackbarSlice.reducer;

export const { closeSnackbar, openSnackbar } = snackbarSlice.actions;
