import { BotSkill } from '../../pages/BotsMenu';
import { createSlice } from '@reduxjs/toolkit';

export type GameProps = {
  playerName: string
  playerModel: string

  selectedMap: string

  enabledBots: BotSkill[]

  servers: Record<number, Record<string, string | number>>

  connecting: boolean
  connected: boolean
  showSettings: boolean
  serverStarting: boolean
  serverRunning: boolean
}

const initialState: GameProps = {
  playerName: '',
  playerModel: '',

  selectedMap: 'crossfire.bsp',

  enabledBots: [],

  servers: {},

  connecting: false,
  connected: false,
  showSettings: true,
  serverStarting: false,
  serverRunning: false,
}


const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    model: (state, action) => {
      state.playerModel = action.payload ?? initialState.playerModel
    },
    name: (state, action) => {
      state.playerName = action.payload ?? initialState.playerName
    },
    bots: (state, action) => {
      state.enabledBots = action.payload ?? initialState.enabledBots;
    },
    map: (state, action) => {
      state.selectedMap = action.payload ?? initialState.selectedMap;
    },
    publicServers: (state, action) => {
      state.servers = action.payload ?? initialState.servers
    },
    addServer: (state, action) => {
      state.servers = {...state.servers, ...action.payload}
    },
    removeServer: (state, action) => {
      delete state.servers[action.payload];
    },
    flow: (state, action) => {
      state.connecting = action.payload.connecting ?? state.connecting;
      state.connected = action.payload.connected ?? state.connected;
      state.showSettings = action.payload.showSettings ?? state.showSettings;
      state.serverStarting = action.payload.serverStarting ?? state.serverStarting;
      state.serverRunning = action.payload.serverRunning ?? state.serverRunning;
    }
  }
});

export default gameSlice.reducer;

export const { model, name, bots, map, publicServers, addServer, removeServer, flow } = gameSlice.actions;
