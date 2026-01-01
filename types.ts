
export enum Face {
  U = 'U', D = 'D', L = 'L', R = 'R', F = 'F', B = 'B'
}

export type Color = 'white' | 'yellow' | 'orange' | 'red' | 'green' | 'blue';

export type CubeState = {
  [key in Face]: Color[];
};

export type BasicMove = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export type MoveSuffix = '' | "'" | '2';
export type Move = `${BasicMove}${MoveSuffix}`;

export interface Algorithm {
  id: string;
  name: string;
  moves: Move[];
  description: string;
  category: 'basic' | 'advanced' | 'pro' | 'custom';
}

export type TrainingMode = 'training' | 'exam';

export interface ScoreState {
  streak: number;
  bestStreak: number;
  startTime: number | null;
  totalTime: number;
  stars: number;
}
