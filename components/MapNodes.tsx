import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  isSelected?: boolean; // <--- 1. ADDED OPTIONAL PROP HERE FOR THE PATHFINDER HIGHLIGHT
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
  isSelected = false, // <--- 2. DEFAULT IT TO FALSE
  onPress,
}) => {

  // Force the database values into strict numbers
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

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(id, type)}
      style={[
        styles.nodeWrapper,
        {
          left: safeX,
          top: safeY,
        },
      ]}
    >
      {/* 3. INJECT THE ISSELECTED STYLE OVERRIDE TO THE CONTAINER */}
      <View style={[
        styles.iconContainer, 
        isDeleteMode && styles.deleteTargetActive,
        isSelected && styles.selectedTargetActive // <--- Highlight applied here
      ]}>
        <Image 
          source={iconSource} 
          style={styles.vectorImage} 
          resizeMode="contain" 
        />
        
        {isDeleteMode && (
          <View style={styles.deleteBadge}>
            <Text style={styles.deleteBadgeText}>×</Text>
          </View>
        )}
      </View>

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
    width: 60,  
    height: 60,
    transform: [{ translateX: -30 }, { translateY: -30 }], 
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
  // 4. ADDED HIGHLIGHT BORDER DESIGN (Gold / Yellow Outline for high contrast)
  selectedTargetActive: {
    borderColor: '#FFD700',
    borderWidth: 3.5,
    backgroundColor: '#FFFDE7',
    transform: [{ scale: 1.1 }], // Pop it slightly bigger so the user knows it's chosen!
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