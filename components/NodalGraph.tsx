import { SupabaseLandmarkPayload } from '@/constants/mockData';
import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

// Receives the structured map data as a prop from the HomeScreen
interface NodalGraphProps {
  mapData: SupabaseLandmarkPayload[];
  selectedNodeId?: string | null;
  onNodePress?: (nodeId: string, isLandmark: boolean, nodeDetails: any) => void;
}

export default function NodalGraph({ mapData, selectedNodeId = null, onNodePress }: NodalGraphProps) {
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [selectedTargetBinId, setSelectedTargetBinId] = useState<string | null>(null);
  
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
    const dictionary: Record<string, { x: number; y: number; isLandmark: boolean; name?: string; status?: string }> = {};

    mapData.forEach((landmark) => {
      // 1. Process Landmark positions
      dictionary[landmark.landmark_id] = {
        x: landmark.x_position,
        y: landmark.y_position,
        isLandmark: true,
        name: landmark.landmark_name,
      };

      // 2. Process their attached wastebin positions
      landmark.wastebins.forEach((bin) => {
        dictionary[bin.wastebin_id] = {
          x: bin.x_position ?? landmark.x_position,
          y: bin.y_position ?? landmark.y_position,
          isLandmark: false,
          name: bin.description || 'Trashbin',
          status: bin.status || 'empty',
        };
      });
    });

    return dictionary;
  }, [mapData]);

  // Define sizes for your images so we can center them easily
  const LANDMARK_SIZE = 46;
  const TRASHBIN_SIZE = 36;

  return (
    <View style={styles.container}>
      {/* Layer 1: Vector Edges */}
      <Svg style={StyleSheet.absoluteFillObject}>
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
      </Svg>

      {/* Layer 2: PNG Nodes absolute positioned on top of the lines */}
      {Object.entries(nodeLookup).map(([id, node]) => {
        const iconSize = node.isLandmark ? LANDMARK_SIZE : TRASHBIN_SIZE;
        const offset = iconSize / 2;

        // Dynamic resource switching for wastebin status
        let imageSource = require('@/assets/images/landmark-icon.png'); // Default fallback
        
        if (node.isLandmark) {
          imageSource = require('@/assets/images/landmark-icon.png'); // Put your landmark filename here
        } else {
          // Switch assets based on database fullness state
          if (node.status === 'full') {
            imageSource = require('@/assets/images/fulltrashbin-icon.png');
          } else if (node.status === 'half-full') {
            imageSource = require('@/assets/images/halftrashbin-icon.png');
          } else {
            imageSource = require('@/assets/images/emptytrashbin-icon.png');
          }
        }

        return (
          <TouchableOpacity
            key={id}
            onPress={() => onNodePress?.(id, node.isLandmark, node)}
            style={[
              styles.nodeTouchable,
              {
                width: iconSize,
                height: iconSize,
                // Subtracting half the width/height shifts the image center directly onto the line ends
                left: node.x - offset,
                top: node.y - offset,
              }
            ]}
          >
            <Image 
              source={imageSource} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode="contain"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
    position: 'relative', // CRITICAL: Makes absolute positioning work for child nodes
  },
  nodeTouchable: {
    position: 'absolute',
    zIndex: 5, // Ensures images sit perfectly above the SVG canvas paths
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