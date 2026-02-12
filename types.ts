
export type Tool = 'brush' | 'eraser';

export type Color = {
  id: string;
  name: string;
  hex: string;
};

export interface Point {
  x: number;
  y: number;
}

export enum HandMode {
  IDLE = 'IDLE',
  DRAW = 'DRAW',
  SELECT = 'SELECT',
  PREDICT = 'PREDICT'
}

export const COLORS: Color[] = [
  { id: 'red', name: 'Red', hex: '#ef4444' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6' },
  { id: 'green', name: 'Green', hex: '#22c55e' },
  { id: 'yellow', name: 'Yellow', hex: '#eab308' },
  { id: 'white', name: 'White', hex: '#ffffff' },
];
