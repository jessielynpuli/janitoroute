// api/edges/queries.ts
import { supabase } from '../supabase';

export interface DBEdge {
  edge_id: number;
  from_node_id: string;
  to_node_id: string;
  weight: number; // 1 = Easy, 3 = Medium, 5 = Hard
}

/**
 * 1. FETCH ALL EDGES
 * Pulls the entire path network framework from the cloud.
 */
export const fetchNetworkEdges = async (): Promise<DBEdge[]> => {
  const { data, error } = await supabase
    .from('edges')
    .select('edge_id, from_node_id, to_node_id, weight');

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