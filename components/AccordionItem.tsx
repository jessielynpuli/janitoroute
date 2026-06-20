import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccordionItem({ title, content }: { title: string, content: string }) {
  const [expanded, setExpanded] = useState(false);

  // Helper function to colorize the map legend text dynamically
  const renderColorizedContent = (text: string) => {
    // Split the text by lines so we can inspect each bullet point
    const lines = text.split('\n');

    return lines.map((line, index) => {
      if (line.trim().startsWith('• Green:')) {
        return (
          <Text key={index} style={styles.contentText}>
            • <Text style={[styles.statusLabel, { color: '#1B5E20' }]}>Green:</Text> Empty and ready to use.
          </Text>
        );
      }
      if (line.trim().startsWith('• Yellow:')) {
        return (
          <Text key={index} style={styles.contentText}>
            • <Text style={[styles.statusLabel, { color: '#F57F17' }]}>Yellow:</Text> Half-Full.
          </Text>
        );
      }
      if (line.trim().startsWith('• Red:')) {
        return (
          <Text key={index} style={styles.contentText}>
            • <Text style={[styles.statusLabel, { color: '#B71C1C' }]}>Red:</Text> Full (Please use a different bin).
          </Text>
        );
      }

      // Return normal text line if it doesn't match the map color criteria
      return (
        <Text key={index} style={styles.contentText}>
          {line}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.title}>{title}</Text>
        <FontAwesome name={expanded ? "chevron-up" : "chevron-down"} size={14} color="#0D47A1" />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.body}>
          {renderColorizedContent(content)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 5, 
    backgroundColor: '#FFF' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0D47A1' 
  },
  body: { 
    padding: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#eee', 
    backgroundColor: '#F9F9F9',
    gap: 6, // Adds subtle spacing between lines
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
  },
  statusLabel: {
    fontWeight: 'bold',
  }
});