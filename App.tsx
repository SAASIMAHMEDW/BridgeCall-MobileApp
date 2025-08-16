import { View, Text,StyleSheet } from 'react-native'
import React from 'react'
import Test from "./src/Test"


const App = () => {
  return (
    <View style={styles.bg}>
      <Text style={styles.text}>App component</Text>
      <Test />
    </View>
  )
}

export default App;


const styles = StyleSheet.create({
  bg: {
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
  },
  text:{
    color: 'white',
    fontSize: 50,
    textAlign: 'center',
    marginTop: 50
  }
});