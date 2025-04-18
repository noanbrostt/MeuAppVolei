import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';

const actions = [
  'Passe',
  'Defesa',
  'Bloqueio',
  'Ataque',
  'Saque',
  'Levantamento',
];
const radius = 80;
const size = radius * 2 + 50;
const center = size / 2;
const levels = 4;

type Props = {
  data: { [key: string]: number }; // valores entre 0 e 1 (eficiência)
};

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
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
  header: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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

export default function RadarChart({ data }: Props) {
  const [isModalVisible, setModalVisible] = useState(false);
  const angleSlice = (2 * Math.PI) / actions.length;

  const scaleValue = (val: number) => val * radius;

  const getPoint = (angle: number, value: number) => {
    const scaled = scaleValue(value);
    const x = center + scaled * Math.sin(angle);
    const y = center - scaled * Math.cos(angle);
    return `${x},${y}`;
  };

  const getAxisPoint = (angle: number, dist: number) => {
    const x = center + dist * Math.sin(angle);
    const y = center - dist * Math.cos(angle);
    return { x, y };
  };

  const polygonPoints = actions
    .map((action, i) => {
      const angle = i * angleSlice;
      const value = data[action] ?? 0;
      return getPoint(angle, value);
    })
    .join(' ');

  return (
    <View style={styles.cardContainer}>
      {/* Título com ícone */}
      <View>
        <Pressable onPress={() => setModalVisible(true)} style={styles.header}>
          <Text style={styles.title}>Positividade</Text>
          <Ionicons
            name="help-circle-outline"
            size={18}
            color="#666"
            style={{ marginBottom: -2 }}
          />
        </Pressable>
      </View>

      <Svg width={size} height={size}>
        {/* Camadas da teia */}
        {[...Array(levels + 1)].map((_, level) => {
          const r = (radius / levels) * level;
          const points = actions
            .map((_, i) => {
              const angle = i * angleSlice;
              const { x, y } = getAxisPoint(angle, r);
              return `${x},${y}`;
            })
            .join(' ');

          const legendValue = level * 25;
          return (
            <React.Fragment key={level}>
              <Polygon points={points} stroke="#ccc" fill="none" />
              {level > 0 && (
                <SvgText
                  x={center}
                  y={center - r}
                  fontSize="8"
                  fill="#aaa"
                  textAnchor="middle"
                >
                  {legendValue}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* Linhas dos eixos */}
        {actions.map((_, i) => {
          const angle = i * angleSlice;
          const { x, y } = getAxisPoint(angle, radius);
          return (
            <Line
              key={`line-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#ccc"
            />
          );
        })}

        {/* Área preenchida */}
        <Polygon
          points={polygonPoints}
          fill="rgba(0,200,83,0.4)"
          stroke="green"
          strokeWidth={2}
        />

        {/* Pontos nos vértices */}
        {actions.map((action, i) => {
          const angle = i * angleSlice;
          const value = data[action] ?? 0;
          const [x, y] = getPoint(angle, value).split(',').map(Number);
          return <Circle key={`dot-${i}`} cx={x} cy={y} r={3} fill="green" />;
        })}

        {/* Rótulos das ações */}
        {actions.map((action, i) => {
          const angle = i * angleSlice;
          const { x, y } = getAxisPoint(angle, radius + 12);
          return (
            <SvgText
              key={`label-${i}`}
              x={x}
              y={y}
              fill={data[action] === 0.04141 ? '#999' : '#000'}
              opacity={data[action] === 0.04141 ? 0.4 : 1}
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {action === 'Levantamento' ? 'Levant.' : action}
            </SvgText>
          );
        })}
      </Svg>

      {/* Modal explicativa */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Como é calculada a positividade?
          </Text>
          <Text style={styles.modalText}>
            Positividade = (Ações nível 3 + Ações nível 2) ÷ Total de Ações.
          </Text>
          <Text style={styles.modalTitle}>Eu errei ou não fiz essa ação?</Text>
          <Text style={styles.modalText}>
            Quando o fundamento fica cinza, significa que nenhuma ação desse
            tipo foi registrada (Ex: Para todo líbero o "Saque" ficará cinza).
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
}
