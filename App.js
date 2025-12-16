import React from 'react';
import { StyleSheet, Text, View, StatusBar, Button } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ClientPageUser from './src/screens/ClientPageUser'
const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
        <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
       <ClientPageUser></ClientPageUser>
      </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 40,
  },
  features: {
    marginTop: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  feature: {
    fontSize: 16,
    color: '#444',
    marginVertical: 8,
  },
});

export default App;