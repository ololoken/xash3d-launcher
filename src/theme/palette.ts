import { presetDarkPalettes } from '@ant-design/colors';
import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';

const colors = presetDarkPalettes;

const greyPrimary = [
  'rgb(19, 22, 29)',
  'rgb(42, 46, 60)',
  '#313745',
  '#595959',
  '#8c8c8c',
  '#bfbfbf',
  '#d9d9d9',
  '#f0f0f0',
  '#f5f5f5',
  '#fafafa',
  '#ffffff'
];
const greyAscent = ['#fafafa', '#bfbfbf', '#434343', '#1f1f1f'];
const greyConstant = ['rgb(33, 35, 47)', '#d3d8db'];

colors.grey = [...greyPrimary, ...greyAscent, ...greyConstant];

const { grey } = colors;
const greyColors = {
  0: grey[0],
  50: grey[1],
  100: grey[2],
  200: grey[3],
  300: grey[4],
  400: grey[5],
  500: grey[6],
  600: grey[7],
  700: grey[8],
  800: grey[9],
  900: grey[10],
  A50: grey[15],
  A100: grey[11],
  A200: grey[12],
  A400: grey[13],
  A700: grey[14],
  A800: grey[16]
};
const contrastText = '#fff';

const primaryColors = ['#222130', '#2b2946', '#37335a', '#443e78', '#554ca0', '#655ac8', '#9186dd', '#5F53DF', '#c3baf4', '#efecfb'];
const errorColors = ['#321d1d', '#7d2e28', '#FF4D4F', '#e66859', '#f8baaf'];
const warningColors = ['#342c1a', '#836611', '#dda705', '#e9bf28', '#f8e577'];
const infoColors = ['#1a2628', '#11595f', '#597EF7', '#1ea6aa', '#64cfcb'];
const successColors = ['#1a2721', '#115c36', '#52C41A', '#1da65d', '#61ca8b'];

const paletteColor = {
  primary: {
    lighter: primaryColors[0],
    100: primaryColors[1],
    200: primaryColors[2],
    light: primaryColors[3],
    400: primaryColors[4],
    main: primaryColors[5],
    dark: primaryColors[6],
    700: primaryColors[7],
    darker: primaryColors[8],
    900: primaryColors[9],
    contrastText
  },
  secondary: {
    lighter: greyColors[100],
    100: greyColors[100],
    200: greyColors[200],
    light: greyColors[300],
    400: greyColors[400],
    main: greyColors[500]!,
    600: greyColors[600],
    dark: greyColors[700],
    800: greyColors[800],
    darker: greyColors[900],
    A100: greyColors[0],
    A200: greyColors.A400,
    A300: greyColors.A700,
    contrastText: greyColors[0]
  },
  error: {
    lighter: errorColors[0],
    light: errorColors[1],
    main: errorColors[2],
    dark: errorColors[3],
    darker: errorColors[4],
    contrastText
  },
  warning: {
    lighter: warningColors[0],
    light: warningColors[1],
    main: warningColors[2],
    dark: warningColors[3],
    darker: warningColors[4],
    contrastText: greyColors[100]
  },
  info: {
    lighter: infoColors[0],
    light: infoColors[1],
    main: infoColors[2],
    dark: infoColors[3],
    darker: infoColors[4],
    contrastText
  },
  success: {
    lighter: successColors[0],
    light: successColors[1],
    main: successColors[2],
    dark: successColors[3],
    darker: successColors[4],
    contrastText
  },
  grey: greyColors
};

const { palette } = createTheme({
  palette: {
    mode: 'dark',
    common: {
      black: '#000',
      white: '#fff'
    },
    ...paletteColor,
    text: {
      primary: alpha(paletteColor.grey[900]!, 0.87),
      secondary: alpha(paletteColor.grey[900]!, 0.45),
      disabled: alpha(paletteColor.grey[900]!, 0.1)
    },
    action: {
      disabled: paletteColor.grey[300]
    },
    divider: alpha(paletteColor.grey[900]!, 0.05),
    background: {
      paper: paletteColor.grey[100],
      default: paletteColor.grey.A50
    }
  }
})

export default palette;
