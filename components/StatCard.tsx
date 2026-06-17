import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// 2. Define your unique props here (leave out children)
interface StatCardProps {
  title: string;
}

// 3. Wrap your props interface with PropsWithChildren
export default function StatCard({ title, children }: PropsWithChildren<StatCardProps>) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.titleBadge}>
        <Text style={styles.titleText}>{title}</Text>
      </View>
      <View style={styles.contentBox}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: 15,
    position: 'relative',
  },
  titleBadge: {
    position: 'absolute',
    top: -14,
    left: '15%',
    backgroundColor: '#B0C4DE',
    borderWidth: 2,
    borderColor: '#708090',
    paddingHorizontal: 15,
    paddingVertical: 4,
    zIndex: 2,
  },
  titleText: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  contentBox: {
    borderWidth: 2,
    borderColor: '#708090',
    backgroundColor: '#B0C4DE',
    borderRadius: 4,
    paddingTop: 25,
    paddingHorizontal: 15,
    paddingBottom: 15,
    minHeight: 180,
  },
});