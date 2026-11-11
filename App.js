import React from 'react';
import { StatusBar } from 'expo-status-bar';
import ConverterScreen from './assets/src/views/ConverterScreen';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <ConverterScreen />
    </>
  );
}
