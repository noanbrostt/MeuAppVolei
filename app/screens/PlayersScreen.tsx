import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { router, useLocalSearchParams, Link } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Player {
  id: string;
  number: number;
  fullName: string;
  position?: string;
  rg?: string;
  cpf?: string;
  allergies?: string[];
  teamId: string;
}

const PlayersScreen = () => {
  const { id: teamId } = useLocalSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<number | null>(null);
  const optionsButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!teamId) {
        setError("ID do time não fornecido.");
        setLoading(false);
        return;
      }

      try {
        const playersRef = collection(db, "players"); // Nome da coleção
        const q = query(playersRef, where("teamId", "==", teamId)); // Filtra os jogadores do time

        const querySnapshot = await getDocs(q);
        const playersData = querySnapshot.docs.map((doc) => ({
          id: doc.id, // ID do documento
          ...doc.data(), // Dados do jogador
        })) as Player[];

        setPlayers(playersData);
      } catch (e) {
        setError("Erro ao carregar os jogadores.");
        console.error("Erro ao carregar os jogadores:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [teamId]);

  const handleDeletePlayer = async (playerId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este jogador?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const playerDocRef = doc(db, 'players', playerId);
              await deleteDoc(playerDocRef);
              const updatedPlayers = players.filter(player => player.id !== playerId);
              setPlayers(updatedPlayers);
              setLoading(false);
            } catch (error: any) {
              setError('Erro ao excluir o jogador.');
              console.error('Erro ao excluir o jogador:', error);
              setLoading(false);
              Alert.alert('Erro', 'Erro ao excluir o jogador: ' + error.message);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const toggleDropdown = (playerId: string) => {
    setSelectedPlayerId(selectedPlayerId === playerId ? null : playerId);
  };

  const renderItem = ({ item }: { item: Player }) => (
    <View style={styles.playerItemContainer}>
        <Link href={`/screens/editPlayerScreen?id=${item.id}`} asChild>
        <TouchableOpacity style={styles.playerItem}>
            <Text style={styles.playerNumber}>{item.number}</Text>
            <Text style={styles.playerName}>{item.fullName}</Text>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity style={styles.optionsButton} onPress={() => toggleDropdown(item.id)}>
        <Text style={styles.optionsDots}>...</Text>
      </TouchableOpacity>

        {selectedPlayerId === item.id && (
            <View style={styles.dropdown}>
                <Link href={`/screens/EditPlayerScreen?id=${item.id}`} asChild>
                <TouchableOpacity style={styles.dropdownItem}>
                    <Icon name="pencil" size={16} color="black" style={styles.dropdownIcon} />
                    <Text>Editar</Text>
                </TouchableOpacity>
                </Link>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDeletePlayer(item.id)}>
                    <Icon name="trash" size={16} color="red" style={styles.dropdownIcon} />
                    <Text style={{ color: 'red' }}>Excluir</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
  );

  if (loading) {
    return <Text>Carregando jogadores...</Text>;
  }

  if (error) {
    return <Text>Erro: {error}</Text>;
  }

  return (
    <TouchableWithoutFeedback onPress={() => setSelectedPlayerId(null)}>
      <View style={styles.container}>
        <Text style={styles.title}>Jogadores</Text>
        <FlatList
          data={players}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
        <Link href={`/screens/AddPlayerScreen?teamId=${teamId}`} asChild>
            <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
        </Link>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  playerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 5,
    justifyContent: 'space-between',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ocupa o espaço restante
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 30,
  },
  playerName: {
    fontSize: 16,
    flex: 1,
  },
  optionsButton: {
    padding: 8,
  },
  optionsDots: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
    marginTop: -12
  },
dropdown: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    right: 50,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  addButton: {
    backgroundColor: 'green',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 30,
  },
});

export default PlayersScreen;