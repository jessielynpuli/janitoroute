import { SupabaseLandmarkPayload } from '@/constants/mockData';
import { useMemo, useState } from 'react';

export function useBfsPathfinder(mapData: SupabaseLandmarkPayload[], nodeLookup: Record<string, any>) {
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [selectedTargetBinId, setSelectedTargetBinId] = useState<string | null>(null);

  // 1. Build Adjacency List for Graph Traversal
  const adjacencyList = useMemo(() => {
    const adj: Record<string, string[]> = {};
    if (!mapData) return adj;

    Object.keys(nodeLookup).forEach(id => { adj[id] = []; });

    mapData.forEach((landmark) => {
      (landmark.wastebins || []).forEach((bin) => {
        adj[landmark.landmark_id].push(bin.wastebin_id);
        adj[bin.wastebin_id].push(landmark.landmark_id); // Double-linked paths
      });
    });
    return adj;
  }, [mapData, nodeLookup]);

  // 2. Breadth-First Search Computation
  const calculatedBfsPath = useMemo(() => {
    if (!startNodeId || !selectedTargetBinId) return [];
    
    const queue: string[] = [startNodeId];
    const visited = new Set<string>([startNodeId]);
    const parentTracker: Record<string, string | null> = { [startNodeId]: null };
    let found = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === selectedTargetBinId) {
        found = true;
        break;
      }

      for (const neighbor of (adjacencyList[current] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parentTracker[neighbor] = current;
          queue.push(neighbor);
        }
      }
    }

    if (!found) return [];

    // Backtrack route steps to generate full trail array
    const path: string[] = [];
    let curr: string | null = selectedTargetBinId;
    while (curr !== null) {
      path.push(curr);
      curr = parentTracker[curr];
    }
    return path.reverse();
  }, [startNodeId, selectedTargetBinId, adjacencyList]);

  // 3. Automated BFS Trigger to find the nearest full bin
  const findNearestFullBinViaBfs = () => {
    if (!startNodeId) return;
    const queue: string[] = [startNodeId];
    const visited = new Set<string>([startNodeId]);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (nodeLookup[current] && !nodeLookup[current].isLandmark && nodeLookup[current].status === 'full') {
        setSelectedTargetBinId(current);
        return;
      }
      for (const neighbor of (adjacencyList[current] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    alert("No bins currently marked as FULL in this area!");
  };

  return {
    startNodeId,
    setStartNodeId,
    selectedTargetBinId,
    setSelectedTargetBinId,
    calculatedBfsPath,
    findNearestFullBinViaBfs
  };
}