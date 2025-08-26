import { Box, CircularProgress, Typography } from '@mui/material';

export type Props = {
  downloadProgress: number
}

export default ({ downloadProgress }: Props) =>
  downloadProgress ? <Box sx={{ position: 'absolute', display: 'inline-flex', zIndex: 120, top: 'calc(100vh / 2 - 100px)', left: 'calc(100vw / 2 - 100px)' }}>
    <CircularProgress variant="indeterminate" value={downloadProgress} size={200} />
    <Box
      sx={{
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="caption"
        fontSize={40}
        fontWeight={'bold'}
        component="div"
        sx={{ color: 'text.primary' }}
      >{`${Math.round(downloadProgress)}%`}</Typography>
      <Typography
        variant="subtitle1"
        component="div"
        sx={{ color: 'text.primary' }}
      >{Math.round(downloadProgress) === 100 ? 'Unpacking' : 'Downloading'}</Typography>
    </Box>
  </Box> : '';
