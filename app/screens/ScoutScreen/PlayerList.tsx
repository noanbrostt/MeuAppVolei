// ScoutScreen/PlayerList.tsx
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Player } from '../types';

interface PlayerListProps {
  players: Player[];
  selectedPlayerId: string | null;
  onPlayerClick: (player: Player) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
let playerHeight;

if (screenHeight > screenWidth) {
  playerHeight = (screenWidth - 78) / 7;
} else {
  playerHeight = (screenHeight - 78) / 7;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, selectedPlayerId, onPlayerClick }) => {
  const renderItem = ({ item, index }: { item: Player, index: number }) => {
    const isSelected = selectedPlayerId === item.id;
    const shouldBeOpaque = !selectedPlayerId || isSelected;
    const opacity = shouldBeOpaque ? 1 : 0.5;
    const isLastItem = index === players.length - 1;

    return (
      <TouchableOpacity
        style={[styles.playerItem, isSelected && styles.selectedPlayerItem, { opacity, marginBottom: isLastItem ? 0 : 5 }]}
        onPress={() => onPlayerClick(item)}
      >
        <Text numberOfLines={1} ellipsizeMode="tail">{item.surname} (#{item.number})</Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={players}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};

const styles = StyleSheet.create({
    playerItem: {
      backgroundColor: 'white',
      fontSize: 16,
      paddingInline: 10,
      borderRadius: 3,
      justifyContent: 'center',
      height: playerHeight, // Altura dinâmica
    },
    selectedPlayerItem: {
      backgroundColor: 'lightblue',
    },
  });

export default PlayerList;