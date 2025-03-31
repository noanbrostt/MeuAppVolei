import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Team {
  id: string;
  name: string;
}

const ScoutAddScreen = () => {
  const [scoutName, setScoutName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [errorTeams, setErrorTeams] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });

  useEffect(() => {
    const fetchTeams = async () => {
      setLoadingTeams(true);
      setErrorTeams(null);
      try {
        const teamsCollection = collection(db, 'teams');
        const teamsSnapshot = await getDocs(teamsCollection);
        const teamsList = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Team, 'id'>),
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

  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
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

    router.push(`/screens/SelectPlayersScreen?teamId=${selectedTeamId}&scoutName=${scoutName}&scoutDate=${formattedDate}`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Icon name="arrow-left" size={20} color="black" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Novo Scout</Text>

      <Text style={styles.label}>Nome do Scout</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Final Campeonato, Amistoso..."
        value={scoutName}
        onChangeText={setScoutName}
      />

      <Text style={styles.label}>Time*</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTeamId}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedTeamId(itemValue)}
        >
          <Picker.Item label="Selecione um Time" value={null} />
          {loadingTeams ? (
            <Picker.Item label="Carregando times..." value={null} />
          ) : errorTeams ? (
            <Picker.Item label="Erro ao carregar times" value={null} />
          ) : (
            teams.map((team) => (
              <Picker.Item key={team.id} label={team.name} value={team.id} />
            ))
          )}
        </Picker>
      </View>
      {!selectedTeamId && <Text style={styles.error}>Por favor, selecione um time.</Text>}

      <Text style={styles.label}>Data</Text>
      <TouchableOpacity style={styles.dateInputContainer} onPress={showDatepicker}>
        <TextInput
          style={styles.dateInput}
          value={formattedDate}
          editable={false}
        />
        <Icon name="calendar" size={20} color="#888" style={styles.calendarIcon} />
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

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continuar</Text>
        <Icon name="arrow-right" size={20} color="white" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>
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
    marginBottom: 24,
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
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 8,
  },
  picker: {
    height: 40,
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
    marginTop: 24,
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
});

export default ScoutAddScreen;