// This mimics the exact object layout your Supabase query outputs!
export interface SupabaseLandmarkPayload {
  landmark_id: string;
  landmark_name: string;
  x_position: number;
  y_position: number;
  wastebins: {
    wastebin_id: string;
    status: 'empty' | 'half-full' | 'full';
    description?: string;
    x_position?: number;
    y_position?: number;
  }[];
}

// Mock database keyed by area_id
export const MOCK_DATABASE_BY_AREA: Record<string, SupabaseLandmarkPayload[]> = {
  "area-1": [
    {
      landmark_id: 'node-l1',
      landmark_name: 'Science Hall',
      x_position: 100,
      y_position: 100,
      wastebins: [
        { wastebin_id: 'node-b1', status: 'empty', description: 'Hallway Bin A', x_position: 60, y_position: 200 },
        { wastebin_id: 'node-b2', status: 'full', description: 'Courtyard Bin B', x_position: 160, y_position: 300 }
      ]
    },
    {
      landmark_id: 'node-l2',
      landmark_name: 'Cafeteria',
      x_position: 300,
      y_position: 100,
      wastebins: [
        { wastebin_id: 'node-b3', status: 'half-full', description: 'Exit Bin C', x_position: 300, y_position: 250 }
      ]
    }
  ]
};