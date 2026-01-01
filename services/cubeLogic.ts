
import { Face, CubeState, Move, Color } from '../types';

const rotateClockwise = (face: Color[]): Color[] => [
  face[6], face[3], face[0],
  face[7], face[4], face[1],
  face[8], face[5], face[2]
];

const rotateCounterClockwise = (face: Color[]): Color[] => [
  face[2], face[5], face[8],
  face[1], face[4], face[7],
  face[0], face[3], face[6]
];

export const getInverseMove = (move: Move): Move => {
  if (move.endsWith('2')) return move;
  if (move.endsWith("'")) return move[0] as Move;
  return `${move}'` as Move;
};

export const getInverseAlgorithm = (moves: Move[]): Move[] => {
  return [...moves].reverse().map(getInverseMove);
};

/**
 * Correct physical mapping for 3x3 Cube
 * Cycle: f1 -> f2 -> f3 -> f4 -> f1
 * Implemented as f1 gets f4, f4 gets f3, f3 gets f2, f2 gets f1
 */
const cycle = (
  state: CubeState,
  f1: Face, i1: number[],
  f2: Face, i2: number[],
  f3: Face, i3: number[],
  f4: Face, i4: number[],
  isCounter: boolean
) => {
  const faces = isCounter ? [f1, f4, f3, f2] : [f1, f2, f3, f4];
  const idxs = isCounter ? [i1, i4, i3, i2] : [i1, i2, i3, i4];

  const temp = [state[faces[0]][idxs[0][0]], state[faces[0]][idxs[0][1]], state[faces[0]][idxs[0][2]]];
  
  state[faces[0]][idxs[0][0]] = state[faces[3]][idxs[3][0]];
  state[faces[0]][idxs[0][1]] = state[faces[3]][idxs[3][1]];
  state[faces[0]][idxs[0][2]] = state[faces[3]][idxs[3][2]];

  state[faces[3]][idxs[3][0]] = state[faces[2]][idxs[2][0]];
  state[faces[3]][idxs[3][1]] = state[faces[2]][idxs[2][1]];
  state[faces[3]][idxs[3][2]] = state[faces[2]][idxs[2][2]];

  state[faces[2]][idxs[2][0]] = state[faces[1]][idxs[1][0]];
  state[faces[2]][idxs[2][1]] = state[faces[1]][idxs[1][1]];
  state[faces[2]][idxs[2][2]] = state[faces[1]][idxs[1][2]];

  state[faces[1]][idxs[1][0]] = temp[0];
  state[faces[1]][idxs[1][1]] = temp[1];
  state[faces[1]][idxs[1][2]] = temp[2];
};

export const applyMove = (state: CubeState, move: Move): CubeState => {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState;
  const face = move[0] as Face;
  const suffix = move.substring(1);

  if (suffix === '2') {
    // Treat 2 as two single moves for logic consistency
    return applyMove(applyMove(state, face as Move), face as Move);
  }

  const isCounter = suffix === "'";
  newState[face] = isCounter ? rotateCounterClockwise(newState[face]) : rotateClockwise(newState[face]);

  switch (face) {
    case Face.U:
      cycle(newState, Face.F, [0,1,2], Face.R, [0,1,2], Face.B, [0,1,2], Face.L, [0,1,2], isCounter);
      break;
    case Face.D:
      cycle(newState, Face.F, [6,7,8], Face.L, [6,7,8], Face.B, [6,7,8], Face.R, [6,7,8], isCounter);
      break;
    case Face.L:
      cycle(newState, Face.U, [0,3,6], Face.F, [0,3,6], Face.D, [0,3,6], Face.B, [8,5,2], isCounter);
      break;
    case Face.R:
      cycle(newState, Face.U, [2,5,8], Face.B, [6,3,0], Face.D, [2,5,8], Face.F, [2,5,8], isCounter);
      break;
    case Face.F:
      cycle(newState, Face.U, [6,7,8], Face.R, [0,3,6], Face.D, [2,1,0], Face.L, [8,5,2], isCounter);
      break;
    case Face.B:
      cycle(newState, Face.U, [2,1,0], Face.L, [0,3,6], Face.D, [6,7,8], Face.R, [8,5,2], isCounter);
      break;
  }

  return newState;
};

export const parseAlgorithm = (str: string): Move[] => {
  const parts = str.toUpperCase().split(/[\s,]+/);
  const result: Move[] = [];
  const valid = ['U', 'D', 'L', 'R', 'F', 'B'];
  for (const p of parts) {
    if (!p) continue;
    const f = p[0];
    if (valid.includes(f)) {
      let m = f;
      if (p.includes("'") || p.includes("’")) m += "'";
      else if (p.includes("2")) m += "2";
      result.push(m as Move);
    }
  }
  return result;
};
