// app/index.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.screenContainer}>
      <TouchableOpacity
        style={styles.screenButton}
        onPress={() => router.push(`/screens/TeamsScreen`)}
      >
        <Text style={styles.screenText}>Times</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.screenButton}
        onPress={() => router.push(`/screens/ScoutHistoryScreen`)}
      >
        <Text style={styles.screenText}>Scouts</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    alignSelf: 'center',
    justifyContent: 'center',
    width: Dimensions.get('window').width - 40,
  },
  screenText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
