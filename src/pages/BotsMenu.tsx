import { Module } from '../types/Module';
import {Button, IconButton, Menu, MenuItem, Switch} from '@mui/material';
import BotIcon from '../components/icons/BotIcon';
import {useTranslation} from "react-i18next";
import {useState} from "react";

export type Props = {
  instance?: Module
}

//const bots = ['o6pblra', 'cpuHKaPb', 'MaMuH nupo}l{oK', 'nopK', 'cKycp']
const bots = [{
  name: 'bot0',
  model: 'recon',
  skill: 2
}, {
  name: 'bot1',
  model: 'recon',
  skill: 3,
}, {
  name: 'bot2',
  model: 'recon',
  skill: 2
}, {
  name: 'bot3',
  model: 'recon',
  skill: 3
}, {
  name: 'bot4',
  model: 'zombie',
  skill: 1
}, {
  name: 'bot5',
  model: 'zombie',
  skill: 1,
}, {
  name: 'bot6',
  model: 'zombie',
  skill: 1,
}]

export default ({ instance }: Props) => {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [enabledBots, setEnabledBots] = useState<string[]>([]);

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
      {bots.map(({ name, skill, model }) =>
        <MenuItem key={name}>{name} <Switch checked={enabledBots.includes(name)} onChange={(e, checked) => {
          if (checked) {
            setEnabledBots([name, ...enabledBots]);
            instance?.executeString(`addbot ${model} ${name} ${skill}`);
          }
          else {
            setEnabledBots(enabledBots.filter(bn => bn !== name));
            instance?.executeString(`kick "${name}"`)
          }
        }} /></MenuItem>)}
    </Menu>
  </>)
}
