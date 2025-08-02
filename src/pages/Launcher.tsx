import {
  Card,
  Box,
  CardContent,
  CardHeader,
  ToggleButton,
  Tooltip,
  tooltipClasses,
  Button,
  Stack,
  CircularProgress, Typography
} from '@mui/material';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation} from 'react-i18next';
import { Module } from '../types/Module';

import DeleteIcon from '../components/icons/DeleteIcon';
import LaunchIcon from '../components/icons/LaunchIcon';
import TerminalIcon from '../components/icons/TerminalIcon';

import ActionConfirmation from '../components/ActionConfirmation';
import { ModuleInstance } from '../assets/module/module';
import throwExpression from '../common/throwExpression';
import { zipInputReader } from './dataInput';
import gameData from '../assets/module/data.zip?url';

export default () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [instance, setInstance] = useState<Module>();
  const [readyToRun, setReadyToRun] = useState(false);
  const [mainRunning, setMainRunning] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [wzLoading, setWzLoading] = useState(false);

  const [showConsole, setShowConsole] = useState(import.meta.env.DEV)
  const [messages, setMessages] = useState<Array<string>>([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadTimer, setDownloadTimer] = useState(0);
  const pushMessage = (msg: string) => setMessages(messages => {
    if (msg === 'Running...') return messages;
    messages.reverse().length = Math.min(messages.length, 200);
    return [...messages.reverse(), msg]
  });

  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false)

  const [logbox, canvas] = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLCanvasElement>(null),
  ];

  useEffect(() => {
    if (!readyToRun || !instance || mainRunning) return;
    if (import.meta.env.PROD) runInstance();
  }, [readyToRun, instance, mainRunning]);

  useEffect(() => {
    if (!instance) return;
    const handler = () => {
      if (document.hidden) {
        instance.SDL2?.audioContext.suspend();
      } else {
        instance.SDL2?.audioContext.resume();
      }
    }
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [instance]);

  useEffect(() => {
    if (!hasData || !instance) return;
    instance.print(t(`Data bundle looks ok. Continue initialization...`))

    instance.FS.syncfs(false, err => {
      if (err) return instance.print(t('error.Failed to sync FS'));
      instance.FS.chdir(`${instance?.ENV.HOME}`);
      setReadyToRun(true);
      return true;
    })

  }, [hasData, instance]);

  useEffect(() => {
    logbox.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [showConsole, messages]);

  useEffect(function critical () {//init wasm module instance
    if (!canvas.current) return;
    if ((critical as any)['lock']) return;
    (critical as any)['lock'] = true;
    pushMessage(t(`Starting wasm module...`));

    ModuleInstance({
      ENV: {
        XASH3D_RODIR: '/xash/rodir',
        XASH3D_BASEDIR: '/xash',
        HOME: '/xash',
      },
      canvas: canvas.current,
      pushMessage,
      reportDownloadProgress: () => {},
      onExit: (code) => {
        console.info('!+EXIT+!', code);
        // add hook or iframe callback here
      }
    }).then(setInstance)
      .catch((e: Error) => {
        pushMessage(t(`error.WASM module start failed`));
        console.error(e);
      })

  }, [canvas])

  useEffect(() => {
    if (!instance) return;
    Object.assign(instance, {
      callbacks: {
        fsSyncRequired: (data: { path: string, op: 'write' | 'delete' }) => instance?.FS.syncfs(res => { console.log(data, `synced`, res) }),
      }
    });
    Object.assign(window,  { instance });//debug purposes
    instance.print(t(`Looking up data in [{{path}}]`, { path: instance.ENV.HOME }));

    if (instance.FS.analyzePath(`${instance.ENV.HOME}/rodir/valve`).exists) return setHasData(true);

    fetch(gameData)
      .then(async resp => {
        const reader = resp.body?.getReader() ?? throwExpression(`failed to fetch get data.zip`);
        let totalDataSize = Number(resp.headers.get('Content-Length'));
        let totalDataDownloaded = 0;
        const chunks = [];
        while(true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          totalDataDownloaded += value.length;
          setDownloadProgress(totalDataDownloaded/totalDataSize*100);
        }
        return new Blob(chunks);
      })
      .then(blob => zipInputReader(`${instance.ENV.HOME}/rodir/valve`, instance, blob))
      .then(setHasData)
      .catch(error => {
        instance.print(`Failed to build local data ${error.message ?? error}`);
        console.error(error)
      })
      .finally(() => setDownloadProgress(0));

  }, [instance])

  const clearPath = (basePath: string) => {
    if (!instance) return;
    try {
      Object.entries(instance.FS.lookupPath(basePath).node.contents).forEach(([path, { isFolder }]) => {
        instance.print(`Clearing ${basePath}/${path}`)
        isFolder
            ? clearPath(`${basePath}/${path}`)
            : instance.FS.unlink(`${basePath}/${path}`)
      })
      instance.FS.rmdir(`${basePath}`)
    } catch (err) {
      instance.print(`Failed to remove stored data`)
      console.error(err)
    }
  };

  const removeData = () => {
    setOpenDeleteConfirmation(true);
  }

  const runInstance = () => {
    if (!instance || mainRunning) return;
    try {
      instance.callMain(['-noip6', '-windowed', '-game', 'valve', '-ref', 'webgl2', '-dev', '2']);
    }
    catch (e) {
      console.log(e);
    }
    setMainRunning(true);
    setShowConsole(false);
  }

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        border: import.meta.env.PROD ? 'none' : '1px solid',
        borderRadius: 1,
        borderColor: theme.palette.divider,
      }}
    >
      <CardHeader
        slotProps={{
          title: { variant: 'subtitle1' }
        }}
        title={instance?.net?.getHostId()}
        sx={{ p: '8px 12px', height: '44px', '& .MuiCardHeader-action': { width: '40%' }/*, ...(import.meta.env.PROD ? {display: 'none'} : {})*/ }}
        action={<>
          <Stack direction={"row"} spacing={2}>
            <Box flex={1} />
            {!readyToRun && <CircularProgress color="warning" size="34px" />}
            {readyToRun && hasData && !mainRunning && <Button
                sx={{ fontSize: '1em', height: '36px' }}
                variant="contained"
                onClick={() => runInstance()}
            ><LaunchIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /> {t('menu.Run')}</Button>}
            {readyToRun && hasData && !mainRunning && <Button
              sx={{ fontSize: '1em', height: '36px' }}
              variant="contained"
              onClick={() => removeData()}
            ><DeleteIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /> {t('menu.Remove data')}</Button>}
            <Tooltip title={t('menu.Toggle Console')} slotProps={{ popper: { sx: {
                [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { marginTop: '0px', color: '#000', fontSize: '1em' }
              } }}}>
                <ToggleButton value={-1} selected={showConsole} sx={{ p: '3px 6px', height: '36px' }} onClick={() => {
                  setShowConsole(!showConsole)
                }}>
                  <TerminalIcon width="2.4em" height="2.4em" />
              </ToggleButton>
            </Tooltip>
          </Stack>
        </>}
      />
      <CardContent sx={{
        p: 0,
        m: 0,
        background: ``,
        backgroundSize: 'cover',
        height: /*import.meta.env.PROD ? 'calc(100vh)' :*/ 'calc(100vh - 46px)',
        position: 'relative',
        '&:last-child': {
          paddingBottom: 0
        }}}>
        <Box sx={{
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          height: showConsole ? '100%' : 0,
          width: '100%',
          whiteSpace: 'pre',
          overflowY: 'auto',
          fontFamily: 'Fallout',
          position: 'absolute',
          zIndex: 1000
        }}>
          {messages.join('\n')}
          <div ref={logbox}></div>
        </Box>
        <canvas id="canvas" ref={canvas} width={800} height={600} style={{
          width: '100%', height: '100%', position: 'absolute', zIndex: 100,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          maxWidth: 'calc(100vh * 800 / 600)', background: '#000'
        }}></canvas>
      </CardContent>
      {downloadProgress ? <Box sx={{ position: 'absolute', display: 'inline-flex', zIndex: 120, top: 'calc(100vh / 2 - 100px)', left: 'calc(100vw / 2 - 100px)' }}>
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
          {downloadTimer ? <Typography
              variant="subtitle1"
              component="div"
              sx={{ color: 'text.primary' }}
          >{`${downloadTimer.toFixed(2)} c`}</Typography> : <Typography
            variant="subtitle1"
            component="div"
            sx={{ color: 'text.primary' }}
          >{Math.round(downloadProgress) === 100 ? 'Unpacking' : 'Downloading'}</Typography>}
        </Box>
      </Box> : ''}
      {wzLoading ? <Box sx={{ position: 'absolute', display: 'inline-flex', zIndex: 120, top: 'calc(100vh / 2 - 100px)', left: 'calc(100vw / 2 - 100px)' }}>
        <CircularProgress variant="indeterminate" value={50} size={200} />
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
            variant="subtitle1"
            component="div"
            sx={{ color: 'text.primary' }}
          >{`Loading...`}</Typography>
        </Box>
      </Box> : ''}
      <ActionConfirmation
        open={openDeleteConfirmation}
        title={t('confirm.Are you sure?')}
        handleClose={(status) => {
          setOpenDeleteConfirmation(false);
          if (!status || !instance) return;

          clearPath(`${instance.ENV.HOME}/rodir/valve`);
          instance.FS.syncfs(false, err => {
            if (err) return instance.print(`Failed to remove data at [${instance.ENV.HOME}]`);
            setHasData(false)
            setShowConsole(true)
          });

        }}
        color="error" />
    </Card>
  )
}
