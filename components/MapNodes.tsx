import React from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
//import { NODE_ASSETS, NodeType } from './nodeAssets'; // Path to your dictionary asset map


// Define your static local layout asset paths explicitly
export const NODE_ASSETS = {
  landmark: require('@/assets/images/landmark-icon.png'),
  trashbin_empty: require('@/assets/images/emptytrashbin-icon.png'),
  trashbin_half: require('@/assets/images/halftrashbin-icon.png'),
  trashbin_full: require('@/assets/images/fulltrashbin-icon.png'),
};

// Explicit type checking structure for matching database type rows
export type NodeType = 'landmark' | 'wastebin';
export type WastebinStatus = 'empty' | 'half-full' | 'full';

interface MapNodeProps {
  id: string;
  name: string;
  type: NodeType;
  status?: WastebinStatus;
  x: number;
  y: number;
  isDeleteMode: boolean;
  onPress: (id: string, type: NodeType) => void;
}


export const MapNode: React.FC<MapNodeProps> = ({
  id,
  name,
  type,
  status = 'empty',
  x,
  y,
  isDeleteMode,
  onPress,
}) => {

  // 1. Force the database values into strict numbers
  // If the data is broken/missing, it safely defaults to 100 so it appears on screen!
  const safeX = Number(x) || 100; 
  const safeY = Number(y) || 100;

  // Determine which vector image to draw based on database column type string
  let iconSource = NODE_ASSETS.landmark;
  if (type === 'wastebin') {
    if (status === 'full') {
      iconSource = NODE_ASSETS.trashbin_full;
    } else if (status === 'half-full') {
      iconSource = NODE_ASSETS.trashbin_half;
    } else {
      iconSource = NODE_ASSETS.trashbin_empty;
    }
  }

  console.log(`Node [${name}] rendering with state [${status}] at: ${safeX}, ${safeY}`);
  
  return (
    
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(id, type)}
      style={[
        styles.nodeWrapper,
        {
          // Positioning them absolutely on the canvas grid matrix based on your DB coordinates
          left: safeX,
          top: safeY,
          
        },
      ]}
    >
      {/* 1. Visual Icon Container Box */}
      <View style={[styles.iconContainer, isDeleteMode && styles.deleteTargetActive]}>
        <Image 
          source={iconSource} 
          style={styles.vectorImage} 
          resizeMode="contain" 
        />
        
        {/* If delete mode is active, overlay a small indicator badge layout */}
        {isDeleteMode && (
          <View style={styles.deleteBadge}>
            <Text style={styles.deleteBadgeText}>×</Text>
          </View>
        )}
      </View>

      {/* 2. Text Label under the icon */}
      <Text numberOfLines={1} style={styles.nodeLabel}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,  // Bound box size limits
    height: 60,
    transform: [{ translateX: -30 }, { translateY: -30 }], // Anchors coordinates to the exact middle of the icon!
    zIndex: 99,  
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#6D6D6D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  deleteTargetActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFE3E3',
  },
  vectorImage: {
    width: 32,
    height: 32,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    marginTop: 4,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  deleteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  }
});