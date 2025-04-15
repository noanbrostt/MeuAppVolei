import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Alert, Dimensions, TouchableOpacity, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { db } from '../../../src/config/firebaseConfig';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';

import { Player } from '../types';
import PlayerList from './PlayerList';
import ActionButtons from './ActionButtons';
import ScoreButtons from './ScoreButtons';
import PointLog from './PointLog';
import SubstitutionModal from './SubstitutionModal';

type RouteParams = {
  teamId: string;
  scoutName: string;
  scoutDate: string;
  players: string;
};

interface PointLogType {
  playerId?: string;
  surname?: string;
  action?: string;
  quality?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ScoutScreen = () => {
  const { teamId, scoutName, scoutDate, players: playersString } = useLocalSearchParams<RouteParams>();
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [ourScore, setOurScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [substitutionsVisible, setSubstitutionsVisible] = useState(false);
  const [allTeamPlayers, setAllTeamPlayers] = useState<Player[]>([]);
  const [substituteOutPlayerId, setSubstituteOutPlayerId] = useState<string | null>(null);
  const [loadingInitialPlayers, setLoadingInitialPlayers] = useState(true);
  const [loadingAllPlayers, setLoadingAllPlayers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'none' | 'player' | 'action'>('none');
  const [selectedPlayerForAction, setSelectedPlayerForAction] = useState<Player | null>(null);
  const [selectedActionForPlayer, setSelectedActionForPlayer] = useState<string | null>(null);
  const [selectedActionQuality, setSelectedActionQuality] = useState<number | null>(null);
  const [pointLog, setPointLog] = useState<PointLogType[]>([]);
  const scrollViewRef = React.useRef<any>(null); // Usar 'any' para evitar erros de tipo com ref
  const actions = ['Defesa', 'Levantamento', 'Ataque', 'Bloqueio', 'Passe', 'Saque'];

  useEffect(() => {
    async function setOrientationAndImmersive() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBehaviorAsync('overlay-swipe');
    }

    setOrientationAndImmersive();

    return () => {
      ScreenOrientation.unlockAsync();
      NavigationBar.setVisibilityAsync('visible');
    };
  }, []);

  useEffect(() => {
    const fetchInitialPlayers = async () => {
      setLoadingInitialPlayers(true);
      setError(null);
      try {
        const playersCollection = collection(db, 'players');
        const selectedPlayersData: Player[] = [];
        const initialPlayerIds = playersString.split(',');

        for (const playerId of initialPlayerIds) {
          const playerDoc = await getDoc(doc(playersCollection, playerId));
          if (playerDoc.exists()) {
            selectedPlayersData.push({ id: playerDoc.id, ...(playerDoc.data() as Omit<Player, 'id'>) });
          } else {
            console.warn(`Jogador com ID ${playerId} não encontrado.`);
          }
        }

        const positionOrder = {
          'Ponteiro': 1,
          'Central': 2,
          'Líbero': 3,
          'Oposto': 4,
          'Levantador': 5,
        };

        selectedPlayersData.sort((a, b) => {
          const aOrder = positionOrder[a.position] ?? 999;
          const bOrder = positionOrder[b.position] ?? 999;
          return aOrder - bOrder;
        });

        setSelectedPlayers(selectedPlayersData);
      } catch (error: any) {
        setError('Erro ao carregar os jogadores selecionados.');
        console.error('Erro ao carregar jogadores selecionados:', error);
        Alert.alert('Erro', 'Erro ao carregar os jogadores selecionados.');
      } finally {
        setLoadingInitialPlayers(false);
      }
    };

    fetchInitialPlayers();
  }, [playersString]);

  const fetchAllTeamPlayersForSubstitution = async () => {
    if (!teamId) return;
    setLoadingAllPlayers(true);
    setError(null);
    try {
      const playersCollection = collection(db, 'players');
      const querySnapshot = await getDocs(collection(db, 'players'));
      const allPlayersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        const playerData = doc.data() as Player;
        if (playerData.teamId === teamId) {
          allPlayersData.push({ id: doc.id, ...playerData });
        }
      });
      setAllTeamPlayers(allPlayersData.filter(p => !selectedPlayers.some(sp => sp.id === p.id)));
    } catch (error: any) {
      setError('Erro ao carregar os jogadores do time para substituição.');
      console.error('Erro ao carregar jogadores do time:', error);
      Alert.alert('Erro', 'Erro ao carregar os jogadores do time para substituição.');
    } finally {
      setLoadingAllPlayers(false);
    }
    setSubstitutionsVisible(true);
  };

  const handlePlayerClick = (player: Player) => {
    if (selectionMode === 'none') {
      setSelectionMode('player');
      setSelectedPlayerForAction(player);
    } else if (selectionMode === 'action' && selectedActionForPlayer) {
      registerPoint(player.id, selectedActionForPlayer, selectedActionQuality, true);
      resetSelectionMode();
    } else if (selectionMode === 'player' && selectedPlayerForAction?.id === player.id) {
      resetSelectionMode();
    } else if (selectionMode === 'player') {
      setSelectedPlayerForAction(player);
    }
  };

  const handleActionButtonPress = (action: string, value: number) => {
    if (selectionMode === 'none') {
      setSelectionMode('action');
      setSelectedActionForPlayer(action);
      setSelectedActionQuality(value);
    } else if (selectionMode === 'player' && selectedPlayerForAction) {
      let shouldUpdateScore = false;
      let isOurPoint = false;

      if (value === 3 && (action === 'Ataque' || action === 'Bloqueio' || action === 'Saque')) {
        shouldUpdateScore = true;
        isOurPoint = true;
      } else if (value === 0) {
        shouldUpdateScore = true;
        isOurPoint = false;
      }

      registerPoint(selectedPlayerForAction.id, action, value, shouldUpdateScore, isOurPoint);
      resetSelectionMode();
    } else if (selectionMode === 'action' && selectedActionForPlayer === action && selectedActionQuality === value) {
      resetSelectionMode();
    } else if (selectionMode === 'action') {
      setSelectedActionForPlayer(action);
      setSelectedActionQuality(value);
    }
  };

  const handleScoreButtonClick = (isOurPoint: boolean, action: string) => {
    registerPoint(undefined, action, undefined, true, isOurPoint);
    resetSelectionMode();
  };

  const registerPoint = (
    playerId?: string,
    action?: string,
    quality?: number,
    shouldUpdateScore: boolean = false,
    isOurPointOverride?: boolean
  ) => {
    const newLogEntry: PointLogType = {
      playerId,
      surname: selectedPlayerForAction?.surname,
      action,
      quality,
    };
    console.log('Novo ponto registrado:', newLogEntry);
    setPointLog(prevLog => {
      const updatedLog = [...pointLog, newLogEntry];
      if (scrollViewRef.current) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      return updatedLog;
    });

    if (shouldUpdateScore) {
      const isOurPoint = isOurPointOverride !== undefined ? isOurPointOverride : (quality === 3);
      if (isOurPoint) {
        setOurScore(prevScore => prevScore + 1);
      } else if (quality === 0 || !isOurPointOverride) {
        setOpponentScore(prevScore => prevScore + 1);
      }
    }
  };

  const resetSelectionMode = () => {
    setSelectionMode('none');
    setSelectedPlayerForAction(null);
    setSelectedActionForPlayer(null);
    setSelectedActionQuality(null);
  };

  const handleUndoLastAction = () => {
    if (pointLog.length > 0) {
      const lastPoint = pointLog[pointLog.length - 1];
      const newLog = pointLog.slice(0, -1);
      setPointLog(newLog);
      Alert.alert('Ação Desfeita', 'A última ação foi removida.');
    } else {
      Alert.alert('Atenção', 'Não há ações para desfazer.');
    }
  };

  const handleSubstitution = () => {
    fetchAllTeamPlayersForSubstitution();
  };

  const handleSelectPlayerToRemove = (playerId: string) => {
    if (substituteOutPlayerId === playerId) {
      setSubstituteOutPlayerId(null);
    } else {
      setSubstituteOutPlayerId(playerId);
    }
  };

  const handlePerformSubstitution = (playerInId: string) => {
    if (!substituteOutPlayerId) {
      Alert.alert('Atenção', 'Selecione um jogador para substituir.');
      return;
    }

    const playerOutIndex = selectedPlayers.findIndex(p => p.id === substituteOutPlayerId);
    const playerIn = allTeamPlayers.find(p => p.id === playerInId);

    if (playerOutIndex !== -1 && playerIn) {
      const newSelectedPlayers = [...selectedPlayers];
      newSelectedPlayers[playerOutIndex] = playerIn;
      setSelectedPlayers(newSelectedPlayers);
      setSubstitutionsVisible(false);
      setSubstituteOutPlayerId(null);
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleNextSet = () => {
    setOurScore(0);
    setOpponentScore(0);
    setMenuVisible(false);
    Alert.alert('Próximo Set', 'As pontuações do set foram resetadas.');
  };

  const handleFinalizeGame = () => {
    setMenuVisible(false);
    Alert.alert(
      'Finalizar Jogo',
      'Deseja finalizar o jogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: () => {
            router.push('/screens/ScoutHistoryScreen');
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderMenu = () => {
    if (!menuVisible) return null;

    return (
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handleNextSet}>
          <Text style={styles.menuItemText}>Próximo Set</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleFinalizeGame}>
          <Text style={styles.menuItemText}>Finalizar Jogo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuCloseButton} onPress={toggleMenu}>
          <Icon name="times" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loadingInitialPlayers) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando jogadores...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>Erro ao carregar: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.topLeftButton} onPress={toggleMenu}>
            <Icon name="bars" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topLeftButton} onPress={handleSubstitution} disabled={loadingAllPlayers}>
            <Icon name="exchange" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.scoreText}>{ourScore}</Text>
        <Text style={styles.topBarSeparator}>-</Text>
        <Text style={styles.scoreText}>{opponentScore}</Text>
        <TouchableOpacity style={styles.undoButton} onPress={handleUndoLastAction}>
          <Icon name="undo" size={20} color="white" />
          <Text style={styles.undoButtonText}>Desfazer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.playerListContainer}>
          <PlayerList
            players={selectedPlayers}
            selectedPlayerId={selectedPlayerForAction?.id || null}
            onPlayerClick={handlePlayerClick}
          />

          <PointLog pointLog={pointLog} selectedPlayers={selectedPlayers} />
        </View>

        <View style={styles.rightContainer}>
          <ActionButtons
            actions={actions}
            selectedAction={selectedActionForPlayer}
            selectedQuality={selectedActionQuality}
            onActionButtonPress={handleActionButtonPress}
          />

          <ScoreButtons onScoreButtonClick={handleScoreButtonClick} />
        </View>
      </View>

      <SubstitutionModal
        visible={substitutionsVisible}
        selectedPlayers={selectedPlayers}
        allTeamPlayers={allTeamPlayers}
        substituteOutPlayerId={substituteOutPlayerId}
        onSelectPlayerToRemove={handleSelectPlayerToRemove}
        onPerformSubstitution={handlePerformSubstitution}
        onClose={() => {
          setSubstitutionsVisible(false);
          setSubstituteOutPlayerId(null);
        }}
        loadingAllPlayers={loadingAllPlayers}
        error={error}
      />

      {renderMenu()}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topBarSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: 'white',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  undoButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  topLeftButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 40,
  },
  playerListContainer: {
    flexDirection: 'row',
    width: '50%',
    padding: 4,
    paddingLeft: 5,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'column',
    width: '50%',
  },
  menuContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 10,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuItemText: {
    color: 'white',
    fontSize: 16,
  },
  menuCloseButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 5,
  },
});

export default ScoutScreen;