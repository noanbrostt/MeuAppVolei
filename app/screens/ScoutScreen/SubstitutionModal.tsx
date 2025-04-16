import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  SafeAreaView,
} from 'react-native';

interface SubstitutionModalProps {
  visible: boolean;
  selectedPlayers: { id: string; surname: string; number: number }[];
  allTeamPlayers: { id: string; surname: string; number: number }[];
  substituteOutPlayerId: string | null;
  onSelectPlayerToRemove: (playerId: string) => void;
  onPerformSubstitution: (playerInId: string) => void;
  onClose: () => void;
  loadingAllPlayers: boolean;
  error: string | null;
}

const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  visible,
  selectedPlayers,
  allTeamPlayers,
  substituteOutPlayerId,
  onSelectPlayerToRemove,
  onPerformSubstitution,
  onClose,
  loadingAllPlayers,
  error,
}) => {
  if (!visible) return null;

  const selectedPlayerOut = selectedPlayers.find(
    p => p.id === substituteOutPlayerId,
  );
  const filteredPlayers = selectedPlayerOut
    ? [selectedPlayerOut]
    : selectedPlayers;

  return (
    <View style={styles.substitutionModal}>
      <SafeAreaView style={styles.modalContent}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Sticky Header */}
          <View style={styles.stickyHeader}>
            <Text style={styles.modalTitle}>Substituição</Text>
            <Text style={styles.modalSubtitle}>Jogador saindo:</Text>
            {selectedPlayerOut && (
              <TouchableOpacity
                style={[styles.modalPlayerItem, styles.modalPlayerItemSelected]}
                onPress={() => onSelectPlayerToRemove(substituteOutPlayerId)} // desfaz seleção
              >
                <Text>
                  {selectedPlayerOut.surname} (#{selectedPlayerOut.number})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de jogadores (caso nenhum selecionado ainda) */}
          {!selectedPlayerOut && (
            <FlatList
              data={filteredPlayers}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalPlayerItem,
                    substituteOutPlayerId === item.id &&
                      styles.modalPlayerItemSelected,
                  ]}
                  onPress={() =>
                    onSelectPlayerToRemove(
                      substituteOutPlayerId === item.id ? null : item.id,
                    )
                  }
                >
                  <Text>
                    {item.surname} (#{item.number})
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Se já selecionou alguém pra sair, mostra a lista de suplentes */}
          {substituteOutPlayerId && (
            <View>
              <Text style={styles.modalSubtitle}>Jogador entrando:</Text>
              {loadingAllPlayers ? (
                <Text>Carregando suplentes...</Text>
              ) : error ? (
                <Text style={styles.error}>{error}</Text>
              ) : allTeamPlayers.length > 0 ? (
                <FlatList
                  data={allTeamPlayers}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalPlayerItem}
                      onPress={() => onPerformSubstitution(item.id)}
                    >
                      <Text>
                        {item.surname} (#{item.number})
                      </Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              ) : (
                <Text>Não há suplentes disponíveis.</Text>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Fechar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  substitutionModal: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    position: 'absolute',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    width: '70%',
    maxHeight: '90%', // garante que não ultrapasse a tela
    alignSelf: 'center',
  },
  stickyHeader: {
    backgroundColor: 'white', // importante pra não ficar transparente ao rolar
    position: 'sticky', // iOS só reconhece 'sticky' no web. No RN:
    top: 0,
    zIndex: 10,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  modalPlayerItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 5,
    borderRadius: 3,
  },
  modalPlayerItemSelected: {
    backgroundColor: 'lightblue',
  },
  modalCloseButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default SubstitutionModal;
