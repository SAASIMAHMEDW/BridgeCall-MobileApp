import { View, Text,StyleSheet } from 'react-native'
import React from 'react'

const Test = () => {
  return (
    <View>
      <Text style={styles.text}>Test component</Text>
    </View>
  )
}

export default Test;

const styles = StyleSheet.create({
  text:{
    color: 'white',
    fontSize: 30,
    textAlign: 'center',
    marginTop: 50
  }
});