// ScoutScreen/ScoreButtons.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ScoreButtonsProps {
  onScoreButtonClick: (isOurPoint: boolean, action: string) => void;
}

const ScoreButtons: React.FC<ScoreButtonsProps> = ({ onScoreButtonClick }) => (
  <View style={styles.scoreButtonsContainer}>
    <View style={styles.scoreButtonsRow}>
      <TouchableOpacity
        style={styles.scoreButton}
        onPress={() => onScoreButtonClick(false, 'Ponto Adversário')}
      >
        <Text style={styles.scoreButtonText}>Ponto Adversário</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.scoreButton}
        onPress={() => onScoreButtonClick(true, 'Erro Adversário')}
      >
        <Text style={styles.scoreButtonText}>Erro Adversário</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  scoreButtonsContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scoreButtonsRow: {
    flexDirection: 'row',
    textAlign: 'center',
  },
  scoreButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  scoreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    width: 100,
    textAlign: 'center',
  },
});

export default ScoreButtons;
