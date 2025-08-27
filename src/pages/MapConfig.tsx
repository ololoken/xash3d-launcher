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
import { dispatch, useSelector } from '../store';
import { map } from '../store/reducers/game';
import { useTranslation} from 'react-i18next';

const mapImagesPrefix = '../assets/images/maps';
const mapImages = import.meta.glob(`../assets/images/maps/*.webp`, { eager: true, as: 'url' });

export type Props = {
  instance?: Module
}

export default ({ instance }: Props) => {
  const { t } = useTranslation();

  const { selectedMap } = useSelector(state => state.game);

  return (
    <Stack direction="row">
      <List subheader={<ListSubheader>{t('settings.Select map')}</ListSubheader>} sx={{ minWidth: 120 }}>
        {Object.keys(instance?.FS.analyzePath(`${instance?.ENV.HOME}/rodir/valve/maps`)?.object?.contents ?? {}).sort().map(name =>
          <ListItemButton
            key={name}
            dense
            selected={selectedMap === name}
            onClick={() => dispatch(map(name))
          }>
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
