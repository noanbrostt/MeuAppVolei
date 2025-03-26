import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { db } from '../../src/config/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface Team {
  id: string;
  name: string;
  color: string;
}

const TeamsScreen = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsCollection = collection(db, 'teams');
        const teamsSnapshot = await getDocs(teamsCollection);
        const teamsList = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[];
        setTeams(teamsList);
        setLoading(false);
      } catch (e: any) {
        setError('Erro ao carregar as equipes.');
        console.error('Erro ao carregar as equipes:', e);
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return <Text>Carregando as equipes...</Text>;
  }

  if (error) {
    return <Text>Erro: {error}</Text>;
  }

  const renderItem = ({ item }: { item: Team }) => (
    <Link href={`/screens/EditTeamScreen?id=${item.id}`} asChild>
      <TouchableOpacity style={styles.teamItem}>
        <View style={[styles.colorSquare, { backgroundColor: item.color }]} />
        <Text style={styles.teamName}>{item.name}</Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Equipes</Text>
      <FlatList
        data={teams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      <Link href="/screens/AddTeamScreen" asChild>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </Link>
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
  teamItem: {
    flexDirection: 'row', // Alinha a cor e o nome horizontalmente
    alignItems: 'center', // Alinha verticalmente no centro
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 8,
    borderRadius: 5,
  },
  colorSquare: {
    width: 20,
    height: 20,
    borderRadius: 3,
    marginRight: 10, // Espaço entre o quadrado e o nome
  },
  teamName: {
    fontSize: 16,
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
  },
  addButtonText: {
    color: 'white',
    fontSize: 30,
  },
});

export default TeamsScreen;