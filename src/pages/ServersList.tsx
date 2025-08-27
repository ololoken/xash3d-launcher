import GamepadIcon from '../components/icons/GamepadIcon';
import { Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, alpha, useTheme } from '@mui/material';
import { Module } from '../types/Module';
import { Payload } from '../../server';
import { dispatch, useSelector } from '../store';
import { flow, publicServers } from '../store/reducers/game';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Props = {
  instance?: Module
}

export default ({ instance }: Props) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const [ selectedServer, setSelectedServer ] = useState<number>();
  const { servers, connecting } = useSelector(state => state.game);

  useEffect(() => {
    if (!instance) return;
    const handle = ({ data }: MessageEvent) => {
      try {
        const payload: Payload = JSON.parse(data);
        switch (true) {
          case 'sv:list' in payload: {
            payload['sv:list'].forEach(identity => instance.executeString(`ui_queryserver ololoken.${identity} current`));
          } break;
        }
      }
      catch (e) {
        console.error('bad server response', data, e);
      }
    };
    instance.net.master.addEventListener('message', handle);

    instance.net.master.send(JSON.stringify({ list: '' } as Payload));

    return () => instance.net.master.removeEventListener('message', handle);
  }, [instance]);

  return (<>
    <TableContainer sx={{maxHeight: 'calc(100vh - 240px)', minHeight: 'calc(100vh - 240px)'}}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('srv.Name')}</TableCell>
            <TableCell align="right">{t('srv.Map')}</TableCell>
            <TableCell align="right">{t('srv.Players')}</TableCell>
            <TableCell align="right">{t('srv.Ping')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(servers)
            .sort(([, { numcl: a }], [, { numcl: b }]) => Number(b) - Number(a))
            .map(([identity, data]) => (
              <TableRow
                key={identity}
                onClick={() => setSelectedServer(selectedServer === Number(identity) ? undefined : Number(identity))}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  background: Number(identity) === selectedServer
                    ? palette.primary.dark
                    : '',
                  ':hover': {
                    background: Number(identity) === selectedServer
                      ? alpha(palette.primary.dark, 0.5)
                      : alpha(palette.primary.light, 0.5)
                  }
                }}
              >
                <TableCell component="th" scope="row">{data.host}</TableCell>
                <TableCell align="right">{data.map}</TableCell>
                <TableCell align="right">{data.numcl}/{data.maxcl}</TableCell>
                <TableCell align="right">{data.ping}</TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Button
      size="large"
      variant="contained"
      startIcon={<GamepadIcon />}
      sx={{ minWidth: '50%' }}
      loading={connecting}
      loadingIndicator={<CircularProgress />}
      disabled={!selectedServer || connecting}
      onClick={() => {
        dispatch(flow({ connecting: true }));
        dispatch(publicServers({}));
        instance?.executeString('host_writeconfig');
        instance?.preConnectToServer(selectedServer)
          .then(() => {
            instance?.executeString(`connect o.${selectedServer}`);
            return instance?.waitMessage('Setting up renderer', 60000)
          })
          .then(() => {
            dispatch(flow({ showSettings: false, connected: true }))
          })
          .finally(() => dispatch(flow({ connecting: false })));
      }}
    >{t('buttons.Connect {{name}}', { name: servers?.[selectedServer ?? 0]?.host ?? '--/--' })}</Button>
  </>)
}
