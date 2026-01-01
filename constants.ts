
import { Face, CubeState, Algorithm, Move } from './types';

export const COLORS: Record<string, string> = {
  white: '#FFFFFF',
  yellow: '#FFD700',
  orange: '#FF8C00',
  red: '#DC143C',
  green: '#32CD32',
  blue: '#1E90FF'
};

export const INITIAL_STATE: CubeState = {
  [Face.U]: Array(9).fill('white'),
  [Face.D]: Array(9).fill('yellow'),
  [Face.L]: Array(9).fill('orange'),
  [Face.R]: Array(9).fill('red'),
  [Face.F]: Array(9).fill('green'),
  [Face.B]: Array(9).fill('blue')
};

export const MOVE_INFO: Record<string, { cn: string; kid: string; icon: string }> = {
  "R": { cn: "右顺", kid: "上", icon: "↑" }, 
  "R'": { cn: "右逆", kid: "下", icon: "↓" }, 
  "R2": { cn: "右双", kid: "上上", icon: "↺" },
  "U": { cn: "顶顺", kid: "勾", icon: "←" }, 
  "U'": { cn: "顶逆", kid: "回", icon: "→" }, 
  "U2": { cn: "顶双", kid: "勾勾", icon: "↺" },
  "L": { cn: "左顺", kid: "底", icon: "↓" }, 
  "L'": { cn: "左逆", kid: "顶", icon: "↑" }, 
  "L2": { cn: "左双", kid: "底底", icon: "↺" },
  "D": { cn: "底顺", kid: "托", icon: "→" }, 
  "D'": { cn: "底逆", kid: "压", icon: "←" }, 
  "D2": { cn: "底双", kid: "托托", icon: "↺" },
  "F": { cn: "前顺", kid: "提", icon: "↻" }, 
  "F'": { cn: "前逆", kid: "顺", icon: "↺" }, 
  "F2": { cn: "前双", kid: "提提", icon: "↺" },
  "B": { cn: "后顺", kid: "推", icon: "↺" }, 
  "B'": { cn: "后逆", kid: "拉", icon: "↻" }, 
  "B2": { cn: "后双", kid: "推推", icon: "↺" }
};

export const ALGORITHMS: Algorithm[] = [
  { id: 'sexy', name: "右手公式 (Sexy)", moves: ["R", "U", "R'", "U'"], description: "最基础的肌肉记忆公式", category: 'basic' },
  { id: 'lefty', name: "左手公式 (Lefty)", moves: ["L'", "U'", "L", "U"], description: "右手公式的镜像对称", category: 'basic' },
  { id: 'sune', name: "小鱼1 (Sune)", moves: ["R", "U", "R'", "U", "R", "U2", "R'"], description: "顶层翻色关键公式", category: 'basic' },
  { id: 'checkerboard', name: "棋盘格", moves: ["R2", "L2", "U2", "D2", "F2", "B2"], description: "六面棋盘花纹", category: 'basic' },
  { id: 'dots', name: "中心点换色", moves: ["U", "D'", "L", "R'", "F", "B'", "U'", "D"], description: "六面中心交换", category: 'basic' }
].map(algo => {
    return { ...algo, moves: algo.moves.map(m => m.replace('M2', 'R2 L2').replace('M', 'R L\'').replace('u', 'U D\'')) } as Algorithm;
}).filter(a => a.moves.length > 0);

export const MOVE_BUTTON_GROUPS: Move[][] = [
  ["R", "R'", "R2"], ["U", "U'", "U2"], ["L", "L'", "L2"],
  ["F", "F'", "F2"], ["D", "D'", "D2"], ["B", "B'", "B2"]
];
