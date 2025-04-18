import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  data: {
    [key: string]: {
      0: number;
      1: number;
      2: number;
      3: number;
    };
  };

  barColors?: {
    positive: string;
    negative: string;
    neutral: string;
    empty?: string;
  };
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
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#004fa3',
    padding: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default function EfficiencyBarChart({ data, barColors }: Props) {
  const [isModalVisible, setModalVisible] = useState(false);
  const width = 300;
  const height = 220;
  const barWidth = 25;
  const barSpacing = 20;
  const centerY = height / 2 - 10;
  const labelPaddingInside = 2;
  const labelPaddingOutside = 3;
  const smallBarThreshold = 15;

  const {
    positive = '#4CAF50',
    negative = '#F44336',
    neutral = '#BDBDBD',
    empty = '#ddd',
  } = barColors || {};

  const keys = Object.keys(data);

  const calcEfficiency = (item: {
    0: number;
    1: number;
    2: number;
    3: number;
  }) => {
    const total = item[0] + item[1] + item[2] + item[3];
    if (total === 0) return null;
    return (item[3] + item[2] - (item[1] + item[0])) / total;
  };

  const formatPercentage = (value: number | null): string | null => {
    if (value === null) return null;
    return (value * 100).toFixed(1) + '%';
  };

  const getTextFillColor = (barColor: string, isInside: boolean): string => {
    if (!isInside) return '#000';
    const r = parseInt(barColor.slice(1, 3), 16);
    const g = parseInt(barColor.slice(3, 5), 16);
    const b = parseInt(barColor.slice(5, 7), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 128 ? '#000' : '#fff';
  };

  return (
    <View style={styles.cardContainer}>
      {/* Título com ícone */}
      <View>
        <Pressable onPress={() => setModalVisible(true)} style={styles.header}>
          <Text style={styles.title}>Eficiência</Text>
          <Ionicons
            name="help-circle-outline"
            size={18}
            color="#666"
            style={{ marginBottom: -2 }}
          />
        </Pressable>
      </View>

      <Svg width={width} height={height} style={{ paddingTop: 10 }}>
        {/* Linha central */}
        <Line
          x1="0"
          x2={width}
          y1={centerY}
          y2={centerY}
          stroke="#aaa"
          strokeWidth="1"
        />

        {/* Linhas de porcentagem de fundo */}
        {[0.25, 0.5, 0.75, 1].map((v, i) => (
          <React.Fragment key={i}>
            <Line
              x1="0"
              x2={width}
              y1={centerY - v * centerY}
              y2={centerY - v * centerY}
              stroke="#eee"
              strokeDasharray="4"
            />
            <Line
              x1="0"
              x2={width}
              y1={centerY + v * centerY}
              y2={centerY + v * centerY}
              stroke="#eee"
              strokeDasharray="4"
            />
            {/* Labels de porcentagem de fundo */}
            <SvgText
              x={4}
              y={centerY - v * centerY + 6}
              fontSize="8"
              fill="#999"
            >{`${v * 100}%`}</SvgText>
            <SvgText
              x={4}
              y={centerY + v * centerY + 6}
              fontSize="8"
              fill="#999"
            >{`${-v * 100}%`}</SvgText>
          </React.Fragment>
        ))}

        {/* Barras */}
        {keys.map((key, i) => {
          const item = data[key];
          const efficiency = calcEfficiency(item);
          const formattedEfficiency = formatPercentage(efficiency);
          const total = item[0] + item[3];
          const barHeightAbs =
            efficiency !== null ? Math.abs(efficiency) * centerY : 0;
          const x = i * (barWidth + barSpacing) + 40;
          const yBar =
            efficiency !== null && efficiency >= 0
              ? centerY - barHeightAbs
              : centerY;
          const isPositive = efficiency !== null && efficiency >= 0;
          const isSmallBar = barHeightAbs < smallBarThreshold;

          const color =
            total === 0
              ? empty
              : efficiency! > 0
              ? positive
              : efficiency! < 0
              ? negative
              : neutral;

          let textY, isInside;

          if (formattedEfficiency !== null) {
            if (isSmallBar) {
              textY = isPositive
                ? yBar - labelPaddingOutside
                : yBar + barHeightAbs + labelPaddingOutside + 8;
              isInside = false;
            } else {
              textY = yBar + barHeightAbs / 2 + 3;
              isInside = true;
            }
          }

          return (
            <React.Fragment key={key}>
              <Rect
                x={x}
                y={yBar}
                width={barWidth}
                height={barHeightAbs}
                fill={color}
              />
              {formattedEfficiency !== null && (
                <SvgText
                  x={x + barWidth / 2}
                  y={textY}
                  fontSize="9"
                  fill={
                    isInside
                      ? getTextFillColor(color, true)
                      : getTextFillColor(color, false)
                  }
                  textAnchor="middle"
                >
                  {formattedEfficiency}
                </SvgText>
              )}
              <SvgText
                x={x + barWidth / 2}
                y={height - 4}
                fontSize="9"
                fill={Number.isNaN(total) ? '#aaa' : '#000'}
                textAnchor="middle"
                opacity={Number.isNaN(total) ? 0.4 : 1}
              >
                {key === 'Levantamento' ? 'Levant.' : key}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Modal explicativa */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Como é calculada a eficiência?</Text>
          <Text style={styles.modalText}>
            Eficiência = (Ações 3 + Ações 2 - Ações 1 - Ações 0) ÷ Total de Ações.
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
