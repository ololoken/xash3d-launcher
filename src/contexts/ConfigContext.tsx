import { createContext, ReactNode } from 'react';
import config from '../config';
import useLocalStorage from '../hooks/useLocalStorage';
import {useTranslation} from "react-i18next";

export type I18n =  'en-US' | 'ru-RU';

const initialState = {
  ...config,
  onChangeLocalization: (lang: I18n) => {}
};

const ConfigContext = createContext(initialState);

type ConfigProviderProps = {
  children: ReactNode;
};

function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useLocalStorage(`$config`, initialState);
  const { i18n } = useTranslation();

  const onChangeLocalization = (lang: I18n) => i18n.changeLanguage(lang)
    .then(() => setConfig({
      ...config,
      i18n: lang
    }))

  return (
    <ConfigContext.Provider
      value={{
        ...config,
        onChangeLocalization,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export { ConfigProvider, ConfigContext };
