import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddPlayerScreen = () => {
  const { teamId: teamId } = useLocalSearchParams();
  const [fullName, setFullName] = useState('');
  const [surname, setSurname] = useState('');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState('');
  const [birthday, setBirthday] = useState('');
  const [tempBirthday, setTempBirthday] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positions = ['Central', 'Levantador', 'Líbero', 'Ponteiro', 'Oposto'];

  useEffect(() => {
    setTempBirthday(birthday);
    if (birthday) {
      const [day, month, year] = birthday.split('/');
      const dateObject = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      if (!isNaN(dateObject.getTime())) {
        setDatePickerValue(dateObject);
      } else {
        setDatePickerValue(new Date());
      }
    } else {
      setDatePickerValue(new Date());
    }
  }, [birthday]);

  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('pt-BR');
      setBirthday(formattedDate);
      setTempBirthday(formattedDate);
      setDatePickerValue(selectedDate);
    } else {
      setBirthday(tempBirthday);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleAddPlayer = async () => {
    if (!fullName.trim()) {
      Alert.alert('Atenção', 'Por favor, digite o nome completo do jogador.');
      return;
    }
    if (!number.trim()) {
      Alert.alert('Atenção', 'Por favor, digite o número do jogador.');
      return;
    }
    const parsedNumber = parseInt(number, 10);
    if (isNaN(parsedNumber)) {
      Alert.alert('Atenção', 'O número do jogador deve ser um valor numérico.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (teamId) {
        const playersCollection = collection(db, 'players');
        await addDoc(playersCollection, {
          fullName: fullName.trim(),
          surname: surname !== '' ? surname.trim() : fullName.split(' ')[0],
          number: parsedNumber,
          position: position,
          birthday: birthday,
          rg: rg.trim(),
          cpf: cpf.trim(),
          allergies: allergies.trim(),
          teamId: teamId,
        });
        Alert.alert('Sucesso', 'Jogador adicionado com sucesso!', [
          {
            text: 'OK',
            onPress: () =>
              router.replace(`/screens/PlayersScreen?id=${teamId}`),
          },
        ]);
        setFullName('');
        setNumber('');
        setPosition('');
        setBirthday('');
        setTempBirthday('');
        setDatePickerValue(new Date());
        setRg('');
        setCpf('');
        setAllergies('');
      } else {
        setError('ID do time não fornecido.');
        Alert.alert('Erro', 'Não foi possível identificar o time.');
      }
    } catch (e: any) {
      setError('Erro ao adicionar o jogador.');
      console.error('Erro ao adicionar o jogador:', e);
      Alert.alert('Erro', `Erro ao adicionar o jogador: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Adicionar Jogador</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>Nome Completo*</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome completo do jogador"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.label}>Apelido (Opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome curto para o jogador"
        value={surname}
        onChangeText={setSurname}
      />

      <Text style={styles.label}>Número*</Text>
      <TextInput
        style={styles.input}
        placeholder="Número do jogador"
        value={number}
        onChangeText={setNumber}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Posição (Opcional)</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={position}
          style={styles.picker}
          onValueChange={itemValue => {
            if (itemValue !== null) {
              setPosition(itemValue);
            }
          }}
        >
          {position === '' && (
            <Picker.Item label="Selecione a Posição" value={null} />
          )}
          {positions.map(pos => (
            <Picker.Item key={pos} label={pos} value={pos} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Data de Nascimento</Text>
      <TouchableOpacity
        style={styles.dateInputContainer}
        onPress={showDatepicker}
      >
        <TextInput
          style={styles.dateInput}
          value={birthday}
          placeholder="DD/MM/AAAA"
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
          value={datePickerValue}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
          locale="pt-BR"
        />
      )}

      <Text style={styles.label}>RG (Opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="RG do jogador"
        value={rg}
        onChangeText={setRg}
        keyboardType="numeric"
      />

      <Text style={styles.label}>CPF (Opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="CPF do jogador"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Alergias (Opcional)</Text>
      <TextInput
        style={styles.inputMultiline}
        placeholder="Alergias do jogador (texto livre)"
        value={allergies}
        onChangeText={setAllergies}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={handleAddPlayer}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Adicionando...' : 'Adicionar Jogador'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  error: {
    color: 'red',
    marginBottom: 16,
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
  inputMultiline: {
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 5,
    textAlignVertical: 'top',
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
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 6,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddPlayerScreen;