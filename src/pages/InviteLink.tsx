import useYSDK from '../hooks/useYSDK';
import { Button, TextField, Tooltip, tooltipClasses } from '@mui/material';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { Module } from '../types/Module';
import { snackbar } from '../common/snackbar';
import { useTranslation } from 'react-i18next';

export type Props = {
  instance?: Module
}

export default ({ instance }: Props) => {
  const { t } = useTranslation();
  const { sdk } = useYSDK();

  const serverUrl = ((url) => {
    url.searchParams.delete('payload')
    url.searchParams.append('payload', instance?.net?.getHostId())
    return url;
  })(new URL(import.meta.env.PROD ? 'https://yandex.ru/games/app/460673' : `${location.host}`));

  return (<>
    <Tooltip title={t('menu.Link')} slotProps={{ popper: { sx: {
          [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { color: '#000', fontSize: '1em' }
        } }}}>
      <TextField
        variant="outlined"
        slotProps={{
          htmlInput: {
            readOnly: true,
            onMouseDown: (e: MouseEvent) => e.preventDefault(),
            sx: { padding: '5px 5px' },
          },
          input: {
            endAdornment: <Button startIcon={<CopyOutlined />}>{t('buttons.Copy')}</Button>,
            startAdornment: <LinkOutlined />
          }
        }}
        value={serverUrl}
        onClick={() => {
          sdk.clipboard.writeText(String(serverUrl));
          snackbar({
            open: true,
            message: t('snackbar.Link Copied'),
            variant: 'alert',
            close: false
          })
        }}
        fullWidth
      />
    </Tooltip>
  </>)
}
