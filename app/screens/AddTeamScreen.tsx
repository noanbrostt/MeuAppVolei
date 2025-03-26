import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import WheelColorPicker from 'react-native-wheel-color-picker';
import Modal from 'react-native-modal';

const AddTeamScreen = () => {
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#ffffff');
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const teamsCollection = collection(db, 'teams');
      await addDoc(teamsCollection, {
        name: teamName,
        color: teamColor,
      });
      setLoading(false);
      Alert.alert('Sucesso', 'Time adicionado com sucesso!', [
        { text: 'OK', onPress: () => router.push('/screens/TeamsScreen') },
      ]);
      setTeamName('');
      setTeamColor('#ffffff');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Erro', 'Erro ao adicionar o time: ' + error.message);
      console.error('Erro ao adicionar o time:', error);
    }
  };

  const onColorChange = (color: string) => {
    setTeamColor(color);
  };

  const toggleColorPicker = () => {
    setIsColorPickerVisible(!isColorPickerVisible);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Nova Equipe</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do Time"
        value={teamName}
        onChangeText={text => setTeamName(text)}
      />
      <TouchableOpacity style={[styles.colorPreview, { backgroundColor: teamColor }]} onPress={toggleColorPicker}>
        <Text>Selecionar Cor</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Ou digite a cor (ex: #0000ff ou azul)"
        value={teamColor}
        onChangeText={text => setTeamColor(text)}
      />
      <Button
        title={loading ? 'Salvando...' : 'Salvar Time'}
        onPress={handleSaveTeam}
        disabled={loading}
      />

      <Modal isVisible={isColorPickerVisible} onBackdropPress={toggleColorPicker}>
        <View style={styles.colorPickerModal}>
          <WheelColorPicker
            color={teamColor}
            onColorChange={onColorChange}
            thumbSize={30}
            sliderSize={20}
            // gapSize={10}
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

export default AddTeamScreen;