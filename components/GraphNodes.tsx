import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { DBEdge } from '@/api/edges/edges_queries';
import { MapNode } from '@/components/MapNodes';
import { buildNodeCoordinates } from '@/hooks/graphUtils';

export interface WastebinRow {
  wastebin_id: string;
  id?: string;
  landmark_id?: string;
  x_position: number;
  y_position: number;
  description?: string;
  status: 'empty' | 'half-full' | 'full';
}

export interface LandmarkRow {
  landmark_id: string;
  area_id?: string;
  x_position: number;
  y_position: number;
  landmark_name: string;
  wastebins?: WastebinRow[]; 
}

export interface NodalGraphProps {
  mapData: LandmarkRow[];
  edges: DBEdge[]; 
  isDeleteMode: boolean;
  onNodePress: (id: string, type: 'landmark' | 'wastebin', nodeDetails?: any) => void;
  // Dynamic highlighting hook for BFS engine runs
  highlightedEdges?: Array<{ from: string; to: string }>;
  selectedStartNodeId?: string | null;
}

export default function NodalGraph({ 
  mapData, 
  edges = [], 
  isDeleteMode, 
  onNodePress,
  highlightedEdges = [],
  selectedStartNodeId = null
}: NodalGraphProps) {
  
  const nodeCoordinates = useMemo(() => buildNodeCoordinates(mapData), [mapData]);

  const renderNodes = () => {
    return (mapData || []).flatMap((landmark: LandmarkRow) => {
      const isSelectedStart = selectedStartNodeId === landmark.landmark_id;
      
      const landmarkNode = (
        <MapNode
          key={`landmark-${landmark.landmark_id}`}
          id={landmark.landmark_id}
          name={landmark.landmark_name}
          type="landmark"
          x={landmark.x_position}
          y={landmark.y_position}
          isDeleteMode={isDeleteMode}
          // Highlight border if selected as start node
          isSelected={isSelectedStart} 
          onPress={(id, type) => onNodePress?.(id, type, landmark)}
        />
      );

      const wastebinNodes = (landmark.wastebins || []).map((bin: WastebinRow) => {
        const absX = Number(landmark.x_position) + Number(bin.x_position);
        const absY = Number(landmark.y_position) + Number(bin.y_position);
        const isSelectedBinStart = selectedStartNodeId === bin.wastebin_id;

        return (
          <MapNode
            key={`wastebin-${bin.wastebin_id}`}
            id={bin.wastebin_id}
            name={bin.description || 'Trashbin'}
            type="wastebin"
            status={bin.status}
            x={absX}
            y={absY}
            isDeleteMode={isDeleteMode}
            isSelected={isSelectedBinStart}
            onPress={(id, type) => onNodePress?.(id, type, bin)}
          />
        );
      });
      
      return [landmarkNode, ...wastebinNodes];
    });
  };

  return (
    <View style={{ flex: 1, position: 'relative' }} pointerEvents="box-none">
      <View style={styles.canvasContainer} pointerEvents="box-none">
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {edges.map((edge) => {
            const startNode = nodeCoordinates[edge.from_node_id];
            const endNode = nodeCoordinates[edge.to_node_id];
            
            if (!startNode || !endNode) return null;

            // Check if this bidirectional edge direction is part of the highlighted BFS tracking array
            const isHighlighted = highlightedEdges.some(
              h => (h.from === edge.from_node_id && h.to === edge.to_node_id) ||
                   (h.from === edge.to_node_id && h.to === edge.from_node_id)
            );

            return (
              <React.Fragment key={edge.edge_id}>
                <Line
                  x1={Number(startNode.x)}
                  y1={Number(startNode.y)}
                  x2={Number(endNode.x)}
                  y2={Number(endNode.y)}
                  stroke={isHighlighted ? '#D32F2F' : '#B0BEC5'}
                  strokeWidth={isHighlighted ? 6 : 3}
                  strokeLinecap="round"
                />
                {isHighlighted && (
                  <Circle 
                    cx={endNode.x} 
                    cy={endNode.y} 
                    r="5" 
                    fill="#D32F2F" 
                  />
                )}
              </React.Fragment>
            );
          })}
        </Svg>
        {renderNodes()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%', 
    height: '100%',
    zIndex: 10,
    position: 'absolute', 
  },
});