import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack, Switch,
  ToggleButton,
  Tooltip,
  tooltipClasses, Typography,
} from '@mui/material';

import BackgroundImage from '../assets/images/hldm.png';
import BotsMenu, {botByLevel, BotSkill} from './BotsMenu';
import DownloadIndicator from './DownloadIndicator';
import GamepadIcon from '../components/icons/GamepadIcon';
import InviteLink from './InviteLink';
import MapConfig from './MapConfig';
import PlayerConfig from './PlayerConfig';
import VolumeAndSensitivitySliders from './VolumeAndSensitivitySliders';
import configCfg from '../assets/module/config.cfg';
import gameData from '../assets/module/data.zip?url';
import throwExpression from '../common/throwExpression';
import useConfig from '../hooks/useConfig';
import useYSDK from '../hooks/useYSDK';

import { LoadingButton } from '@mui/lab';
import { Module } from '../types/Module';
import { ModuleInstance } from '../assets/module/module';
import { SettingTwoTone } from '@ant-design/icons';
import { snackbar } from '../common/snackbar';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation} from 'react-i18next';
import { zipInputReader } from './dataInput';

const messages: string[] = [];
const pingCache = new Map<number, number>();

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

  const canvas = useRef<HTMLCanvasElement>(null);

  const [connectPayload, setConnectPayload] = useState<number>()
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [withBots, setWithBots] = useState(true);
  const [enabledBots, setEnabledBots] = useState<BotSkill[]>([]);
  const [servers, setServers] = useState<Record<number, Record<string, string | number>>>({});

  useEffect(() => {
    config.onChangeLocalization(sdk.environment.i18n.lang === 'ru' ? 'ru-RU' : 'en-US');
    if (!instance || !mainRunning) return;
    instance.executeString(`ui_language ${sdk.environment.i18n.lang === 'ru' ? 'russian' : 'english'}`)
  }, [sdk.environment.i18n.lang, instance, mainRunning]);

  useEffect(() => {
    if (!readyToRun || !instance) return;
    instance.callMain(['-noip6', '-windowed', '-game', 'valve', '-ref', 'webgl2']);
  }, [readyToRun, instance]);

  useEffect(() => {
    setConnectPayload(Number(sdk.environment.payload))
  }, [sdk.environment.payload]);

  useEffect(() => {
    if (!instance || !mainRunning || !connectPayload) return;
    instance.executeString(`ui_queryserver ololoken.${connectPayload} current`);
  }, [instance, connectPayload, mainRunning]);

  useEffect(() => {
    if (!instance) return;
    const interval = setInterval(() => Object.keys(servers)
      .forEach(identity => {
        instance.executeString(`ui_queryserver ololoken.${identity} current`);
        pingCache.set(Number(identity), Date.now());
      }), 2500);
    return () => clearInterval(interval);
  }, [servers]);

  useEffect(() => {
    const handle = () => {
      if (document.hidden) {
        instance?.SDL2?.audioContext.suspend();
      } else {
        instance?.SDL2?.audioContext.resume();
      }
    }
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  useEffect(() => {
    const handle = () => setShowTopBar(!Boolean(document.pointerLockElement));
    document.addEventListener('pointerlockchange', handle, false);
    return () => {
      document.removeEventListener('pointerlockchange', handle);
    }
  }, []);

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
      print: msg => {
        if (import.meta.env.DEV) console.log(msg);
        messages.push(msg)
      },
      printErr: msg => {
        if (import.meta.env.DEV) console.error(msg);
        messages.push(msg)
      }
    })
      .then(instance => {
        Object.assign(instance, {
          callbacks: {
            fsSyncRequired: (data: { path: string, op: 'write' | 'delete' }) => setTimeout(() => instance?.FS.syncfs(res => console.log(data, `synced`, res)), 500),
            gameReady: async () => {
              sdk.features.LoadingAPI.ready();
              setMainRunning(true);
              instance.executeString('scr_conspeed 1048576');
              instance.executeString('con_notifytime 0');
            },
            serverInfo: (ip4: number, info: string) => {
              const [, , a, b] = instance.inetNtop4(ip4).split('.', 4).map(Number);
              const identity = (a << 0) | (b << 8);
              const payload = info.split('\\').splice(1).reduce((r, item, idx) => {
                const ci = Math.floor(idx/2);
                r[ci] = [...(r[ci] ?? []), item];
                return r;
              }, [] as string[][]).reduce((o, [k, v]) => ({...o, [k]: v}), {})
              setServers({ ...servers, [identity]: {...payload, ping: Date.now() - (pingCache.get(identity) ?? Date.now()) }});
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
            const offs = messages.length-1;
            const hTimer = setInterval(() => {
              const msg = messages.find((msg, idx) => idx >= offs && msg.includes(lookupMsg));
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
    if (import.meta.env.DEV)
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

  useEffect(() => {
    const handle = () => setShowTopBar(!Boolean(document.pointerLockElement));
    document.addEventListener('pointerlockchange', handle, false);
    return () => {
      document.removeEventListener('pointerlockchange', handle);
    }
  }, []);

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
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        action={<>
          <Stack direction={"row"} spacing={2}>
            {(!connectPayload && instance?.net?.getHostId())
              ? <InviteLink {...{ instance, playerName }} />
              : <Box flex={1}
              />}
            {serverRunning && <BotsMenu {...{instance, setEnabledBots, enabledBots, serverRunning}} />}
            <VolumeAndSensitivitySliders {...{mainRunning, instance}} />
            {readyToRun
              ? <Tooltip title={t('menu.Toggle Settings')} slotProps={{ popper: { sx: {
                    [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { marginTop: '0px', color: '#000', fontSize: '1em' }
                  } }}}>
                  <ToggleButton value={-1} selected={showSettings} sx={{ p: '3px 6px', height: '36px' }} onClick={() => {
                    if (!serverRunning && !connected) return;
                    setShowSettings(!showSettings)
                  }}>
                    <SettingTwoTone style={{ fontSize: '2.4em' }} />
                  </ToggleButton>
                </Tooltip>
              : <CircularProgress color="warning" size="34px" />}
          </Stack>
        </>}
      />
      <CardContent sx={{
        p: 0,
        m: 0,
        background: ``,
        backgroundSize: 'cover',
        height: 'calc(100vh)',
        position: 'relative',
        '&:last-child': {
          paddingBottom: 0
        }}}>
        <Box sx={{
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          height: showSettings && mainRunning ? '100%' : 0,
          width: '100%',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          position: 'absolute',
          zIndex: 1000
        }}>
          <Box sx={{ width: '100%', top: 44, position: 'relative' }}>
            {connectPayload
              ? <Stack direction="column" spacing={2} alignItems="center">
                  <Stack direction="row" spacing={2}>
                    <PlayerConfig instance={instance} playerName={playerName} setPlayerName={setPlayerName} mainRunning={mainRunning} cols={5} />
                  </Stack>
                    {servers?.[connectPayload] && <Typography>{t("texts.Server info: players {{numcl}}/{{maxcl}}, map: {{map}}, ping: {{ping}}", {
                      numcl: servers[connectPayload].numcl,
                      maxcl: servers[connectPayload].maxcl,
                      map: servers[connectPayload].map,
                      ping: servers[connectPayload].ping
                    })}</Typography>}
                  <LoadingButton
                    size="large"
                    variant="contained"
                    startIcon={<GamepadIcon />}
                    sx={{ minWidth: '50%' }}
                    loading={!Boolean(servers?.[connectPayload]) || connecting}
                    loadingIndicator={<CircularProgress />}
                    disabled={!Boolean(servers?.[connectPayload]) || connecting}
                    onClick={() => {
                      setConnecting(true);
                      setServers({});
                      instance?.executeString('host_writeconfig');
                      instance?.preConnectToServer(connectPayload)
                        .then(() => {
                          instance?.executeString(`connect o.${connectPayload}`);
                          return instance?.waitMessage('Setting up renderer', 60000)
                        })
                        .then(() => {
                          setShowSettings(false);
                          setConnected(true)
                        })
                        .finally(() => setConnecting(false));
                    }}
                  >{t('buttons.Connect {{name}}', { name: servers?.[connectPayload]?.host ?? '--/---' })}</LoadingButton>
                </Stack>
              : <Stack direction="column" spacing={2} alignItems="center" sx={{ overflow: 'hidden' }}>
                  <Stack direction="row" spacing={2}>
                    <MapConfig instance={instance} selectedMap={selectedMap} setSelectedMap={setSelectedMap} />
                    <PlayerConfig instance={instance} playerName={playerName} setPlayerName={setPlayerName} mainRunning={mainRunning} cols={4} />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Typography>{t('texts.Add bots')} <Switch checked={withBots} onChange={(ignore, checked) => setWithBots(checked)} /></Typography>
                    <Typography>{t('texts.Public server')} <Switch /></Typography>
                  </Stack>
                  <LoadingButton
                    size="large"
                    variant="contained"
                    startIcon={<GamepadIcon />}
                    sx={{ minWidth: '50%' }}
                    loading={serverStarting}
                    loadingIndicator={<CircularProgress />}
                    disabled={serverStarting}
                    onClick={() => {
                      setServerStarting(true)
                      setServers({});
                      enabledBots.flatMap(skill => botByLevel[skill].names)
                        .forEach(name => instance?.executeString(`kick "${name}"`));
                      instance?.executeString('host_writeconfig');
                      instance?.executeString('deathmatch 1');
                      instance?.executeString('maxplayers 16');
                      instance?.executeString(`map ${selectedMap}`);
                      instance?.waitMessage('Setting up renderer', 60000)
                        .then(() => {
                          setShowSettings(false);
                          setServerStarting(false);
                          setServerRunning(true);
                        })
                        .then(() => {
                          if (enabledBots.includes('3') || !withBots) return;
                          setEnabledBots(['3', ...enabledBots]);
                          botByLevel['3'].names.forEach(name => instance?.executeString(`addbot ${botByLevel['3'].model} ${name} 3`));
                        })
                        .finally(() => snackbar({
                          open: true, close: false,
                          variant: 'alert',
                          message: t('snackbar.Hit `Esc` to open top bar menu and remove/add bots.')
                        }));
                    }}
                  >{t('buttons.Play')}</LoadingButton>
                </Stack>
            }
          </Box>
        </Box>
        <canvas id="canvas" ref={canvas} width={800} height={600} style={{
          width: '100%', height: '100%', position: 'absolute', zIndex: 100,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: mainRunning ? '#000' : 'transparent'
        }}></canvas>
      </CardContent>
      <DownloadIndicator {...{ downloadProgress }} />
    </Card>
  )
}
