import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Team {
  id: string;
  name: string;
}

interface Player {
  id: string;
  surname: string;
  number: number;
}

const ScoutAddScreen = () => {
  const [scoutName, setScoutName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [errorTeams, setErrorTeams] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [errorPlayers, setErrorPlayers] = useState<string | null>(null);

  const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });

  useEffect(() => {
    const fetchTeams = async () => {
      setLoadingTeams(true);
      setErrorTeams(null);
      try {
        const teamsCollection = collection(db, 'teams');
        const teamsQuery = query(teamsCollection, orderBy('name', 'asc'));
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsList = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[];
        setTeams(teamsList);
      } catch (error: any) {
        setErrorTeams('Erro ao carregar os times.');
        console.error('Erro ao carregar os times:', error);
        Alert.alert('Erro', 'Erro ao carregar os times.');
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchPlayers(selectedTeamId);
    } else {
      setPlayers([]);
      setSelectedPlayers([]);
    }
  }, [selectedTeamId]);

  const fetchPlayers = async (teamId: string) => {
    setLoadingPlayers(true);
    setErrorPlayers(null);
    try {
      // Referência à subcoleção 'players' do time selecionado
      const playersCollectionRef = collection(db, 'teams', teamId, 'players');
      const playersSnapshot = await getDocs(playersCollectionRef);
      const playersList = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Player, 'id'>),
      })) as Player[];
      playersList.sort((a, b) => a.surname.localeCompare(b.surname));
      setPlayers(playersList);
    } catch (error: any) {
      setErrorPlayers('Erro ao carregar os jogadores do time.');
      console.error('Erro ao carregar os jogadores do time:', error);
      Alert.alert('Erro', 'Erro ao carregar os jogadores do time.');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handlePlayerSelection = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else if (selectedPlayers.length < 7) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    } else {
      Alert.alert('Atenção', 'Você só pode selecionar 7 jogadores.');
    }
  };

  const handleContinue = () => {
    if (!scoutName.trim()) {
      Alert.alert('Atenção', 'Por favor, digite um nome para o scout.');
      return;
    }
    if (!selectedTeamId) {
      Alert.alert('Atenção', 'Por favor, selecione um time.');
      return;
    }
    if (selectedPlayers.length !== 7) {
      Alert.alert('Atenção', 'Por favor, selecione exatamente 7 jogadores.');
      return;
    }

    router.push(
      `/screens/ScoutScreen?teamId=${selectedTeamId}&scoutName=${scoutName}&scoutDate=${formattedDate}&players=${selectedPlayers.join(
        ',',
      )}`,
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Botão de voltar */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Icon name="chevron-left" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Novo Scout</Text>

      <Text style={styles.label}>Nome do Scout</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Final Campeonato, Amistoso..."
        value={scoutName}
        onChangeText={setScoutName}
      />

      <Text style={styles.label}>Data</Text>
      <TouchableOpacity
        style={styles.dateInputContainer}
        onPress={showDatepicker}
      >
        <TextInput
          style={styles.dateInput}
          value={formattedDate}
          editable={false}
        />
        <Icon
          name="calendar"
          size={20}
          color="#888"
          style={styles.calendarIcon}
        />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
          locale="pt-BR"
        />
      )}

      <Text style={styles.label}>Time*</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTeamId}
          style={styles.picker}
          onValueChange={itemValue => {
            if (itemValue !== null) {
              setSelectedTeamId(itemValue);
            }
          }}
        >
          {selectedTeamId === null && (
            <Picker.Item label="Selecione um Time" value={null} />
          )}

          {loadingTeams ? (
            <Picker.Item label="Carregando times..." value={null} />
          ) : errorTeams ? (
            <Picker.Item label="Erro ao carregar times" value={null} />
          ) : (
            teams.map(team => (
              <Picker.Item key={team.id} label={team.name} value={team.id} />
            ))
          )}
        </Picker>
      </View>
      {!selectedTeamId && (
        <Text style={styles.error}>Por favor, selecione um time.</Text>
      )}

      {selectedTeamId && (
        <View style={styles.playerSelectionContainer}>
          <Text style={styles.label}>Selecione 7 Jogadores*</Text>
          {loadingPlayers ? (
            <Text>Carregando jogadores...</Text>
          ) : errorPlayers ? (
            <Text style={styles.error}>{errorPlayers}</Text>
          ) : players.length > 0 ? (
            players.map(player => (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.playerItem,
                  selectedPlayers.includes(player.id) &&
                    styles.selectedPlayerItem,
                ]}
                onPress={() => handlePlayerSelection(player.id)}
              >
                <Text>
                  {player.surname} (#{player.number})
                </Text>
                {selectedPlayers.includes(player.id) && (
                  <Icon name="check-circle" size={20} color="green" />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text>Nenhum jogador encontrado para este time.</Text>
          )}
          {selectedPlayers.length !== 7 && selectedTeamId && (
            <Text style={styles.error}>
              Selecione {7 - selectedPlayers.length} jogadores.
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        disabled={selectedTeamId && selectedPlayers.length !== 7}
      >
        <Text style={styles.continueButtonText}>Continuar</Text>
        <Icon
          name="arrow-right"
          size={20}
          color="white"
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>
    </ScrollView>
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
    top: -2,
    left: 0,
    zIndex: 1,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    alignSelf: 'center',
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
    height: 56,
    justifyContent: 'center',
  },
  picker: {
    height: '100%',
    fontSize: 16,
    borderRadius: 8,
    color: '#000',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  dateInput: {
    flex: 1,
    height: 40,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: 'blue',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 24,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  playerSelectionContainer: {
    marginTop: 20,
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginBottom: 5,
    backgroundColor: '#f9f9f9',
  },
  selectedPlayerItem: {
    backgroundColor: '#e0f7fa',
  },
});

export default ScoutAddScreen;
