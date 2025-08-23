import MouseIcon from '../components/icons/MouseIcon';
import { Module } from '../types/Module';
import { Slider, Stack } from '@mui/material';
import { SoundOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

export type Props = {
  mainRunning: boolean
  instance?: Module
}

export default ({ mainRunning, instance }: Props) => {

  const [volume, setVolume] = useState(0.0);
  const [sensitivity, setSensitivity] = useState(0.0);

  useEffect(() => {
    if (!instance || !mainRunning) return;
    instance.getCVar('volume').then((vol: string) => setVolume(Number(vol)));
    instance.getCVar('sensitivity').then((sens: string) => setSensitivity(Number(sens)));
  }, [instance, mainRunning]);

  useEffect(() => {
    if (!instance || !mainRunning) return;
    instance.executeString(`volume ${volume}`);
  }, [volume]);

  useEffect(() => {
    if (!instance || !mainRunning) return;
    instance.executeString(`sensitivity ${sensitivity}`);
  }, [sensitivity]);

  if (!mainRunning) return;

  return (
    <>
      <Stack spacing={2} direction="row" sx={{ alignItems: 'center', mb: 1 }}>
        <SoundOutlined />
        <Slider value={volume} onChange={(ignore, value) => setVolume(value)} min={0.0} max={1.0} step={0.05} sx={{ minWidth: 120 }} />
      </Stack>
      <Stack spacing={2} direction="row" sx={{ alignItems: 'center', mb: 1 }}>
          <MouseIcon />
          <Slider value={sensitivity} onChange={(ignore, value) => setSensitivity(value)} min={0.1} max={3.0} step={0.05} sx={{ minWidth: 120 }} />
      </Stack>
    </>
  )
}
