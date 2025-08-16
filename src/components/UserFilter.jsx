import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const UserFilter = ({ statusFilter, setStatusFilter }) => {
  const statusOptions = [
    { value: 'all', label: 'All Users', color: '#6B7280' },
    { value: 'online', label: 'Online', color: '#10B981' },
    { value: 'offline', label: 'Offline', color: '#6B7280' },
    { value: 'incall', label: 'In Call', color: '#F59E0B' },
    { value: 'callinitiated', label: 'Call Initiated', color: '#3B82F6' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter by Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.optionsContainer}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setStatusFilter(option.value === 'all' ? '' : option.value)}
              style={[
                styles.optionButton,
                (statusFilter === option.value) || (option.value === 'all' && !statusFilter)
                  ? styles.optionButtonActive
                  : styles.optionButtonInactive,
              ]}
            >
              <View style={styles.optionContent}>
                <View style={[styles.colorDot, { backgroundColor: option.color }]} />
                <Text style={[
                  styles.optionText,
                  (statusFilter === option.value) || (option.value === 'all' && !statusFilter)
                    ? styles.optionTextActive
                    : styles.optionTextInactive,
                ]}>
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  scrollView: {
    flexGrow: 0,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(44, 169, 188, 1)',
  },
  optionButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#000',
  },
  optionTextInactive: {
    color: '#fff',
  },
});

export default UserFilter;
