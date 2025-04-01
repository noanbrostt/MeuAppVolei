// app/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScoutHistoryScreen from './screens/ScoutHistoryScreen';
import TeamsScreen from './screens/TeamsScreen';

export default function Index() {
  return (
      <View>
        <TouchableOpacity 
          style={styles.screenButton}
          onPress={() => router.replace(`/screens/TeamsScreen`)} 
        >
          <Text style={styles.screenText}>TeamsScreen</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
              style={styles.screenButton}
          onPress={() => router.replace(`/screens/ScoutHistoryScreen`)} 
        >
          <Text style={styles.screenText}>ScoutHistoryScreen</Text>
        </TouchableOpacity>
      </View>
  );
}
  
const styles = StyleSheet.create({

  screenButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  screenText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
