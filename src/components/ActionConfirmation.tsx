import { Avatar, Button, Dialog, DialogContent, Stack, Typography } from '@mui/material';
import { WarningOutlined, StopOutlined, InfoOutlined } from '@ant-design/icons';

export type Props = {
  title: string;
  open: boolean;
  handleClose: (status: boolean) => void;
  color?: 'info' | 'warning' | 'error',
  confirmText?: string
  cancelText?: string
}

const icon = {
  info: <InfoOutlined />,
  warning: <WarningOutlined />,
  error: <StopOutlined />,
}

export default ({ title, open, handleClose, color, confirmText, cancelText }: Props) => {
  color ??= 'info';
  return (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      keepMounted
      maxWidth="xs"
      aria-labelledby="item-action-confirmation-title"
      aria-describedby="item-action-confirmation-description"
    >
      {open && (
        <DialogContent sx={{ mt: 2, my: 1 }}>
          <Stack alignItems="center" spacing={3.5}>
            <Avatar color={color} sx={{ width: 72, height: 72, fontSize: '1.75rem' }}>
              {icon[color]}
            </Avatar>
            <Stack spacing={2}>
              <Typography variant="h4" align="center">
                {title}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ width: 1 }}>
              <Button fullWidth onClick={() => handleClose(false)} color="secondary">
                {cancelText ?? 'Cancel'}
              </Button>
              <Button fullWidth color={color} variant="contained" onClick={() => handleClose(true)} autoFocus>
                {confirmText ?? 'Go!'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      )}
    </Dialog>
  );
}
