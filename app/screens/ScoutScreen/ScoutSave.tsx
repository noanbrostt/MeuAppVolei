import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { router } from 'expo-router';
import { db } from '../../../src/config/firebaseConfig';
import { collection, addDoc, doc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

interface ScoutSaveProps {
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

const ScoutSave: React.FC<ScoutSaveProps> = ({
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
          savedAt: serverTimestamp(),
        });
        newGameId = gameDoc.id;
        setGameId(newGameId);
      }

      // Salva todas as ações diretamente em /games/{gameId}/actions
      for (const action of pointLog) {
        console.log("Action a ser salvo:", action);
        console.log("PointLog a ser salvo:", pointLog);

        await addDoc(collection(doc(db, 'games', newGameId), 'actions'), {
          action: action.action,
          playerId: action.playerId,
          playerSurname: action.surname || 'Desconhecido', // importante para filtros e gráficos
          quality: action.quality,
          setId: `${currentSetNumber}º Set`, // usado para filtragem futura
        });
      }

      // Após salvar com sucesso, perguntar próximo passo
      Alert.alert(
        'Set Salvo!',
        `O ${currentSetNumber}º set foi salvo com sucesso.`,
        [
          {
            text: 'Novo Set',
            onPress: () => {
              onResetScores();
              onClearPointLog();
              setCurrentSetNumber(prev => prev + 1);
              onSetHasUnsavedData(false);
            },
          },
          {
            text: 'Encerrar Jogo',
            style: 'destructive',
            onPress: () => {
              onSetHasUnsavedData(false);
              router.push('/screens/ScoutHistoryScreen');
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

export default ScoutSave;
