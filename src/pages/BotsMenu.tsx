import BotIcon from '../components/icons/BotIcon';
import { IconButton, Menu, MenuItem, Switch } from '@mui/material';
import { Module } from '../types/Module';
import {Dispatch, SetStateAction, useState} from 'react';
import { useTranslation } from 'react-i18next';

export type Props = {
  instance?: Module
  enabledBots: BotSkill[]
  setEnabledBots: Dispatch<SetStateAction<BotSkill[]>>
}

export const botByLevel = {
  '5': {
    model: 'recon',
    names: ['recon1', 'recon2', 'recon3', 'recon4']
  },
  '3': {
    model: 'hgrunt',
    names: ['hgrunt1', 'hgrunt2', 'hgrunt3']
  },
  '1': {
    model: 'robo',
    names: ['6aprJlagep', 'o6pblra']
  }
}

export type BotSkill = (keyof typeof botByLevel);

export default ({ instance, setEnabledBots, enabledBots }: Props) => {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (<>
    <IconButton
      onClick={handleClick}
    ><BotIcon /></IconButton>
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      {Object.entries(botByLevel).map(([skill, { names, model }]) =>
        <MenuItem key={skill}>{t(`bots.${skill}`)} <Switch checked={enabledBots.includes(skill as BotSkill)} onChange={(e, checked) => {
          if (checked) {
            setEnabledBots([skill as BotSkill, ...enabledBots]);
            names.forEach(name => instance?.executeString(`addbot ${model} ${name} ${skill}`));
          }
          else {
            setEnabledBots(enabledBots.filter(bn => bn !== skill));
            names.forEach(name => instance?.executeString(`kick "${name}"`));
          }
        }} /></MenuItem>)}
    </Menu>
  </>)
}
