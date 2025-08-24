import MuiSnackbar from '@mui/material/Snackbar';
import { Alert, Button, Fade, Grow, IconButton, Slide, SlideProps } from '@mui/material';
import { AlertProps, SnackbarOrigin } from '@mui/material';
import { CloseOutlined } from '@ant-design/icons';
import { RootStateProps } from '../store';
import { SyntheticEvent } from 'react';
import { closeSnackbar } from '../store/reducers/snackbar';
import { useDispatch, useSelector } from 'react-redux';

const animation = {
  SlideLeft: (props: SlideProps) => <Slide {...props} direction="left" />,
  SlideUp: (props: SlideProps) => <Slide {...props} direction="up" />,
  SlideRight: (props: SlideProps) => <Slide {...props} direction="right" />,
  SlideDown: (props: SlideProps) => <Slide {...props} direction="down" />,
  Grow: (props: SlideProps) => <Grow {...props} />,
  Fade
};

export type SnackbarProps = {
  action: boolean
  open: boolean
  message: string
  anchorOrigin: SnackbarOrigin
  variant: 'alert' | 'default'
  alert: AlertProps
  transition: keyof typeof animation
  close: boolean
  actionButton: boolean
}

export default () => {
  const dispatch = useDispatch();
  const { actionButton, anchorOrigin, alert, close, message, open, transition, variant } = useSelector((state: RootStateProps) => state.snackbar);

  const handleClose = (event: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(closeSnackbar());
  };

  return (
    <>
      {/* default snackbar */}
      {variant === 'default' && (
        <MuiSnackbar
          anchorOrigin={anchorOrigin}
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          message={message}
          slots={{
            transition: animation[transition]
          }}
          action={
            <>
              <Button color="secondary" size="small" onClick={handleClose}>
                UNDO
              </Button>
              <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose} sx={{ mt: 0.25 }}>
                <CloseOutlined />
              </IconButton>
            </>
          }
        />
      )}

      {/* alert snackbar */}
      {variant === 'alert' && (
        <MuiSnackbar
          slots={{
            transition: animation[transition]
          }}
          anchorOrigin={anchorOrigin}
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
        >
          <Alert
            variant={alert.variant}
            color={alert.color}
            action={
              <>
                {actionButton && (
                  <Button color={alert.color} size="small" onClick={handleClose}>
                    UNDO
                  </Button>
                )}
                {close && (
                  <IconButton
                    sx={{ mt: 0.25 }}
                    size="small"
                    aria-label="close"
                    color={alert.color}
                    onClick={handleClose}
                  >
                    <CloseOutlined />
                  </IconButton>
                )}
              </>
            }
            sx={{
              ...(alert.variant === 'outlined' && {
                bgcolor: 'grey.0'
              })
            }}
          >
            {message}
          </Alert>
        </MuiSnackbar>
      )}
    </>
  );
};
