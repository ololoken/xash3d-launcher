import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

export default () => {

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Box
        maxWidth={'xl'}
        sx={{
          p: 0,
          m: 0,
          position: 'relative',
          minHeight: 'calc(100vh)',
          display: 'flex',
          flexGrow: 1,
          flexDirection: 'column',
          '& .MuiContainer-root': {
            pl: 0, pr: 0
          }
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
