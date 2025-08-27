import { SnackbarProps } from '../components/Snackbar';
import { dispatch } from '../store';
import { openSnackbar } from '../store/reducers/snackbar';

export const snackbar =  (props: Partial<SnackbarProps>) => { dispatch(openSnackbar(props)) };
