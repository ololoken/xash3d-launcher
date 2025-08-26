import useYSDK from '../hooks/useYSDK';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Box, Button, MobileStepper, Paper, Stack, TextField, Typography } from '@mui/material';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Module } from '../types/Module';
import { useTranslation } from 'react-i18next';

export type Props = {
  instance?: Module
  mainRunning: boolean
  playerName: string
  setPlayerName: Dispatch<SetStateAction<string>>
  cols: number
}

export default ({ instance, mainRunning, playerName, setPlayerName, cols }: Props) => {
  const { t } = useTranslation();
  const [playerModel, setPlayerModel] = useState('gordon');
  const [models, setModels] = useState<Array<string>>([]);
  const [activeStep, setActiveStep] = useState(0);

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
      .then(setPlayerName)
      .then(() => instance.getCVar('model'))// getCVar calls must go in sequence
      .then((name: string) => name || 'gordon')
      .then(setPlayerModel);

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
    setPlayerModel(models[activeStep]);
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
        onChange={e => setPlayerName(e.target.value)}
        label={t('input.Player name')} variant="standard" />
    </Stack>
  )
}
