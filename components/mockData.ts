// mockData.ts

export interface Bin {
  id: string;
  name: string;
  status: 'empty' | 'half-full' | 'full';
  x: number; // X coordinate on screen
  y: number; // Y coordinate on screen
}

export interface Edge {
  from: string;
  to: string;
  weight: 'Easy' | 'Medium' | 'Difficult';
}

export const mockBins: Bin[] = [
  { id: '1', name: 'Main Lobby Bin', status: 'empty', x: 60, y: 60 },
  { id: '2', name: 'Canteen Area', status: 'half-full', x: 260, y: 80 },
  { id: '3', name: 'Library Entrance', status: 'full', x: 160, y: 240 },
];

export const mockEdges: Edge[] = [
  { from: '1', to: '2', weight: 'Easy' },
  { from: '2', to: '3', weight: 'Medium' },
  { from: '1', to: '3', weight: 'Difficult' },
];