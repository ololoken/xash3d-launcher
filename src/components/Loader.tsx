import { styled } from '@mui/material/styles';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';

const LoaderWrapper = styled('div')(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 2001,
  width: '100%',
  '& > * + *': {
    marginTop: theme.spacing(2)
  }
}));

export interface LoaderProps extends LinearProgressProps {}

export default (props: LoaderProps) => (
  <LoaderWrapper>
    <LinearProgress color="primary" {...props} />
  </LoaderWrapper>
);
