// Move the logic here
import {LandmarkRow, WastebinRow } from '@/components/GraphNodes';
// hooks/graphUtils.ts
export const buildNodeCoordinates = (mapData: LandmarkRow[]) => {
  const coords: Record<string, { x: number, y: number }> = {};
  
 (mapData || []).forEach((landmark) => {
    // 1. Map Landmark Coordinates
    coords[landmark.landmark_id] = {
      x: Number(landmark.x_position),
      y: Number(landmark.y_position),
    };
    
    // 2. Map Nested Wastebin Coordinates using ABSOLUTE values
    if (landmark.wastebins) {
      landmark.wastebins.forEach((bin) => {
        //coords[bin.wastebin_id] = {
        const binId = bin.wastebin_id || bin.id;
        if (binId) {
          coords[binId] ={
          x: Number(landmark.x_position) + Number(bin.x_position),
          y: Number(landmark.y_position) + Number(bin.y_position),
    }}})
    }
 });

  return coords;
}; 