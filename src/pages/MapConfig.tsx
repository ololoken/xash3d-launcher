import {
  Card,
  CardContent,
  CardMedia,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Stack,
  Typography
} from '@mui/material';
import { Module} from '../types/Module';
import { useTranslation} from 'react-i18next';
import { Dispatch, SetStateAction} from 'react';

const mapImagesPrefix = '../assets/images/maps';
const mapImages = import.meta.glob(`../assets/images/maps/*.webp`, { eager: true, as: 'url' });

export type Props = {
  instance?: Module
  selectedMap: string
  setSelectedMap: Dispatch<SetStateAction<string>>
}

export default ({ instance, setSelectedMap, selectedMap }: Props) => {
  const { t } = useTranslation();

  return (
    <Stack direction="row">
      <List subheader={<ListSubheader>{t('settings.Select map')}</ListSubheader>} sx={{ minWidth: 120 }}>
        {Object.keys(instance?.FS.analyzePath(`${instance?.ENV.HOME}/rodir/valve/maps`)?.object?.contents ?? {}).sort().map(name =>
          <ListItemButton key={name} selected={selectedMap === name} onClick={() => setSelectedMap(name) }>
            <ListItemText secondary={t(`maps.name.${name}`)} />
          </ListItemButton>
        )}
      </List>
      <Card sx={{ borderRadius: 0, background: 'transparent' }}>
        <CardMedia
          sx={{ minHeight: 240, minWidth: 400 }}
          image={mapImages[`${mapImagesPrefix}/${selectedMap}.webp`]}
          title="green iguana"
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" sx={{ textTransform: 'uppercase' }} >{t(`maps.name.${selectedMap}`)}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t(`maps.description.${selectedMap}`)}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  )
}
