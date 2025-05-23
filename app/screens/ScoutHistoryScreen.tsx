import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../src/config/firebaseConfig';
import { Timestamp } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

interface Scout {
  id: string;
  name: string;
  date: string;
  teamName: string;
  savedAt: Timestamp;
}

const ScoutHistoryScreen = () => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchScouts = async () => {
        try {
          setLoading(true);
          setError(null);

          // Buscar times e montar dicionário
          const teamsSnapshot = await getDocs(collection(db, 'teams'));
          const teamsMap: Record<string, string> = {};
          teamsSnapshot.forEach(doc => {
            teamsMap[doc.id] = doc.data().name;
          });

          // Buscar scouts (jogos)
          const gamesCollection = collection(db, 'games');
          const gamesQuery = query(gamesCollection, orderBy('savedAt', 'desc'));
          const gamesSnapshot = await getDocs(gamesQuery);

          const scoutData: Scout[] = gamesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              date: data.date,
              teamName: teamsMap[data.teamId] || 'Time desconhecido',
              savedAt: data.savedAt,
            };
          });

          setScouts(scoutData);
        } catch (err) {
          console.error('Erro ao buscar scouts:', err);
          setError('Erro ao carregar os dados');
        } finally {
          setLoading(false);
        }
      };

      fetchScouts();
    }, []),
  );

  const renderItem = ({ item }: { item: Scout }) => (
    <TouchableOpacity
      style={styles.scoutItem}
      onPress={() => {
        router.push({
          pathname: '/screens/ScoutDetailScreen',
          params: {
            gameId: item.id,
            scoutName: item.name,
            teamName: item.teamName,
            scoutDate: item.date,
          },
        });
      }}
    >
      <View style={styles.scoutInfo}>
        <Text style={styles.scoutNotes}>Scout: {item.name}</Text>
        <Text style={styles.scoutTeam}>{item.teamName}</Text>
        <Text style={styles.scoutDate}>{item.date}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#888" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando histórico de scouts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Erro ao carregar o histórico de scouts: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botão de voltar */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Icon name="chevron-left" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Histórico de Scouts</Text>

      {scouts.length === 0 ? (
        <Text style={styles.emptyMessage}>Nenhum scout realizado ainda.</Text>
      ) : (
        <FlatList
          data={scouts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/screens/ScoutAddScreen')}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
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
    top: 18,
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'center',
  },
  scoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 5,
    justifyContent: 'space-between',
  },
  scoutInfo: {
    flex: 1,
  },
  scoutNotes: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoutTeam: {
    fontSize: 14,
    color: '#333',
  },
  scoutDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  emptyMessage: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: 'green',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    right: 20,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 30,
  },
});

export default ScoutHistoryScreen;
