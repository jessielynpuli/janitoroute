import { SupabaseLandmarkPayload } from '@/constants/mockData';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

// Receives the structured map data as a prop from the HomeScreen
interface NodalGraphProps {
  mapData: SupabaseLandmarkPayload[];
}

export default function NodalGraph({ mapData }: NodalGraphProps) {
  
  // Safety check: If no data has loaded yet
  if (!mapData || mapData.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Please select an area above to view its graph</Text>
      </View>
    );
  }

  // Hashmap lookup for map data
  const nodeLookup = useMemo(() => {
    const dictionary: Record<string, { x: number; y: number; isLandmark: boolean }> = {};

    mapData.forEach((landmark) => {
      // 1. Process Landmark positions
      dictionary[landmark.landmark_id] = {
        x: landmark.x_position,
        y: landmark.y_position,
        isLandmark: true,
      };

      // 2. Process their attached wastebin positions
      landmark.wastebins.forEach((bin) => {
        dictionary[bin.wastebin_id] = {
          // Safety check: If a bin has specific coordinates, use them. Otherwise, sit exactly on the landmark.
          x: bin.x_position ?? landmark.x_position,
          y: bin.y_position ?? landmark.y_position,
          isLandmark: false,
        };
      });
    });

    return dictionary;
  }, [mapData]);

  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFillObject}>
        
        // Draws edges
        {mapData.map((landmark) => 
          landmark.wastebins.map((bin) => {
            const startNode = nodeLookup[landmark.landmark_id];
            const endNode = nodeLookup[bin.wastebin_id];

            if (!startNode || !endNode) return null;

            return (
              <Line
                key={`edge-${bin.wastebin_id}`}
                x1={startNode.x}
                y1={startNode.y}
                x2={endNode.x}
                y2={endNode.y}
                stroke="#B0BEC5" 
                strokeWidth={3}
              />
            );
          })
        )}

        // Draws nodes
        {Object.entries(nodeLookup).map(([id, node]) => (
          <Circle
            key={id}
            cx={node.x}
            cy={node.y}
            r={node.isLandmark ? 18 : 10}
            fill={node.isLandmark ? '#007AFF' : '#34C759'}
            stroke="#ffffff"
            strokeWidth={2}
          />
        ))}

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
  },
});