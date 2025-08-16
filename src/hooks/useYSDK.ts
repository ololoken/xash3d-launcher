import YaGamesContext from '../contexts/YaGamesContext';
import { useContext } from 'react';
import throwExpression from '../common/throwExpression';

export default () => useContext(YaGamesContext) ?? throwExpression(new Error('YaGamesSDK context must be use inside provider'));
