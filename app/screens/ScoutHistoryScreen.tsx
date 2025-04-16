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

interface Scout {
  id: string;
  // Adicione aqui os campos que um scout terá (ex: data, time adversário, etc.)
  date: string;
  opponentTeam: string;
  notes?: string;
}

const ScoutHistoryScreen = () => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Aqui você fará a lógica para buscar o histórico de scouts do seu banco de dados
    // Por enquanto, vamos usar dados de exemplo
    setTimeout(() => {
      setScouts([
        {
          id: '1',
          date: '2025-03-30',
          opponentTeam: 'Time Azul',
          notes: 'Bom jogo!',
        },
        {
          id: '2',
          date: '2025-03-28',
          opponentTeam: 'Time Vermelho',
          notes: 'Adversário forte.',
        },
        { id: '3', date: '2025-03-25', opponentTeam: 'Time Amarelo' },
      ]);
      setLoading(false);
    }, 1000); // Simula um carregamento de 1 segundo
  }, []);

  const renderItem = ({ item }: { item: Scout }) => (
    <TouchableOpacity
      style={styles.scoutItem}
      onPress={() => {
        // Navegar para a tela de detalhes do scout (ainda não criada)
        router.push(`/screens/ScoutDetailScreen?id=${item.id}`);
      }}
    >
      <View style={styles.scoutInfo}>
        <Text style={styles.scoutDate}>{item.date}</Text>
        <Text style={styles.scoutOpponent}>{item.opponentTeam}</Text>
        {item.notes && <Text style={styles.scoutNotes}>{item.notes}</Text>}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
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
  scoutDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoutOpponent: {
    fontSize: 14,
    color: '#333',
  },
  scoutNotes: {
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
