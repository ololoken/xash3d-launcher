import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
  tooltipClasses,
} from '@mui/material';

import BackgroundImage from '../assets/images/hldm.png';
import BotsMenu, {botByLevel, BotSkill} from './BotsMenu';
import GamepadIcon from '../components/icons/GamepadIcon';
import MapConfig from './MapConfig';
import PlayerConfig from './PlayerConfig';
import configCfg from '../assets/module/config.cfg';
import gameData from '../assets/module/data.zip?url';
import throwExpression from '../common/throwExpression';
import useConfig from '../hooks/useConfig';
import useYSDK from '../hooks/useYSDK';

import { SettingTwoTone, SoundOutlined } from '@ant-design/icons';
import { Module } from '../types/Module';
import { ModuleInstance } from '../assets/module/module';
import { FocusEvent, useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation} from 'react-i18next';
import { zipInputReader } from './dataInput';


const messages: string[] = [];

export default () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [instance, setInstance] = useState<Module>();
  const [readyToRun, setReadyToRun] = useState(false);
  const [mainRunning, setMainRunning] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [serverStarting, setServerStarting] = useState(false);
  const [hasData, setHasData] = useState(false);

  const [showSettings, setShowSettings] = useState(true)
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [selectedMap, setSelectedMap] = useState('crossfire.bsp');
  const [playerName, setPlayerName] = useState('');

  const config = useConfig();
  const { sdk } = useYSDK();

  const [connectPayload, setConnectPayload] = useState<{ connect: string, name: string }>()
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0.0);
  const [showTopBar, setShowTopBar] = useState(true);
  const [enabledBots, setEnabledBots] = useState<BotSkill[]>([]);

  useEffect(() => {
    config.onChangeLocalization(sdk.environment.i18n.lang === 'ru' ? 'ru-RU' : 'en-US');
  }, [sdk.environment.i18n.lang]);

  useEffect(() => {
    if (!instance || !mainRunning) return;
    instance.executeString(`ui_language ${sdk.environment.i18n.lang === 'ru' ? 'russian' : 'english'}`)
  }, [sdk.environment.i18n.lang, instance, mainRunning]);

  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!readyToRun || !instance || mainRunning) return;
    runInstance();
  }, [readyToRun, instance, mainRunning]);

  useEffect(() => {
    if (!sdk.environment.payload) return;
    try {
      setConnectPayload(JSON.parse(sdk.environment.payload))
    }
    catch (ignore) {}
  }, [sdk.environment.payload]);

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

  useEffect(function critical () {//init wasm module instance
    if (!canvas.current) return;
    if ((critical as any)['lock']) return;
    (critical as any)['lock'] = true;

    ModuleInstance({
      ENV: {
        XASH3D_RODIR: '/xash/rodir',
        XASH3D_BASEDIR: '/xash',
        HOME: '/xash',
      },
      canvas: canvas.current,
      reportDownloadProgress: () => {},
      onExit: (code) => {
        console.info('!+EXIT+!', code);
        // add hook or iframe callback here
      },
      print: msg => messages.push(msg),
      printErr: msg => messages.push(msg)
    })
      .then(instance => {
        Object.assign(instance, {
          callbacks: {
            fsSyncRequired: (data: { path: string, op: 'write' | 'delete' }) => setTimeout(() => instance?.FS.syncfs(res => console.log(data, `synced`, res)), 500),
            gameReady: () => {
              sdk.features.LoadingAPI.ready();
              setMainRunning(true);
              instance.executeString('scr_conspeed 1048576');
              instance.executeString('con_notifytime 0');
              instance.getCVar('volume').then((vol: string) => setVolume(Number(vol)));
            }
          },
          executeString: instance.cwrap('Cmd_ExecuteString', 'number', ['string']),
          getCVar: (name: string) => {
            return instance.waitMessage(`"${name}" is`, 1000, name)
              .then((msg: string) => {
                const [{ groups }] = msg?.matchAll(new RegExp(`"${name}" is "(?<value>[^"]*)"`, 'gm')) ?? [{ groups: { value: '' } }];
                 return groups?.value
              })
          },
          waitMessage: (lookupMsg: string, timeout = 1000, cmd = '') => new Promise<string>((resolve, reject) => {
            const start = Date.now();
            messages.length = 0;
            const hTimer = setInterval(() => {
              const msg = messages.find(msg => msg.includes(lookupMsg));
              if (!msg && Date.now() - start > timeout) {
                clearInterval(hTimer);
                return reject('timeout');
              }
              if (msg) {
                clearInterval(hTimer);
                return resolve(msg);
              }
            }, 0);
            if (cmd) {
              instance.executeString(cmd);
            }
          })
        });
        setInstance(instance);
      })
      .catch((e: Error) => {
        console.error(e);
      })

  }, [canvas])

  useEffect(() => {
    if (!instance) return;
    Object.assign(window,  { instance });//debug purposes
    instance.print(t(`Looking up data in [{{path}}]`, { path: instance.ENV.HOME }));

    if (!instance.FS.analyzePath(`${instance.ENV.HOME}/valve/config.cfg`).exists) {
      instance.FS.mkdirTree(`${instance.ENV.HOME}/valve`);
      instance.FS.writeFile(`${instance.ENV.HOME}/valve/config.cfg`, configCfg, { encoding: 'utf8' });
    }

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
      console.error(err);
    }
  };

  useEffect(() => {
    if (!instance || !mainRunning) return;
    instance.executeString(`volume ${volume}`);
  }, [volume]);

  const serverUrl = ((url) => {
    url.searchParams.append('payload', JSON.stringify({
      connect: instance?.net?.getHostId(),
      name: playerName
    }))
    return url;
  })(new URL(import.meta.env.PROD ? 'https://yandex.ru/games/app/460673' : String(location)));

  useEffect(() => {
    const handle = () => {
      setShowTopBar(!Boolean(document.pointerLockElement));
    }
    document.addEventListener('pointerlockchange', handle, false);
    return () => {
      document.removeEventListener('pointerlockchange', handle);
    }
  }, []);



  const runInstance = () => {
    if (!instance || mainRunning) return;
    instance.callMain(['-noip6', '-windowed', '-game', 'valve', '-ref', 'webgl2']);
  }

  return (
    <Card
      elevation={0}
      sx={{
        background: `url(${BackgroundImage}) center center`,
        backgroundSize: 'cover',
        position: 'absolute',
        width: '100%',
        border: 'none',
      }}
    >
      <CardHeader
        title={''}
        sx={{
          background: theme.palette.background.default,
          p: '8px 14px 8px 0',
          height: 44,
          position: 'absolute',
          zIndex: 2000,
          width: '100%',
          display: showTopBar ? 'flex' : 'none',
          '& .MuiCardHeader-action': { width: '100%' }
        }}
        action={<>
          <Stack direction={"row"} spacing={2}>
            {(serverRunning && instance?.net?.getHostId()) ? <Tooltip title={t('menu.Link')} slotProps={{ popper: { sx: {
                  [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { color: '#000', fontSize: '1em' }
                } }}}><TextField
                variant="outlined"
                slotProps={{
                  htmlInput: {
                    readOnly: true,
                    sx: { padding: '5px 5px' },
                    onKeyPress: (e: KeyboardEvent) => e.stopPropagation(),
                    onKeyUp: (e: KeyboardEvent) => e.stopPropagation(),
                    onKeyDown: (e: KeyboardEvent) => e.stopPropagation(),
                    onMouseDown: (e: MouseEvent) => e.stopPropagation(),
                    onMouseUp: (e: MouseEvent) => e.stopPropagation(),
                    onFocus: (e: FocusEvent) => (e.target as HTMLInputElement | undefined)?.select()
                  }
                }}
                value={serverUrl}
                fullWidth
            /></Tooltip> : <Box flex={1} />}
            {serverRunning && <BotsMenu instance={instance} setEnabledBots={setEnabledBots} enabledBots={enabledBots} />}
            {mainRunning &&
              <Stack spacing={2} direction="row" sx={{ alignItems: 'center', mb: 1 }}>
                <SoundOutlined />
                <Slider value={volume} onChange={(ignore, value) => setVolume(value)} min={0.0} max={1.0} step={0.1} sx={{ minWidth: 120 }} />
              </Stack>}
            {!readyToRun && <CircularProgress color="warning" size="34px" />}
            <Tooltip title={t('menu.Toggle Settings')} slotProps={{ popper: { sx: {
                  [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { marginTop: '0px', color: '#000', fontSize: '1em' }
                } }}}>
              <ToggleButton value={-1} selected={showSettings} sx={{ p: '3px 6px', height: '36px' }} onClick={() => {
                if (!serverRunning && !connected) return;
                setShowSettings(!showSettings)
              }}>
                <SettingTwoTone style={{ fontSize: '2.4em' }} />
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
        height: /*import.meta.env.PROD ? 'calc(100vh)' :*/ 'calc(100vh)',
        position: 'relative',
        '&:last-child': {
          paddingBottom: 0
        }}}>
        <Box sx={{
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          height: showSettings && mainRunning ? '100%' : 0,
          width: '100%',
          backdropFilter: 'blur(10px)',
          overflowY: 'auto',
          position: 'absolute',
          zIndex: 1000
        }}>
          <Box sx={{ width: '100%', top: 44, position: 'relative' }}>
            {connectPayload
              ? <Stack direction="column" spacing={2} alignItems="center">
                  <Stack direction="row" spacing={2}>
                    <PlayerConfig instance={instance} playerName={playerName} setPlayerName={setPlayerName} mainRunning={mainRunning} />
                  </Stack>
                  <Button
                    size="large"
                    variant="contained"
                    startIcon={<GamepadIcon />}
                    sx={{ minWidth: '50%' }}
                    disabled={connecting}
                    onClick={() => {
                      setConnecting(true);
                      instance?.executeString('host_writeconfig');
                      instance?.preConnectToServer(connectPayload?.connect)
                        .then(() => {
                          instance?.executeString(`connect o.${connectPayload?.connect}`);
                          return instance?.waitMessage('VoiceCapture_Init', 10000)
                        })
                        .then(() => {
                          setShowSettings(false);
                          setConnected(true)
                        })
                        .finally(() => setConnecting(false));
                    }}
                  >{t('buttons.Connect {{name}}', { name: connectPayload.name })}</Button>
                </Stack>
              : <Stack direction="column" spacing={2} alignItems="center">
                  <Stack direction="row" spacing={2}>
                    <MapConfig instance={instance} selectedMap={selectedMap} setSelectedMap={setSelectedMap} />
                    <PlayerConfig instance={instance} playerName={playerName} setPlayerName={setPlayerName} mainRunning={mainRunning} />
                  </Stack>
                  <Button
                    size="large"
                    variant="contained"
                    startIcon={<GamepadIcon />}
                    sx={{ minWidth: '50%' }}
                    disabled={serverStarting}
                    onClick={() => {
                      setServerStarting(true)
                      enabledBots
                        .flatMap(skill => botByLevel[skill].names)
                        .forEach(name => instance?.executeString(`kick "${name}"`));
                      instance?.executeString('host_writeconfig');
                      instance?.executeString('deathmatch 1');
                      instance?.executeString('maxplayers 16');
                      instance?.executeString(`map ${selectedMap}`);
                      instance?.waitMessage('Custom resource propagation complete').then(() => {
                        setShowSettings(false);
                        setServerStarting(false);
                        setServerRunning(true);
                      });
                    }}
                  >{t('buttons.Play')}</Button>
                </Stack>
            }
          </Box>
        </Box>
        <canvas id="canvas" ref={canvas} width={800} height={600} style={{
          width: '100%', height: '100%', position: 'absolute', zIndex: 100,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          maxWidth: 'calc(100vh * 800 / 600)', background: mainRunning ? '#000' : 'transparent'
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
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ color: 'text.primary' }}
          >{Math.round(downloadProgress) === 100 ? 'Unpacking' : 'Downloading'}</Typography>
        </Box>
      </Box> : ''}
    </Card>
  )
}
