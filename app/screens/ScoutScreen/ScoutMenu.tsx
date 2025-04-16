import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { router } from 'expo-router';
import { db } from '../../../src/config/firebaseConfig';
import { collection, addDoc, doc } from 'firebase/firestore';

interface ScoutMenuProps {
  ourScore: number;
  opponentScore: number;
  pointLog: any[];
  teamId: string;
  scoutName: string;
  scoutDate: string;
  onClearPointLog: () => void;
  onResetScores: () => void;
  onSetHasUnsavedData: (value: boolean) => void;
}

const ScoutMenu: React.FC<ScoutMenuProps> = ({
  ourScore,
  opponentScore,
  pointLog,
  teamId,
  scoutName,
  scoutDate,
  onClearPointLog,
  onResetScores,
  onSetHasUnsavedData,
}) => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentSetNumber, setCurrentSetNumber] = useState<number>(1);

  const confirmSaveSet = () => {
    if (pointLog.length > 0) {      
      Alert.alert(
        'Salvar Set',
        'Deseja salvar este set?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salvar', onPress: handleSaveSet },
        ],
        { cancelable: true }
      );
    }
  };

  const handleSaveSet = async () => {
    onSetHasUnsavedData(false);

    try {
      let newGameId = gameId;

      if (!newGameId) {
        const gameDoc = await addDoc(collection(db, 'games'), {
          name: scoutName,
          date: scoutDate,
          teamId,
        });
        newGameId = gameDoc.id;
        setGameId(newGameId);
      }

      const setDocRef = await addDoc(
        collection(doc(db, 'games', newGameId), 'sets'),
        {
          setNumber: currentSetNumber,
          ourScore,
          opponentScore,
        }
      );

      const setId = setDocRef.id;

      for (const action of pointLog) {
        await addDoc(
          collection(doc(doc(db, 'games', newGameId), 'sets', setId), 'actions'),
          {
            action: action.action,
            playerId: action.playerId,
            quality: action.quality,
          }
        );
      }

      // Após salvar com sucesso, perguntar próximo passo
      Alert.alert(
        'Set Salvo!',
        `O set ${currentSetNumber} foi salvo com sucesso.`,
        [
          {
            text: 'Novo Set',
            onPress: () => {
              onResetScores();
              onClearPointLog();
              onSetHasUnsavedData(false);
              setCurrentSetNumber(prev => prev + 1);
            },
          },
          {
            text: 'Encerrar Jogo',
            style: 'destructive',
            onPress: () => {
              onSetHasUnsavedData(false);
              router.push('/screens/ScoutHistoryScreen'); // ou a rota que quiser
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('Erro ao salvar o set: ', error);
      Alert.alert('Erro', 'Não foi possível salvar o set.');
      onSetHasUnsavedData(true);
    }
  };

  return (
    <TouchableOpacity style={styles.iconButton} onPress={confirmSaveSet}>
      <Icon name="save" size={20} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
  },
});

export default ScoutMenu;
