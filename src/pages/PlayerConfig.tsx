import useYSDK from '../hooks/useYSDK';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Box, Button, MobileStepper, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Module } from '../types/Module';
import { dispatch, useSelector } from '../store';
import { useTranslation } from 'react-i18next';
import { model, name } from '../store/reducers/game';

export type Props = {
  instance?: Module
  mainRunning: boolean
}

export default ({ instance, mainRunning }: Props) => {
  const { t } = useTranslation();

  const [models, setModels] = useState<Array<string>>([]);
  const [activeStep, setActiveStep] = useState(0);
  const { playerModel, playerName } = useSelector(state => state.game);

  const { sdk } = useYSDK();

  useEffect(() => {
    if (!instance || !mainRunning) return;
    instance.getCVar('name')
      .then((name: string) => {
        if (name === 'Player') {
          return sdk.getPlayer().then(player => player.getName() ?? name);
        }
        return name
      })
      .then((playerName: string) => dispatch(name(playerName)))
      .then(() => instance.getCVar('model'))// getCVar calls must go in sequence
      .then((playerModel: string) => dispatch(model(playerModel || 'gordon')));

    setModels(Object.keys(instance.FS.analyzePath(`${instance?.ENV.HOME}/rodir/valve/models/player`)?.object?.contents ?? {}).sort());

  }, [instance, mainRunning]);

  useEffect(() => {
    setActiveStep(models.findIndex(m => m === playerModel) ?? 0);
  }, [playerModel, models])

  useEffect(() => {
    instance?.executeString(`name "${playerName}"`)
    instance?.executeString(`hostname "${playerName}"`)
  }, [playerName]);

  useEffect(() => {
    instance?.executeString(`model ${playerModel}`)
  }, [playerModel]);

  useEffect(() => {
    if (playerModel === models[activeStep]) return;
    dispatch(model(models[activeStep]))
  }, [activeStep]);

  const getModelURL = (name: string) => {
    try {
      return URL.createObjectURL(new Blob([(instance?.FS.readFile(`${instance?.ENV.HOME}/rodir/valve/models/player/${name}/${name}.bmp`, { encoding: 'binary' })) ?? '']));
    }
    catch (ignore) {}
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
  }

  const move = (dir: number) => setActiveStep((prevActiveStep) => prevActiveStep + dir);

  return (!mainRunning ? <></> :
    <Stack direction="column">
      <Box sx={{ maxWidth: 400 }}>
        <Paper
          square
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 50,
            pl: 2,
            bgcolor: 'background.default',
          }}
        >
          <Typography>{models[activeStep] ? t(`models.${models[activeStep]}`) : ''}</Typography>
        </Paper>
        <Box sx={{ p: 2 }}>
          <img
            alt={models[activeStep]}
            src={getModelURL(models[activeStep])}
            onMouseDown={e => e.preventDefault()}
            width={160}
            height={200}
          />
        </Box>
        <MobileStepper
          variant="text"
          steps={models.length}
          position="static"
          activeStep={activeStep}
          nextButton={
            <Button
              onClick={() => move(1)}
              disabled={activeStep === models.length - 1}
              endIcon={<ArrowRightOutlined />}
            >
              {t('buttons.Next')}
            </Button>
          }
          backButton={
            <Button
              onClick={() => move(-1)}
              disabled={activeStep === 0}
              startIcon={<ArrowLeftOutlined />}
            >
              {t('buttons.Back')}
            </Button>
          }
        />
      </Box>
      <TextField
        slotProps={{
          htmlInput: {
            onKeyPress: (e: KeyboardEvent) => e.stopPropagation(),
            onKeyUp: (e: KeyboardEvent) => e.stopPropagation(),
            onKeyDown: (e: KeyboardEvent) => e.stopPropagation(),
          }
        }}
        value={playerName}
        onChange={e => dispatch(name(e.target.value))}
        label={t('input.Player name')} variant="standard" />
    </Stack>
  )
}
