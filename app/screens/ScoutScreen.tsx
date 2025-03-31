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
import { db } from '../../src/config/firebaseConfig';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import * as ScreenOrientation from 'expo-screen-orientation';

interface Player {
  id: string;
  fullName: string;
  number: number;
  teamId?: string;
}

interface RouteParams {
  teamId: string;
  scoutName: string;
  scoutDate: string;
  players: string;
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

  useEffect(() => {
    async function setOrientation() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }

    setOrientation();

    // Corrected synchronous cleanup function
    return () => {
      ScreenOrientation.unlockAsync(); // Call the async function directly
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

  const handleScore = (isOurPoint: boolean) => {
    if (isOurPoint) {
      setOurScore(ourScore + 1);
    } else {
      setOpponentScore(opponentScore + 1);
    }
  };

  const handleActionButtonPress = (value: number) => {
    if (value === 3) {
      handleScore(true);
    } else if (value === 0) {
      handleScore(false);
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
        { text: 'Finalizar', onPress: () => {
            // Adicione aqui a lógica para salvar os dados do jogo, etc.
            router.push('/screens/HomeScreen'); // Exemplo de navegação para a tela inicial
          }
        },
      ],
      { cancelable: false }
    );
  };

  const renderPlayerItem = ({ item }: { item: Player }) => (
    <View style={styles.playerItem}>
      <Text>{item.fullName} (#{item.number})</Text>
    </View>
  );

  const renderActionButton = (title: string, value: number) => (
    <TouchableOpacity
      style={[styles.actionButton, styles[`actionButton${value}`]]}
      onPress={() => handleActionButtonPress(value)}
    >
      <Text style={styles.actionButtonText}>{value}</Text>
    </TouchableOpacity>
  );

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
                <Text>{item.fullName} (#{item.number})</Text>
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
                      <Text>{item.fullName} (#{item.number})</Text>
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
        <TouchableOpacity style={styles.hamburgerButton} onPress={toggleMenu}>
          <Icon name="bars" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.scoreText}>{ourScore}</Text>
        <Text style={styles.topBarSeparator}>-</Text>
        <Text style={styles.scoreText}>{opponentScore}</Text>
        <TouchableOpacity style={styles.substitutionButton} onPress={handleSubstitution} disabled={loadingAllPlayers}>
          <Icon name="exchange" size={20} color="white" />
          <Text style={styles.substitutionButtonText}>Substituição</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.playerListContainer}>
          <View style={styles.topScoreButtons}>
            <TouchableOpacity style={styles.scoreButton} onPress={() => handleScore(true)}>
              <Text style={styles.scoreButtonText}>Ponto Nosso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scoreButton} onPress={() => handleScore(false)}>
              <Text style={styles.scoreButtonText}>Erro Nosso</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={selectedPlayers}
            renderItem={renderPlayerItem}
            keyExtractor={(item) => item.id}
          />
          <View style={styles.bottomScoreButtons}>
            <TouchableOpacity style={styles.scoreButton} onPress={() => handleScore(false)}>
              <Text style={styles.scoreButtonText}>Ponto Adversário</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scoreButton} onPress={() => handleScore(true)}>
              <Text style={styles.scoreButtonText}>Erro Adversário</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal style={styles.actionsContainer}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Defesa</Text>
            {renderActionButton('Defesa', 3)}
            {renderActionButton('Defesa', 2)}
            {renderActionButton('Defesa', 1)}
            {renderActionButton('Defesa', 0)}
          </View>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Ataque</Text>
            {renderActionButton('Ataque', 3)}
            {renderActionButton('Ataque', 2)}
            {renderActionButton('Ataque', 1)}
            {renderActionButton('Ataque', 0)}
          </View>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Bloqueio</Text>
            {renderActionButton('Bloqueio', 3)}
            {renderActionButton('Bloqueio', 2)}
            {renderActionButton('Bloqueio', 1)}
            {renderActionButton('Bloqueio', 0)}
          </View>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Saque</Text>
            {renderActionButton('Saque', 3)}
            {renderActionButton('Saque', 2)}
            {renderActionButton('Saque', 1)}
            {renderActionButton('Saque', 0)}
          </View>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Levantamento</Text>
            {renderActionButton('Levantamento', 3)}
            {renderActionButton('Levantamento', 2)}
            {renderActionButton('Levantamento', 1)}
            {renderActionButton('Levantamento', 0)}
          </View>
        </ScrollView>
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
  hamburgerButton: {
    padding: 8,
    marginLeft: 8,
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
  substitutionButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 40,
  },
  playerListContainer: {
    width: '40%',
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  topScoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  bottomScoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  scoreButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  scoreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playerItem: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 5,
    borderRadius: 3,
  },
  actionsContainer: {
    width: '60%',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8
  },
  actionButton: {
    width: 50,
    height: 30,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    },  
    actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    },
    actionButton3: { backgroundColor: 'green' },
    actionButton2: { backgroundColor: 'lightgreen' },
    actionButton1: { backgroundColor: 'yellow' },
    actionButton0: { backgroundColor: 'red' },
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
});

export default ScoutScreen;