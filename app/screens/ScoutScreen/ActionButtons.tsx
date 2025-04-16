// ScoutScreen/ActionButtons.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface ActionButtonsProps {
  actions: string[];
  selectedAction: string | null;
  selectedQuality: number | null;
  onActionButtonPress: (action: string, quality: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
let buttonWidth, buttonHeight;

if (screenHeight > screenWidth) {
  buttonWidth = (screenHeight * 0.5 - 57) / 5;
  buttonHeight = (screenWidth - 130) / 6;
} else {
  buttonWidth = (screenWidth * 0.5 - 57) / 5;
  buttonHeight = (screenHeight - 130) / 6;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  actions,
  selectedAction,
  selectedQuality,
  onActionButtonPress,
}) => {
  const renderActionButton = (
    title: string,
    value: number,
    index: number,
    total: number,
  ) => {
    const isSelected = selectedAction === title && selectedQuality === value;
    const opacity = !selectedAction || isSelected ? 1 : 0.5;
    const isLast = index === total - 1;

    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.actionButton,
          (styles as any)[`actionButton${value}`],
          isSelected && styles.selectedActionButton,
          {
            opacity,
            width: buttonWidth,
            height: buttonHeight,
            marginRight: isLast ? 0 : 8,
          },
        ]}
        onPress={() => onActionButtonPress(title, value)}
      >
        <Text style={styles.actionButtonText}>{value}</Text>
      </TouchableOpacity>
    );
  };

  const renderActionButtonRow = (action: string) => (
    <View style={styles.actionRow} key={action}>
      <Text
        style={[
          styles.actionRowTitle,
          { width: buttonWidth, height: buttonHeight },
        ]}
      >
        {action === 'Levantamento' ? 'Levant.' : action}
      </Text>
      {[3, 2, 1, 0].map((score, index, arr) =>
        renderActionButton(action, score, index, arr.length),
      )}
    </View>
  );

  return <View>{actions.map(action => renderActionButtonRow(action))}</View>;
};

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  actionRowTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionButton3: { backgroundColor: '#4CAF50' },
  actionButton2: { backgroundColor: '#9ACD32' },
  actionButton1: { backgroundColor: '#FF9900' },
  actionButton0: { backgroundColor: '#FF4D4D' },
  selectedActionButton: {
    opacity: 1,
    borderWidth: 2,
    borderColor: 'blue',
  },
});

export default ActionButtons;
