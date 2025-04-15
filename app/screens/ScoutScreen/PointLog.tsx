import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface PointLogProps {
  pointLog: {
    playerId?: string;
    surname?: string;
    action?: string;
    quality?: number;
  }[];
  selectedPlayers: {
    id: string;
    surname: string;
    number: number;
    position: string;
    teamId: string;
  }[];
}

const PointLog: React.FC<PointLogProps> = ({ pointLog, selectedPlayers }) => {
  const getQualityColor = (logEntry: { quality?: number; action?: string }) => {
    if (logEntry.quality === 0) return '#FF4D4D';
    if (logEntry.quality === 1) return '#FF9900';
    if (logEntry.quality === 2) return '#9ACD32';
    if (logEntry.quality === 3) return '#4CAF50';

    switch (logEntry.action) {
      case 'Erro Nosso':
      case 'Ponto Adversário':
        return '#FF4D4D';
      case 'Erro Adversário':
      case 'Ponto Nosso':
        return '#4CAF50';
      default:
        return 'black';
    }
  };

  const formatAction = (action?: string) => {
    if (!action) return '';
    const map: { [key: string]: string } = {
      Levantamento: 'Levant.',
      'Ponto Adversário': 'Ponto Adver.',
      'Erro Adversário': 'Erro Adver.',
    };
    return map[action] || action;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logTitle}>Log</Text>
      <ScrollView>
        {[...pointLog].reverse().map((logEntry, index) => {
          const qualityColor = getQualityColor(logEntry);
          let playerName = 'Desconhecido';

          if (logEntry.playerId) {
            playerName =
              selectedPlayers.find(p => p.id === logEntry.playerId)?.surname ||
              'Desconhecido';
          }

          return (
            <Text
              key={index}
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[styles.logEntryText, { backgroundColor: qualityColor }]}
            >
              {playerName === 'Desconhecido'
                ? formatAction(logEntry.action)
                : `${playerName} - ${formatAction(logEntry.action)}`}
            </Text>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '33%',
    paddingLeft: '3%',
    paddingRight: '3%',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  logEntryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    borderRadius: 5,
    padding: 5,
  },
});

export default PointLog;