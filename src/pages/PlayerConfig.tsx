import {Box, ImageList, ImageListItem, ImageListItemBar, Stack, TextField } from '@mui/material';
import { CheckOutlined } from '@ant-design/icons';
import { Module } from '../types/Module';
import {useTranslation} from "react-i18next";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import useYSDK from "../hooks/useYSDK.ts";

export type Props = {
  instance?: Module
  mainRunning: boolean
  playerName: string
  setPlayerName: Dispatch<SetStateAction<string>>
  cols: number
}

export default ({ instance, mainRunning, playerName, setPlayerName, cols }: Props) => {
  const { t } = useTranslation();
  const [playerModel, setPlayerModel] = useState('');

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
      .then((name: string) => name === '' ? 'gordon' : name)
      .then(setPlayerModel);

  }, [instance, mainRunning]);

  useEffect(() => {
    instance?.executeString(`name ${playerName}`)
  }, [playerName]);

  useEffect(() => {
    instance?.executeString(`model ${playerModel}`)
  }, [playerModel]);

  const getModelURL = (name: string) => {
    try {
      return URL.createObjectURL(new Blob([(instance?.FS.readFile(`${instance?.ENV.HOME}/rodir/valve/models/player/${name}/${name}.bmp`, { encoding: 'binary' })) ?? '']));
    }
    catch (ignore) {}
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
  }

  return (!mainRunning ? <></> :
    <Stack direction="column">
      <ImageList {...{ cols }} rowHeight={164}>
        {Object.keys(instance?.FS.analyzePath(`${instance?.ENV.HOME}/rodir/valve/models/player`)?.object?.contents ?? {}).map((item) => (
          <ImageListItem key={item} sx={{width: 120}} >
            <img
              alt={item}
              src={getModelURL(item)}
              onMouseDown={e => e.preventDefault()}
            />
            <ImageListItemBar
              title={t(`models.${item}`)}
              sx={{ cursor: 'pointer' }}
              onClick={() => setPlayerModel(item)}
              {...(playerModel === item ? { actionIcon: <Box sx={{ marginRight: 2 }}><CheckOutlined /></Box> } : {})} />
          </ImageListItem>
        ))}
      </ImageList>
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
