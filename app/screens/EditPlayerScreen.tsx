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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';

const EditPlayerScreen = () => {
  const { teamId, playerId } = useLocalSearchParams();
  const [fullName, setFullName] = useState('');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positions = ['Central', 'Levantador', 'Líbero', 'Ponteiro', 'Oposto'];

  useEffect(() => {
    if (teamId && playerId) {
      loadPlayerData(teamId as string, playerId as string);
    } else {
      setError('ID do time ou do jogador não fornecido.');
    }
  }, [teamId, playerId]);

  const loadPlayerData = async (teamId: string, playerId: string) => {
    setLoading(true);
    try {
      const playerDocRef = doc(db, 'players', playerId);
      const docSnap = await getDoc(playerDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.teamId !== teamId) {
          setError('Jogador não encontrado neste time.');
        } else {
          setFullName(data?.fullName || '');
          setNumber(String(data?.number) || '');
          setPosition(data?.position || '');
          setRg(data?.rg || '');
          setCpf(data?.cpf || '');
          setAllergies(data?.allergies || '');
        }
      } else {
        setError('Jogador não encontrado.');
      }
    } catch (e: any) {
      setError('Erro ao carregar os dados do jogador.');
      console.error('Erro ao carregar os dados do jogador:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlayer = async () => {
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
      if (teamId && playerId) {
        const playerDocRef = doc(db, 'players', playerId);
        await updateDoc(playerDocRef, {
          fullName: fullName.trim(),
          number: parsedNumber,
          position: position,
          rg: rg.trim(),
          cpf: cpf.trim(),
          allergies: allergies.trim(),
          teamId: teamId, // Garante que o teamId não seja alterado
        });
        Alert.alert('Sucesso', 'Dados do jogador atualizados com sucesso!', [
          { text: 'OK', onPress: () => router.replace(`/screens/PlayersScreen?id=${teamId}`) },
        ]);
      } else {
        setError('ID do time ou do jogador não fornecido.');
        Alert.alert('Erro', 'Não foi possível identificar o jogador ou o time.');
      }
    } catch (e: any) {
      setError('Erro ao atualizar os dados do jogador.');
      console.error('Erro ao atualizar os dados do jogador:', e);
      Alert.alert('Erro', `Erro ao atualizar os dados do jogador: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Editar Jogador</Text>
        <Text>Carregando dados do jogador...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Editar Jogador</Text>
        <Text style={styles.error}>{error}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Editar Jogador</Text>

      <Text style={styles.label}>Nome Completo*</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome completo do jogador"
        value={fullName}
        onChangeText={setFullName}
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
          onValueChange={(itemValue) => setPosition(itemValue)}
        >
          <Picker.Item label="Selecione a Posição" value="" />
          {positions.map((pos) => (
            <Picker.Item key={pos} label={pos} value={pos} />
          ))}
        </Picker>
      </View>

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

      <Button
        title={loading ? 'Salvando...' : 'Salvar Alterações'}
        onPress={handleSavePlayer}
        disabled={loading}
      />
    </ScrollView>
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
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 16,
  },
  picker: {
    height: 40,
  },
});

export default EditPlayerScreen;