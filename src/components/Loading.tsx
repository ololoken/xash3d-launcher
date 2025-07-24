import LinearProgress from '@mui/material/LinearProgress';
import Loader from './Loader';
import { ReactNode } from 'react';

export type Props = {
  loading: boolean,
  children?: ReactNode,
  local?: boolean
}

export default ({ loading, local = false, children }: Props) => loading
  ? local ? <LinearProgress color="primary" /> : <Loader />
  : children;

