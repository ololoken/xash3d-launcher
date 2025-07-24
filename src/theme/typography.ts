import { TypographyVariantsOptions } from '@mui/material/styles';


export default (fontFamily: string): TypographyVariantsOptions => ({
  htmlFontSize: 16,
  fontFamily,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  h1: {
    fontWeight: 600,
    fontSize: '3.8rem',
    lineHeight: 1.21
  },
  h2: {
    fontWeight: 600,
    fontSize: '3rem',
    lineHeight: 1.27
  },
  h3: {
    fontWeight: 600,
    fontSize: '2.4rem',
    lineHeight: 1.33
  },
  h4: {
    fontWeight: 600,
    fontSize: '2rem',
    lineHeight: 1.4
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.6rem',
    lineHeight: 1.5
  },
  h6: {
    fontWeight: 400,
    fontSize: '1.4rem',
    lineHeight: 1.57
  },
  caption: {
    fontWeight: 400,
    fontSize: '1.2rem',
    lineHeight: 1.66
  },
  body1: {
    fontSize: '1.4rem',
    lineHeight: 1.57
  },
  body2: {
    fontSize: '1.2rem',
    lineHeight: 1.66
  },
  subtitle1: {
    fontSize: '1.4rem',
    fontWeight: 600,
    lineHeight: 1.57
  },
  subtitle2: {
    fontSize: '1.2rem',
    fontWeight: 500,
    lineHeight: 1.66
  },
  overline: {
    lineHeight: 1.66
  },
  button: {
    textTransform: 'capitalize'
  },
});
