import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { db } from '../../src/config/firebaseConfig';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';

type Position = 'Ponteiro' | 'Central' | 'Líbero' | 'Oposto' | 'Levantador';

interface Player {
  id: string;
  surname: string;
  position: Position;
  number: number;
  teamId?: string;
}

interface RouteParams {
  teamId: string;
  scoutName: string;
  scoutDate: string;
  players: string;
}

interface PointLog {
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
  const [pointLog, setPointLog] = useState<PointLog[]>([]);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const actions = ['Defesa', 'Levantamento', 'Ataque', 'Bloqueio', 'Passe', 'Saque'];
  const buttonWidth = (screenWidth * 0.5 - 57) / 5; // Calcula a largura dos botões de ação
  const buttonHeight = (screenHeight - 130) / 6; // Calcula a altura dos botões de ação
  const playerHeight = (screenHeight - 78) / 7; // Calcula a altura dos botões de ação

  useEffect(() => {
    async function setOrientationAndImmersive() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      await NavigationBar.setVisibilityAsync('hidden'); // Oculta a barra de navegação
      await NavigationBar.setBehaviorAsync('overlay-swipe'); // Opcional: deslizar para mostrar
    }

    setOrientationAndImmersive();

    return () => {
      ScreenOrientation.unlockAsync();
      NavigationBar.setVisibilityAsync('visible'); // Mostra a barra ao sair
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
        
        // Ordenar os atletas na tela de scout pela posição
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

  const renderActionButtonRow = (action: string) => {
    return (
      <View style={styles.actionRow} key={action}>
        <Text style={[
          styles.actionRowTitle,
          {width: buttonWidth, height: buttonHeight}
        ]}>
          {action === 'Levantamento' ? 'Levant.' : action}
        </Text>
        {[3, 2, 1, 0].map((score, index, arr) =>
          renderActionButton(action, score, index, arr.length)
        )}
      </View>
    );
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
        isOurPoint = false; // Ponto para o adversário
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
    const newLogEntry: PointLog = {
      playerId,
      surname: selectedPlayerForAction?.surname,
      action,
      quality,
    };
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
      // setOurScore(lastPoint.ourScore);
      // setOpponentScore(lastPoint.opponentScore);
      Alert.alert('Ação Desfeita', 'A última ação foi removida.');
    } else {
      Alert.alert('Atenção', 'Não há ações para desfazer.');
    }
  };

  const handleSubstitution = () => {
    fetchAllTeamPlayersForSubstitution();
  };

  const handleSelectPlayerToRemove = (playerId: string) => {
    setSubstituteOutPlayerId(playerId);
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
    // Adicione aqui qualquer lógica adicional para o início de um novo set.
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
            // Adicione aqui a lógica para salvar os dados do jogo, etc.
            router.push('/screens/ScoutHistoryScreen'); // Exemplo de navegação para a tela inicial
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderPlayerItem = ({ item, index }: { item: Player, index: number }) => {
    const isSelected = selectedPlayerForAction?.id === item.id;
    const shouldBeOpaque = selectionMode === 'none' || isSelected || (selectionMode === 'action' && selectedActionForPlayer);
    const opacity = shouldBeOpaque ? 1 : 0.5;
    const isLastItem = index === selectedPlayers.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.playerItem,
          isSelected && styles.selectedPlayerItem,
          { opacity: opacity, height: playerHeight, marginBottom: isLastItem ? 0 : 5 }
        ]}
        onPress={() => handlePlayerClick(item)}
        disabled={selectionMode === 'action' && !selectedActionForPlayer}
      >
      <Text numberOfLines={1} ellipsizeMode="tail">
        {item.surname} (#{item.number})
      </Text>
      </TouchableOpacity>
    );
  };

  const renderActionButton = (
    title: string,
    value: number,
    index: number,
    total: number
  ) => {
    const isSelected = selectedActionForPlayer === title && selectedActionQuality === value;
    const shouldBeOpaque = selectionMode === 'none' || isSelected || (selectionMode === 'player' && selectedPlayerForAction);
    const opacity = shouldBeOpaque ? 1 : 0.5;
  
    const isLast = index === total - 1;
  
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.actionButton,
          (styles as any)[`actionButton${value}`],
          isSelected && styles.selectedActionButton,
          {
            opacity,
            width: buttonWidth,
            height: buttonHeight,
            marginRight: isLast ? 0 : 8,
          }
        ]}
        onPress={() => handleActionButtonPress(title, value)}
        disabled={selectionMode === 'player' && !selectedPlayerForAction}
      >
        <Text style={styles.actionButtonText}>{value}</Text>
      </TouchableOpacity>
    );
  };
  
  const renderSubstitutionModal = () => {
    if (!substitutionsVisible) return null;

    return (
      <View style={styles.substitutionModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Substituição</Text>
          <Text style={styles.modalSubtitle}>Jogador saindo:</Text>
          <FlatList
            data={selectedPlayers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalPlayerItem,
                  substituteOutPlayerId === item.id && styles.modalPlayerItemSelected,
                ]}
                onPress={() => handleSelectPlayerToRemove(item.id)}
              >
                <Text>{item.surname} (#{item.number})</Text>
              </TouchableOpacity>
            )}
          />
          {substituteOutPlayerId && (
            <View>
              <Text style={styles.modalSubtitle}>Jogador entrando:</Text>
              {loadingAllPlayers ? (
                <Text>Carregando suplentes...</Text>
              ) : error ? (
                <Text style={styles.error}>{error}</Text>
              ) : allTeamPlayers.length > 0 ? (
                <FlatList
                  data={allTeamPlayers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalPlayerItem}
                      onPress={() => handlePerformSubstitution(item.id)}
                    >
                      <Text>{item.surname} (#{item.number})</Text>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text>Não há suplentes disponíveis.</Text>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSubstitutionsVisible(false)}>
            <Text style={styles.modalCloseButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <FlatList
          data={selectedPlayers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderPlayerItem({ item, index })}
        />
        <View style={styles.scoutLog}>
            <Text style={styles.logTitle}>Log</Text>
            <ScrollView
              ref={scrollViewRef}
            >
              {[...pointLog].reverse().map((logEntry, index) => {
                const qualityColor =
                  logEntry.quality === 0 ? '#FF4D4D' :
                  logEntry.quality === 1 ? '#FF9900' :
                  logEntry.quality === 2 ? '#9ACD32' :
                  logEntry.quality === 3 ? '#4CAF50' :
                  logEntry.action === 'Erro Nosso' ? '#FF4D4D' :
                  logEntry.action === 'Erro Adversário' ? '#4CAF50' :
                  logEntry.action === 'Ponto Nosso' ? '#4CAF50' :
                  logEntry.action === 'Ponto Adversário' ? '#FF4D4D' :
                  'black'; // Cor padrão se a qualidade não corresponder
                const playerName = selectedPlayers.find(p => p.id === logEntry.playerId)?.surname || 'Desconhecido';

                return (
                  <Text key={index} numberOfLines={2} ellipsizeMode="tail" style={[styles.logEntryText, { backgroundColor: qualityColor }]}>
                  {playerName === "Desconhecido"
                    ? (logEntry.action === "Levantamento" ? "Levant." : logEntry.action === "Ponto Adversário" ? "Ponto Adver." : logEntry.action === "Erro Adversário" ? "Erro Adver." : logEntry.action)
                    : `${playerName} - ${logEntry.action === "Levantamento" ? "Levant." : logEntry.action === "Ponto Adversário" ? "Ponto Adver." : logEntry.action}`}
                </Text>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={styles.rightContainer}>
          <ScrollView style={styles.actionsContainer}>
            {actions.map(action => renderActionButtonRow(action))}
          </ScrollView>

          <View style={styles.scoreButtonsContainer}>
            <View style={styles.scoreButtonsRow}>
              {/* <TouchableOpacity style={styles.scoreButton} onPress={() => handleScoreButtonClick(true, 'Ponto Nosso')}>
                <Text style={styles.scoreButtonText}>Ponto Nosso</Text>
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.scoreButton} onPress={() => handleScoreButtonClick(false, 'Ponto Adversário')}>
                <Text style={styles.scoreButtonText}>Ponto Adversário</Text>
              </TouchableOpacity>
            {/* </View> */}
            {/* <View style={styles.scoreButtonsRow}> */}
              {/* <TouchableOpacity style={styles.scoreButton} onPress={() => handleScoreButtonClick(false, 'Erro Nosso')}>
                <Text style={styles.scoreButtonText}>Erro Nosso</Text>
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.scoreButton} onPress={() => handleScoreButtonClick(true, 'Erro Adversário')}>
                <Text style={styles.scoreButtonText}>Erro Adversário</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

    </View>


    {renderSubstitutionModal()}
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
backButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 8,
  marginLeft: 8,
},
backButtonText: {
  color: 'white',
  marginLeft: 5,
  fontWeight: 'bold',
},
undoButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 8,
  marginRight: 8,
},
undoButtonText: {
  color: 'white',
  marginLeft: 5,
  fontWeight: 'bold',
},
topLeftButton: {
  padding: 8,
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
substitutionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'blue',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 5,
  marginRight: 8,
},
topBarLeft: {
  flexDirection: 'row',
  alignItems: 'center',
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
  flex: 1, // Permite que a lista de jogadores preencha o espaço disponível
},
scoutLog: {
  width: '33%',
  paddingLeft: '3%',
},
logTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 8,
  textAlign: 'center',
},
logEntryText: {
  fontSize: 14,
  fontWeight: 'bold',
  color: 'white',
  marginBottom: 4,
  borderRadius: 5,
  padding: 5,
},
rightContainer: {
  flexDirection: 'column',
  width: '50%',
},
playerItem: {
  backgroundColor: 'white',
  fontSize: 16,
  paddingInline: 10,
  marginBottom: 5,
  borderRadius: 3,
  opacity: 1, // Default opacity
  justifyContent: 'center', // Centraliza o conteúdo verticalmente
},
selectedPlayerItem: {
  backgroundColor: 'lightblue',
},
actionButton3: { backgroundColor: '#4CAF50' },
actionButton2: { backgroundColor: '#9ACD32' },
actionButton1: { backgroundColor: '#FF9900' },
actionButton0: { backgroundColor: '#FF4D4D' },
selectedActionButton: {
  opacity: 1,
  borderWidth: 2,
  borderColor: 'blue',
},
substitutionModal: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 10,
  width: '80%',
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
},
modalSubtitle: {
  fontSize: 16,
  fontWeight: 'bold',
  marginTop: 15,
  marginBottom: 5,
},
modalPlayerItem: {
  backgroundColor: '#f0f0f0',
  padding: 10,
  marginBottom: 5,
  borderRadius: 3,
},
modalPlayerItemSelected: {
  backgroundColor: 'lightblue',
},
modalCloseButton: {
  backgroundColor: 'red',
  padding: 10,
  borderRadius: 5,
  marginTop: 20,
  alignItems: 'center',
},
modalCloseButtonText: {
  color: 'white',
  fontWeight: 'bold',
},
error: {
  color: 'red',
  fontSize: 12,
  marginTop: 5,
},
menuContainer: {
  position: 'absolute',
  top: 40, // Abaixo da topBar
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
scoreButtonsContainer: {
  padding: 4,
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
},
scoreButtonsRow: {
  flexDirection: 'row',
  textAlign: 'center',
},
scoreButton: {
  backgroundColor: '#007bff',
  paddingVertical: 6, // Aumentei um pouco o padding vertical
  paddingHorizontal: 14, // Aumentei um pouco o padding horizontal
  borderRadius: 5,
  marginHorizontal: 6,
},
scoreButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 12, // Aumentei um pouco a fonte
  width: 100,
  textAlign: 'center', // Centraliza o texto
},
actionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 4,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#ccc',
},
actionRowTitle: {
  fontSize: 12,
  fontWeight: 'bold',
  width: 80, // Ajuste a largura conforme necessário
  display: 'flex',
  alignItems: 'center',
},
actionButton: {
  borderRadius: 5,
  justifyContent: 'center',
  alignItems: 'center',
  opacity: 0.5,
},
actionButtonText: {
  color: 'white',
  fontWeight: 'bold',
},
});

export default ScoutScreen;