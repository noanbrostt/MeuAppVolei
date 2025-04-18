import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../src/config/firebaseConfig';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import RadarChart from './RadarChart';
import EfficiencyBarChart from './EfficiencyBarChart';
import ActionTable from './ActionTable'; // Importe o novo componente

const screenWidth = Dimensions.get('window').width;

interface Action {
  action: string;
  quality: number;
  setId: string;
  playerId: string;
  playerSurname: string;
}

const ScoutDetailScreen = () => {
  const { gameId, scoutName, scoutDate } = useLocalSearchParams<{
    gameId: string;
    scoutName: string;
    scoutDate?: string;
  }>();
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

        const uniqueSets = Array.from(
          new Set(fetched.map(a => a.setId)),
        ).sort();
        uniqueSets.unshift('Jogo Inteiro');

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
      (selectedSet === 'Jogo Inteiro' || a.setId === selectedSet),
  );

  const actionSummary = filtered.reduce<Record<string, number>>((acc, cur) => {
    acc[cur.action] = (acc[cur.action] || 0) + 1;
    return acc;
  }, {});

  const fundamentals = [
    'Passe',
    'Defesa',
    'Bloqueio',
    'Ataque',
    'Saque',
    'Levantamento',
  ];
  const qualities = [3, 2, 1, 0];

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
      const count1 = items.filter(i => i.quality === 1).length;
      const count2 = items.filter(i => i.quality === 2).length;
      const count3 = items.filter(i => i.quality === 3).length;
      return [action, { 0: count0, 1: count1, 2: count2, 3: count3 }];
    }),
  );

  const detectarJogadas = () => {
    const ataques = [];
    const contraAtaques = [];

    for (let i = 0; i < filtered.length; i++) {
      const atual = filtered[i];
      const segundo = filtered[i + 1];
      const terceiro = filtered[i + 2];

      const verificarAtaque = (a1, a2, a3) => {
        if (!a1 || (a1.action !== 'Passe' && a1.action !== 'Defesa'))
          return null;

        const acoesSeguintes = [a2, a3].filter(Boolean).map(a => a.action);

        const temAtaqueSimples = acoesSeguintes.includes('Ataque');
        const temLevantEAtk =
          acoesSeguintes.includes('Levantamento') &&
          acoesSeguintes.includes('Ataque');

        if (a1.action === 'Passe' && (temAtaqueSimples || temLevantEAtk)) {
          return 'Atk';
        }

        if (a1.action === 'Defesa' && (temAtaqueSimples || temLevantEAtk)) {
          return 'C. Atk.';
        }

        return null;
      };

      const tipo = verificarAtaque(atual, segundo, terceiro);
      if (tipo === 'Atk') ataques.push(atual);
      if (tipo === 'C. Atk.') contraAtaques.push(atual);
    }

    return { ataques, contraAtaques };
  };

  const { ataques, contraAtaques } = detectarJogadas();

  const tableData = {
    header: ['', ...qualities, 'Total'],
    data: [
      ...fundamentals.map(fundamento => {
        const actionsByFundamento = filtered.filter(
          a => a.action === fundamento,
        );
        const totalActions = actionsByFundamento.length;

        return [
          fundamento === 'Levantamento'
            ? 'Levant.'
            : fundamento === 'Bloqueio'
            ? 'Bloq.'
            : fundamento,
          ...qualities.map(quality => {
            const count = actionsByFundamento.filter(
              a => a.quality === quality,
            ).length;
            const percentage =
              totalActions > 0
                ? ((count / totalActions) * 100).toFixed(1) + '%'
                : '0%';
            return (
              <View style={styles.tableCell}>
                <Text style={styles.tableCount}>{count}</Text>
                <Text style={styles.tablePercentage}>{percentage}</Text>
              </View>
            );
          }),
          <Text style={styles.tableCount}>{totalActions}</Text>,
        ];
      }),

      // Linha de Ataque
      [
        <Text style={[styles.specialLabel, { color: '#004fa3' }]}>Atk.</Text>,
        ...qualities.map(quality => {
          const count = ataques.filter(a => a.quality === quality).length;
          const total = ataques.length;
          const percentage =
            total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
          return (
            <View style={styles.tableCell}>
              <Text style={styles.tableCount}>{count}</Text>
              <Text style={styles.tablePercentage}>{percentage}</Text>
            </View>
          );
        }),
        <Text style={styles.tableCount}>{ataques.length}</Text>,
      ],

      // Linha de Contra Ataque
      [
        <Text style={[styles.specialLabel, { color: '#004fa3' }]}>
          C. Atk.
        </Text>,
        ...qualities.map(quality => {
          const count = contraAtaques.filter(a => a.quality === quality).length;
          const total = contraAtaques.length;
          const percentage =
            total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
          return (
            <View style={styles.tableCell}>
              <Text style={styles.tableCount}>{count}</Text>
              <Text style={styles.tablePercentage}>{percentage}</Text>
            </View>
          );
        }),
        <Text style={styles.tableCount}>{contraAtaques.length}</Text>,
      ],
    ],
    opponent: {
      errosAdversario: filtered.filter(
        a => a.playerId === 'generic' && a.action === 'Erro Adversário',
      ).length,
      pontosAdversario: filtered.filter(
        a => a.playerId === 'generic' && a.action === 'Ponto Adversário',
      ).length,
    },
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#666" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Botão de voltar */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Icon name="chevron-left" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>
        {scoutName}
        {'\n'}
        {scoutDate}
      </Text>

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
          <ActionTable data={tableData} />
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
    paddingTop: 20, // espaço para botão de voltar
  },
  backButton: {
    position: 'absolute',
    top: -2,
    left: 0,
    zIndex: 1,
    padding: 8,
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
    width: '45%',
    gap: 6,
  },
  picker: {
    width: '100%',
    fontSize: 16,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: -10,
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
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCount: {
    textAlign: 'center',
    fontSize: 16,
  },
  tablePercentage: {
    textAlign: 'center',
    fontSize: 12,
    color: 'gray',
  },
  specialLabel: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ScoutDetailScreen;
