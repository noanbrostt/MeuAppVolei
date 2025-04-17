import React, { act, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../src/config/firebaseConfig';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import RadarChart from './RadarChart';
import EfficiencyBarChart from './EfficiencyBarChart';

const screenWidth = Dimensions.get('window').width;

interface Action {
  action: string;
  quality: number;
  setId: string;
  playerId: string;
  playerSurname: string;
}

const ScoutDetailScreen = () => {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const [actions, setActions] = useState<Action[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [sets, setSets] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const actionsRef = collection(db, 'games', gameId, 'actions');
        const querySnapshot = await getDocs(actionsRef);
        const fetched: Action[] = [];
        querySnapshot.forEach(doc => fetched.push(doc.data() as Action));
        setActions(fetched);

        const uniquePlayers = Array.from(
          new Set(
            fetched
              .filter(action => action.playerSurname !== 'Desconhecido')
              .map(a => a.playerSurname),
          ),
        ).sort();
        uniquePlayers.unshift('Time Todo');

        const uniqueSets = Array.from(new Set(fetched.map(a => a.setId))).sort();
        uniqueSets.unshift('Jogo inteiro');

        setPlayers(uniquePlayers);
        setSets(uniqueSets);
        setSelectedPlayer(uniquePlayers[0] ?? null);
        setSelectedSet(uniqueSets[0] ?? null);
      } catch (err) {
        console.error('Erro ao buscar ações:', err);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchActions();
  }, [gameId]);

  const filtered = actions.filter(
    a =>
      (selectedPlayer === 'Time Todo' || a.playerSurname === selectedPlayer) &&
      (selectedSet === 'Jogo inteiro' || a.setId === selectedSet),
  );

  const actionSummary = filtered.reduce<Record<string, number>>((acc, cur) => {
    acc[cur.action] = (acc[cur.action] || 0) + 1;
    return acc;
  }, {});

  const fundamentals = ['Passe', 'Defesa', 'Bloqueio', 'Ataque', 'Saque', 'Levantamento'];

  const radarData = Object.fromEntries(
    fundamentals.map(action => {
      const items = filtered.filter(f => f.action === action);
      if (items.length === 0) return [action, 0.04141];
      const count2 = items.filter(i => i.quality === 2).length;
      const count3 = items.filter(i => i.quality === 3).length;
      let efficiency = (count2 + count3) / items.length;
      return [action, efficiency];
    }),
  );

  const barData = Object.fromEntries(
    fundamentals.map(action => {
      const items = filtered.filter(f => f.action === action);
      if (items.length === 0) return [action, 0.04141];
      const count0 = items.filter(i => i.quality === 0).length;
      const count3 = items.filter(i => i.quality === 3).length;
      return [action, { 0: count0, 3: count3 }];
    }),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#666" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Relatório do Scout</Text>

      <View style={styles.pickerContainer}>
        <View style={styles.pickerFieldSet}>
          <Text style={styles.label}>Atleta:</Text>
          <Picker
            selectedValue={selectedPlayer}
            onValueChange={value => setSelectedPlayer(value)}
            style={styles.picker}
          >
            {players.map(player => (
              <Picker.Item key={player} label={player} value={player} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerFieldSet}>
          <Text style={styles.label}>Set:</Text>
          <Picker
            selectedValue={selectedSet}
            onValueChange={value => setSelectedSet(value)}
            style={styles.picker}
          >
            {sets.map(setId => (
              <Picker.Item key={setId} label={`${setId}`} value={setId} />
            ))}
          </Picker>
        </View>
      </View>

      {filtered.length > 0 ? (
        <>
          <RadarChart data={radarData} />
          <EfficiencyBarChart
            data={barData}
            barColors={{
              positive: '#FF9800',
              negative: '#F44336',
              neutral: '#BDBDBD',
            }}
          />
        </>
      ) : (
        <Text style={styles.noData}>Nenhuma ação para esse filtro.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 26,
  },
  pickerFieldSet: {
    display: 'flex',
    flexDirection: 'row',
    width: '45%',
    gap: 6,
  },
  picker: {
    width: '100%',
    fontSize: 16,
    borderRadius: 5,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  graphTitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  chart: {
    borderRadius: 8,
    alignSelf: 'center',
  },
  noData: {
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
});

export default ScoutDetailScreen;