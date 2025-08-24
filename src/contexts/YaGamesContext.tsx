import { createContext, ReactNode, useEffect, useState } from 'react';

import {SDK, SdkEventName} from 'ysdk';
import Loading from '../components/Loading';

type ContextType = {
  sdk: SDK
}

type Props = {
  children: ReactNode
}

const YaGamesContext = createContext<ContextType>({} as ContextType);


export const YaGamesProvider = ({ children }: Props) => {
  const [state, setState] = useState<ContextType>({} as ContextType);

  useEffect(() => {
    try {
      YaGames.init().then(sdk => {
        setState({sdk})
      });
    }
    catch (e) {
      setState({
        sdk: {
          dispatchEvent: (eventName: SdkEventName, detail?: any) => Promise.resolve(),
          environment: {
            i18n: { lang: 'ru' },
            payload: (new URL(String(location))).searchParams.get('payload')
          },
          getFlags: async () => ({ SHOW_EXTRA_OPTIONS: 'OFF' }),
          features: {
            LoadingAPI: {
              ready: () => console.log('ya ready')
            }
          },
          getPlayer: () => Promise.resolve({
            getName: () => 'ololoken'
          }),
          clipboard: {
            writeText: (str: string) => navigator.clipboard.writeText(str)
          }
        } as unknown as SDK
      })
    }
  }, []);

  return <Loading loading={!state?.sdk}>
    <YaGamesContext.Provider value={{
      ...state
    }}>{children}</YaGamesContext.Provider>
  </Loading>;
};

export default YaGamesContext;
