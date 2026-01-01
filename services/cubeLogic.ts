
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

export const applyMove = (state: CubeState, move: Move): CubeState => {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState;
  const face = move[0] as Face;
  const suffix = move.substring(1);

  if (suffix === '2') {
    return applyMove(applyMove(state, `${face}` as Move), `${face}` as Move);
  }

  const isCounter = suffix === "'";

  // Primary Face Rotation
  newState[face] = isCounter ? rotateCounterClockwise(newState[face]) : rotateClockwise(newState[face]);

  // Adjacent Side Stickers Swapping (Physical Logic)
  const f = newState[Face.F], r = newState[Face.R], b = newState[Face.B], l = newState[Face.L], u = newState[Face.U], d = newState[Face.D];

  switch (face) {
    case Face.U: {
      const temp = [f[0], f[1], f[2]];
      if (!isCounter) {
        f[0]=r[0]; f[1]=r[1]; f[2]=r[2];
        r[0]=b[0]; r[1]=b[1]; r[2]=b[2];
        b[0]=l[0]; b[1]=l[1]; b[2]=l[2];
        l[0]=temp[0]; l[1]=temp[1]; l[2]=temp[2];
      } else {
        f[0]=l[0]; f[1]=l[1]; f[2]=l[2];
        l[0]=b[0]; l[1]=b[1]; l[2]=b[2];
        b[0]=r[0]; b[1]=r[1]; b[2]=r[2];
        r[0]=temp[0]; r[1]=temp[1]; r[2]=temp[2];
      }
      break;
    }
    case Face.D: {
      const temp = [f[6], f[7], f[8]];
      if (!isCounter) {
        f[6]=l[6]; f[7]=l[7]; f[8]=l[8];
        l[6]=b[6]; l[7]=b[7]; l[8]=b[8];
        b[6]=r[6]; b[7]=r[7]; b[8]=r[8];
        r[6]=temp[0]; r[7]=temp[1]; r[8]=temp[2];
      } else {
        f[6]=r[6]; f[7]=r[7]; f[8]=r[8];
        r[6]=b[6]; r[7]=b[7]; r[8]=b[8];
        b[6]=l[6]; b[7]=l[7]; b[8]=l[8];
        l[6]=temp[0]; l[7]=temp[1]; l[8]=temp[2];
      }
      break;
    }
    case Face.R: {
      const temp = [f[2], f[5], f[8]];
      if (!isCounter) {
        f[2]=d[2]; f[5]=d[5]; f[8]=d[8];
        d[2]=b[6]; d[5]=b[3]; d[8]=b[0];
        b[6]=u[2]; b[3]=u[5]; b[0]=u[8];
        u[2]=temp[0]; u[5]=temp[1]; u[8]=temp[2];
      } else {
        f[2]=u[2]; f[5]=u[5]; f[8]=u[8];
        u[2]=b[6]; u[5]=b[3]; u[8]=b[0];
        b[6]=d[2]; b[3]=d[5]; b[8]=d[8]; // Corrected index mapping for R'
        b[6]=d[2]; b[3]=d[5]; b[0]=d[8];
        d[2]=temp[0]; d[5]=temp[1]; d[8]=temp[2];
      }
      // Re-fix R logic explicitly to ensure NO ambiguity
      const f_r = [f[2], f[5], f[8]], u_r = [u[2], u[5], u[8]], d_r = [d[2], d[5], d[8]], b_r = [b[6], b[3], b[0]];
      if (!isCounter) {
        f[2]=d_r[0]; f[5]=d_r[1]; f[8]=d_r[2];
        d[2]=b_r[0]; d[5]=b_r[1]; d[8]=b_r[2];
        b[6]=u_r[0]; b[3]=u_r[1]; b[0]=u_r[2];
        u[2]=f_r[0]; u[5]=f_r[1]; u[8]=f_r[2];
      } else {
        f[2]=u_r[0]; f[5]=u_r[1]; f[8]=u_r[2];
        u[2]=b_r[0]; u[5]=b_r[1]; u[8]=b_r[2];
        b[6]=d_r[0]; b[3]=d_r[1]; b[0]=d_r[2];
        d[2]=f_r[0]; d[5]=f_r[1]; d[8]=f_r[2];
      }
      break;
    }
    case Face.L: {
      const f_l = [f[0], f[3], f[6]], u_l = [u[0], u[3], u[6]], d_l = [d[0], d[3], d[6]], b_l = [b[8], b[5], b[2]];
      if (!isCounter) {
        f[0]=u_l[0]; f[3]=u_l[1]; f[6]=u_l[2];
        u[0]=b_l[0]; u[3]=b_l[1]; u[6]=b_l[2];
        b[8]=d_l[0]; b[5]=d_l[1]; b[2]=d_l[2];
        d[0]=f_l[0]; d[3]=f_l[1]; d[6]=f_l[2];
      } else {
        f[0]=d_l[0]; f[3]=d_l[1]; f[6]=d_l[2];
        d[0]=b_l[0]; d[3]=b_l[1]; d[6]=b_l[2];
        b[8]=u_l[0]; b[5]=u_l[1]; b[2]=u_l[2];
        u[0]=f_l[0]; u[3]=f_l[1]; u[6]=f_l[2];
      }
      break;
    }
    case Face.F: {
      const u_f = [u[6], u[7], u[8]], r_f = [r[0], r[3], r[6]], d_f = [d[2], d[1], d[0]], l_f = [l[8], l[5], l[2]];
      if (!isCounter) {
        u[6]=l_f[0]; u[7]=l_f[1]; u[8]=l_f[2];
        r[0]=u_f[0]; r[3]=u_f[1]; r[6]=u_f[2];
        d[2]=r_f[0]; d[1]=r_f[1]; d[0]=r_f[2];
        l[8]=d_f[0]; l[5]=d_f[1]; l[2]=d_f[2];
      } else {
        u[6]=r_f[0]; u[7]=r_f[1]; u[8]=r_f[2];
        l[8]=u_f[0]; l[5]=u_f[1]; l[2]=u_f[2];
        d[2]=l_f[0]; d[1]=l_f[1]; d[0]=l_f[2];
        r[0]=d_f[0]; r[3]=d_f[1]; r[6]=d_f[2];
      }
      break;
    }
    case Face.B: {
      const u_b = [u[0], u[1], u[2]], r_b = [r[2], r[5], r[8]], d_b = [d[8], d[7], d[6]], l_b = [l[6], l[3], l[0]];
      if (!isCounter) {
        u[0]=r_b[0]; u[1]=r_b[1]; u[2]=r_b[2];
        l[6]=u_b[0]; l[3]=u_b[1]; l[0]=u_b[2];
        d[8]=l_b[0]; d[7]=l_b[1]; d[6]=l_b[2];
        r[2]=d_b[0]; r[5]=d_b[1]; r[8]=d_b[2];
      } else {
        u[0]=l_b[0]; u[1]=l_b[1]; u[2]=l_b[2];
        r[2]=u_b[0]; r[5]=u_b[1]; r[8]=u_b[2];
        d[8]=r_b[0]; d[7]=r_b[1]; d[6]=r_b[2];
        l[6]=d_b[0]; l[3]=d_b[1]; l[0]=d_b[2];
      }
      break;
    }
  }
  return newState;
};

export const parseAlgorithm = (str: string): Move[] => {
  const normalized = str.toUpperCase().replace(/\s+/g, ' ').trim();
  const parts = normalized.split(/[\s,]+/);
  const result: Move[] = [];
  const validFaces = ['U', 'D', 'L', 'R', 'F', 'B'];
  
  for (const p of parts) {
    if (!p) continue;
    const face = p[0];
    if (!validFaces.includes(face)) continue;
    let move: string = face;
    if (p.includes("'") || p.includes("’")) move += "'";
    else if (p.includes("2")) move += "2";
    result.push(move as Move);
  }
  return result;
};
