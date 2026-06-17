import { SupabaseLandmarkPayload } from '@/constants/interfaceData';
import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

interface NodalGraphProps {
  mapData: SupabaseLandmarkPayload[];
  selectedNodeId?: string | null;
  // Added optional prop: defaults to empty array if not provided by screen
  highlightedEdges?: Array<{ from: string; to: string }>; 
  onNodePress?: (nodeId: string, isLandmark: boolean, nodeDetails: any) => void;
}

export default function NodalGraph({ 
  mapData, 
  selectedNodeId = null, 
  highlightedEdges = [], // Default to empty array
  onNodePress
}: NodalGraphProps) {

  // Safety check
  if (!mapData || mapData.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Please select an area above to view its graph</Text>
      </View>
    );
  }

  const nodeLookup = useMemo(() => {
    const dictionary: Record<string, { x: number; y: number; isLandmark: boolean; name?: string; status?: string }> = {};
    mapData.forEach((landmark) => {
      dictionary[landmark.landmark_id] = { x: landmark.x_position, y: landmark.y_position, isLandmark: true, name: landmark.landmark_name };
      landmark.wastebins.forEach((bin) => {
        dictionary[bin.wastebin_id] = { x: bin.x_position ?? landmark.x_position, y: bin.y_position ?? landmark.y_position, isLandmark: false, name: bin.description || 'Trashbin', status: bin.status || 'empty' };
      });
    });
    return dictionary;
  }, [mapData]);

  const LANDMARK_SIZE = 46;
  const TRASHBIN_SIZE = 36;

  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFillObject}>
        {mapData.map((landmark) => 
          landmark.wastebins.map((bin) => {
            const startNode = nodeLookup[landmark.landmark_id];
            const endNode = nodeLookup[bin.wastebin_id];

            if (!startNode || !endNode) return null;

            // CHECK IF THIS EDGE IS IN THE HIGHLIGHTED LIST
            const isHighlighted = highlightedEdges.some(
              (edge) => edge.from === landmark.landmark_id && edge.to === bin.wastebin_id
            );

            return (
              <Line
                key={`edge-${bin.wastebin_id}`}
                x1={startNode.x}
                y1={startNode.y}
                x2={endNode.x}
                y2={endNode.y}
                // Highlight color and thickness
                stroke={isHighlighted ? "#D32F2F" : "#B0BEC5"}
                strokeWidth={isHighlighted ? 6 : 3}
              />
            );
          })
        )}
      </Svg>

      {/* Layer 2: PNG Nodes */}
      {Object.entries(nodeLookup).map(([id, node]) => {
        const iconSize = node.isLandmark ? LANDMARK_SIZE : TRASHBIN_SIZE;
        const offset = iconSize / 2;
        let imageSource = require('@/assets/images/landmark-icon.png');
        
        if (!node.isLandmark) {
          if (node.status === 'full') imageSource = require('@/assets/images/fulltrashbin-icon.png');
          else if (node.status === 'half-full') imageSource = require('@/assets/images/halftrashbin-icon.png');
          else imageSource = require('@/assets/images/emptytrashbin-icon.png');
        }

        return (
          <TouchableOpacity
            key={id}
            onPress={() => onNodePress?.(id, node.isLandmark, node)}
            style={[styles.nodeTouchable, { width: iconSize, height: iconSize, left: node.x - offset, top: node.y - offset }]}
          >
            <Image source={imageSource} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', position: 'relative' },
  nodeTouchable: { position: 'absolute', zIndex: 5 },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  placeholderText: { color: '#666666', fontSize: 14, textAlign: 'center' },
});