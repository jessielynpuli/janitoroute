import React, { useMemo, useState } from 'react';
import { Image, TouchableOpacity, StyleSheet, View } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg'; // <--- IMPORT SVG COMPONENTS

import { MapNode } from '@/components/MapNodes'; 
import { DBEdge } from '@/api/edges/edges_queries'; 

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
  onNodePress: (id: string, type: 'landmark' | 'wastebin') => void;
}

export default function NodalGraph({ mapData, edges = [], isDeleteMode, onNodePress }: NodalGraphProps) {
  
  // ==========================================
  // 1. BUILD A COORDINATE DICTIONARY
  // Creates a fast lookup table for X/Y points so we can connect the lines
  // ==========================================
  const nodeCoordinates = useMemo(() => buildNodeCoordinates(mapData), [mapData]);;
  
  // ==========================================
  // 2. FLATTEN GRAPH NODES
  // ==========================================
  
  const renderNodes = () => {
  return (mapData || []).flatMap((landmark: LandmarkRow) => { // Type the landmark
    const landmarkNode = (
      <MapNode
        key={`landmark-${landmark.landmark_id}`}
        id={landmark.landmark_id}
        name={landmark.landmark_name}
        type="landmark"
        x={landmark.x_position}
        y={landmark.y_position}
        isDeleteMode={isDeleteMode}
        onPress={(id, type) => onNodePress?.(id,type)}
      />
    );

    // Explicitly type the bin variable here
    const wastebinNodes = (landmark.wastebins || []).map((bin: WastebinRow) => {
      // Calculate absolute position
      const absX = Number(landmark.x_position) + Number(bin.x_position);
      const absY = Number(landmark.y_position) + Number(bin.y_position);

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
          onPress={(id, type) => onNodePress?.(id,type)}
        />
      );
    });
    
    return [landmarkNode, ...wastebinNodes];
  });
};

  //console.log("Start X Y: ", startNode.x, startNode.y)

  return (

    <View style = {{flex: 1, position: 'relative'}} pointerEvents="box-none">

    <View style={styles.canvasContainer} pointerEvents="box-none">
      
      {/* ========================================== */}
      {/* LAYER 1: TRUE VECTOR GRAPH (Background)      */}
      {/* ========================================== */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {edges.map((edge) => {

          const startNode = nodeCoordinates[edge.from_node_id];
          const endNode = nodeCoordinates[edge.to_node_id];
          console.log("Startnode: ", startNode)
          console.log("Endnode: ", endNode)
          
          // ADD THIS LOG:
            console.log(`DEBUG: Rendering Edge ${edge.edge_id}`, {
              exists: !!startNode && !!endNode,
              startCoord: startNode,
              endCoord: endNode
            });
          // If either node is missing from this specific area map, don't draw the line
          
          if (!startNode || !endNode) {
            console.log(`Skipping Edge ${edge.edge_id}: Node missing from mapData!`, {
              from: edge.from_node_id,
              to: edge.to_node_id,
              coordsFound: !!startNode && !!endNode
            });
            return null;
          }

          // Visual styling based on weight (Adjacent = Green, Midway = Yellow, Remote = Red)
          //const edgeColor = edge.weight === 1 ? '#B0BEC5' : edge.weight === 2 ? '#F59E0B' : '#EF4444';
          //const edgeThickness = edge.weight === 1 ? 3 : 2;


          return (
            
            <React.Fragment key = {edge.edge_id}>
            
            <Line
            
              key={edge.edge_id}
              x1={Number(startNode.x )} // Start X
              y1={Number(startNode.y) } // Start Y
              x2={Number(endNode.x) }   // End X
              y2={Number(endNode.y) }   // End Y
              stroke={'#B0BEC5'}
              strokeWidth={3}
              strokeLinecap="round" // Optional: adds smooth rounded caps to the line ends
            />

            {/* DEBUG: Crosshair at target */}
            <Line x1={Number(endNode.x) - 10} y1={Number(endNode.y)} x2={Number(endNode.x) + 10} y2={Number(endNode.y)} stroke="red" strokeWidth="2" />
            <Line x1={Number(endNode.x)} y1={Number(endNode.y) - 10} x2={Number(endNode.x)} y2={Number(endNode.y) + 10} stroke="red" strokeWidth="2" />

            <Circle 
                cx={endNode.x} 
                cy={endNode.y} 
                r="6" 
                fill="red" 
              />
            </React.Fragment>
          );
        })}
      </Svg>
      
      {/* ========================================== */}
      {/* LAYER 2: INTERACTIVE NODES (Foreground)      */}
      {/* ========================================== */}
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
    padding: 0,
    margin: 0,
  },
});