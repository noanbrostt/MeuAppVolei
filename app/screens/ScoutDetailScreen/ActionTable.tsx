import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Table, Row, Rows } from 'react-native-table-component';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';

interface ActionTableProps {
  data: {
    header: string[];
    data: (string | JSX.Element)[][];
    opponent: {
      errosAdversario: number;
      pontosAdversario: number;
    };
  };
}

const ActionTable: React.FC<ActionTableProps> = ({ data }) => {
  const [isModalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.cardContainer}>
      {/* Título com ícone */}
      <View>
        <Pressable onPress={() => setModalVisible(true)} style={styles.header}>
          <Text style={styles.title}>Detalhado</Text>
          <Ionicons
            name="help-circle-outline"
            size={18}
            color="#666"
            style={{ marginBottom: -2 }}
          />
        </Pressable>
      </View>

      <View>
        <Table borderStyle={styles.tableBorder}>
          <Row
            data={data.header}
            style={styles.tableHeader}
            textStyle={styles.tableHeaderText}
          />
          <Rows
            data={data.data}
            style={styles.tableRow}
            textStyle={styles.tableText}
          />
        </Table>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 24,
          }}
        >
          <Text>
            Pontos Adversário: {data.opponent.pontosAdversario}
          </Text>
          <Text>
            Erros Adversário: {data.opponent.errosAdversario}
          </Text>
        </View>
      </View>

      {/* Modal explicativa */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            O que significam as linhas azuis?
          </Text>
          <Text style={styles.modalText}>
            Atk. = Ataque (ataque que veio depois de um passe).
            <br></br>
            C. Atk. = Contra Ataque (ataque que veio depois de uma defesa).
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>Entendi</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: '#c1c8e0',
  },
  tableHeader: {
    height: 40,
    backgroundColor: '#e7e7e7',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    minHeight: 60, // Ajustei para minHeight para melhor visualização do conteúdo
  },
  tableText: {
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#004fa3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ActionTable;
