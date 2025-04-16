import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import WheelColorPicker from 'react-native-wheel-color-picker';
import Modal from 'react-native-modal';

const EditTeamScreen = () => {
  const { id } = useLocalSearchParams();
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#ffffff');
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTeamData(id as string);
    } else {
      setError('ID do time não fornecido.');
    }
  }, [id]);

  const loadTeamData = async (teamId: string) => {
    setLoading(true);
    try {
      const teamDocRef = doc(db, 'teams', teamId);
      const docSnap = await getDoc(teamDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTeamName(data?.name || '');
        setTeamColor(data?.color || '#ffffff');
      } else {
        setError('Time não encontrado.');
      }
    } catch (e: any) {
      setError('Erro ao carregar os dados do time.');
      console.error('Erro ao carregar os dados do time:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Atenção', 'Por favor, digite o nome do time.');
      return;
    }
    if (!teamColor.trim()) {
      Alert.alert('Atenção', 'Por favor, selecione ou digite a cor do time.');
      return;
    }

    setLoading(true);
    try {
      if (id) {
        const teamDocRef = doc(db, 'teams', id);
        await updateDoc(teamDocRef, {
          name: teamName,
          color: teamColor,
        });
        Alert.alert('Sucesso', 'Time atualizado com sucesso!', [
          { text: 'OK', onPress: () => router.push('/screens/TeamsScreen') },
        ]);
      } else {
        Alert.alert('Erro', 'ID do time inválido para edição.');
      }
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao atualizar o time: ${error.message}`);
      console.error('Erro ao atualizar o time:', error);
    } finally {
      setLoading(false);
    }
  };

  const onColorChange = (color: string) => {
    setTeamColor(color);
  };

  const toggleColorPicker = () => {
    setIsColorPickerVisible(!isColorPickerVisible);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Editar Time</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (loading && id) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Editar Time</Text>
        <Text>Carregando dados do time...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Time</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do Time"
        value={teamName}
        onChangeText={text => setTeamName(text)}
      />
      <TouchableOpacity
        style={[styles.colorPreview, { backgroundColor: teamColor }]}
        onPress={toggleColorPicker}
      >
        <Text>Selecionar Cor</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Ou digite a cor (ex: #0000ff ou azul)"
        value={teamColor}
        onChangeText={text => setTeamColor(text)}
      />
      <Button
        title={loading ? 'Atualizando...' : 'Atualizar Time'}
        onPress={handleSaveTeam}
        disabled={loading || !id}
      />

      <Modal
        isVisible={isColorPickerVisible}
        onBackdropPress={toggleColorPicker}
      >
        <View style={styles.colorPickerModal}>
          <WheelColorPicker
            color={teamColor}
            onColorChange={onColorChange}
            thumbSize={30}
            sliderSize={20}
            swatches={false}
            discrete={true}
            discreteLength={6}
          />
          <Button title="Confirmar Cor" onPress={toggleColorPicker} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  colorPreview: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
});

export default EditTeamScreen;
