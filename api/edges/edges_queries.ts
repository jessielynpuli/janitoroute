// api/edges/queries.ts
import { supabase } from '../supabase';

export type UIWeight = 'Adjacent' | 'Midway' | 'Remote';

// 2. Map the strings to database integers
export const WEIGHT_MAP: Record<UIWeight, number> = {
  'Adjacent': 1,
  'Midway': 2,
  'Remote': 3,
};
export interface DBEdge {
  edge_id: string;
  from_node_id: string;
  source_type: 'landmark' | 'wastebin';
  to_node_id: string;
  target_type: 'landmark' | 'wastebin';
  weight: number; // 1 = adjacent, 2 = midway, 3 = remote
}

/**
 * 1. FETCH ALL EDGES
 * Pulls the entire path network framework from the cloud.
 */
export const fetchNetworkEdges = async (): Promise<DBEdge[]> => {
  const { data, error } = await supabase
    .from('edges')
    .select('edge_id, from_node_id, source_type, to_node_id, target_type, weight');

  if (error) {
    console.error("Failed to fetch network edges:", error.message);
    throw error; // Pass the error up to the UI to handle
  }

  // Ensure weights are strictly treated as numbers
  return (data || []).map(edge => ({
    ...edge,
    weight: Number(edge.weight)
  }));
};

/**
 * 2. UPDATE EDGE WEIGHT (Admin Feature)
 * Matches your wireframe sketch rule: "pede ichange ng admin yung map"
 */
export const updateEdgeWeight = async (edgeId: number, newWeight: number) => {
  const { data, error } = await supabase
    .from('edges')
    .update({ weight: newWeight })
    .eq('edge_id', edgeId);

  if (error) {
    console.error(`Failed to update edge ${edgeId}:`, error.message);
    return { success: false, error };
  }

  return { success: true, data };
};


/**
 * 3. INSERT NEW NETWORK EDGES (Bulk Insert)
 * Runs when creating a landmark/trashbin that connects to existing nodes.
 */
export const insertNetworkEdges = async (newEdges: Omit<DBEdge, 'edge_id'>[]) => {
  if (newEdges.length === 0) return { success: true, data: [] };

  // Explicitly log the payload to catch 'null' IDs before they hit Supabase
  console.log("Saving edges to Supabase:", newEdges);

  
  const { data, error } = await supabase
    .from('edges')
    .insert(newEdges)
    .select();

  if (error) {
    console.error("Failed to insert network edges:", error.message);
    return { success: false, error };
  }

  return { success: true, data };
};