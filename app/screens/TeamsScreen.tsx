import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';

interface Team {
  id: string;
  name: string;
  color: string;
}

const TeamsScreen = () => {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchTeams = async () => {
        try {
          setLoading(true);
          setError(null);

          const teamsCollection = collection(db, 'teams');
          const teamsQuery = query(teamsCollection, orderBy('name', 'asc'));
          const teamsSnapshot = await getDocs(teamsQuery);

          const teamsList = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Team[];

          setTeams(teamsList);
        } catch (e: any) {
          setError('Erro ao carregar as equipes.');
          console.error('Erro ao carregar as equipes:', e);
        } finally {
          setLoading(false);
        }
      };

      fetchTeams();
    }, []),
  );

  const handleDeleteTeam = async (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este time?',
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
              const teamDocRef = doc(db, 'teams', id);
              await deleteDoc(teamDocRef);
              const updatedTeams = teams.filter(team => team.id !== id);
              setTeams(updatedTeams);
              setLoading(false);
            } catch (error: any) {
              setError('Erro ao excluir o time.');
              console.error('Erro ao excluir o time:', error);
              setLoading(false);
              Alert.alert('Erro', 'Erro ao excluir o time: ' + error.message);
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  const toggleDropdown = (teamId: string) => {
    setSelectedTeamId(selectedTeamId === teamId ? null : teamId);
  };

  const renderItem = ({ item }: { item: Team }) => (
    <View style={styles.teamItemContainer}>
      <Link href={`/screens/PlayersScreen?id=${item.id}`} asChild>
        <TouchableOpacity style={styles.teamItem}>
          <View style={[styles.colorSquare, { backgroundColor: item.color }]} />
          <Text style={styles.teamName}>{item.name}</Text>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={() => toggleDropdown(item.id)}
      >
        <Text style={styles.optionsDots}>...</Text>
      </TouchableOpacity>
      {selectedTeamId === item.id && (
        <View style={styles.dropdown}>
          <Link href={`/screens/EditTeamScreen?id=${item.id}`} asChild>
            <TouchableOpacity style={styles.dropdownItem}>
              <Icon
                name="pencil"
                size={16}
                color="black"
                style={styles.dropdownIcon}
              />
              <Text>Editar</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleDeleteTeam(item.id)}
          >
            <Icon
              name="trash"
              size={16}
              color="red"
              style={styles.dropdownIcon}
            />
            <Text style={{ color: 'red' }}>Excluir</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return <Text>Carregando as equipes...</Text>;
  }

  if (error) {
    return <Text>Erro: {error}</Text>;
  }

  return (
    <TouchableWithoutFeedback onPress={() => setSelectedTeamId(null)}>
      <View style={styles.container}>
        {/* Botão de voltar */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Lista de Equipes</Text>
        <FlatList
          data={teams}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
        <Link href="/screens/AddTeamScreen" asChild>
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
    paddingTop: 20, // espaço para botão de voltar
  },
  backButton: {
    position: 'absolute',
    top: 18,
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'center',
  },
  teamItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 5,
    justifyContent: 'space-between',
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorSquare: {
    width: 20,
    height: 20,
    borderRadius: 3,
    marginRight: 10,
  },
  teamName: {
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
    marginTop: -12,
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

export default TeamsScreen;
