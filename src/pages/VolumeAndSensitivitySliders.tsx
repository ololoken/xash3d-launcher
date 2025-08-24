import MouseIcon from '../components/icons/MouseIcon';
import { Module } from '../types/Module';
import { Slider, Stack, Tooltip, tooltipClasses } from '@mui/material';
import { SoundOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Props = {
  mainRunning: boolean
  instance?: Module
}

export default ({ mainRunning, instance }: Props) => {
  const { t } = useTranslation();

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
        <Tooltip title={t('menu.Volume {{vol}}', { vol: (volume*100).toFixed(0) })} slotProps={{ popper: { sx: {
              [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: {  color: '#000', fontSize: '1em' }
            } }}}>
          <Slider value={volume} onChange={(ignore, value) => setVolume(value)} min={0.0} max={1.0} step={0.05} sx={{ minWidth: 120 }} />
        </Tooltip>
      </Stack>
      <Stack spacing={2} direction="row" sx={{ alignItems: 'center', mb: 1 }}>
        <MouseIcon />
        <Tooltip title={t('menu.Sensitivity {{sens}}', { sens: sensitivity.toFixed(2) })} slotProps={{ popper: { sx: {
              [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: {  color: '#000', fontSize: '1em' }
            } }}}>
          <Slider value={sensitivity} onChange={(ignore, value) => setSensitivity(value)} min={0.1} max={3.0} step={0.05} sx={{ minWidth: 120 }} />
        </Tooltip>
      </Stack>
    </>
  )
}
