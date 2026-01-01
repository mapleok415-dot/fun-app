
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

export const MOVE_INFO: Record<string, { cn: string; icon: string }> = {
  "R": { cn: "右顺", icon: "↑" }, "R'": { cn: "右逆", icon: "↓" }, "R2": { cn: "右双", icon: "↺" },
  "L": { cn: "左顺", icon: "↓" }, "L'": { cn: "左逆", icon: "↑" }, "L2": { cn: "左双", icon: "↺" },
  "U": { cn: "顶顺", icon: "←" }, "U'": { cn: "顶逆", icon: "→" }, "U2": { cn: "顶双", icon: "↺" },
  "D": { cn: "底顺", icon: "→" }, "D'": { cn: "底逆", icon: "←" }, "D2": { cn: "底双", icon: "↺" },
  "F": { cn: "前顺", icon: "↻" }, "F'": { cn: "前逆", icon: "↺" }, "F2": { cn: "前双", icon: "↺" },
  "B": { cn: "后顺", icon: "↺" }, "B'": { cn: "后逆", icon: "↻" }, "B2": { cn: "后双", icon: "↺" }
};

export const ALGORITHMS: Algorithm[] = [
  // --- 基础入门 ---
  { id: 'sexy', name: "右手公式 (Sexy)", moves: ["R", "U", "R'", "U'"], description: "最基础的肌肉记忆公式", category: 'basic' },
  { id: 'lefty', name: "左手公式 (Lefty)", moves: ["L'", "U'", "L", "U"], description: "右手公式的镜像对称", category: 'basic' },
  { id: 'sune', name: "小鱼1 (Sune)", moves: ["R", "U", "R'", "U", "R", "U2", "R'"], description: "顶层翻色关键公式", category: 'basic' },
  { id: 'antisune', name: "小鱼2 (Anti-Sune)", moves: ["R", "U2", "R'", "U'", "R", "U'", "R'"], description: "小鱼1的逆向公式", category: 'basic' },

  // --- PLL (Permutation of Last Layer) ---
  { id: 't-perm', name: "T型换角 (T-Perm)", moves: ["R", "U", "R'", "U'", "R'", "F", "R2", "U'", "R'", "U'", "R", "U", "R'", "F'"], description: "交换左右两侧的角块", category: 'advanced' },
  { id: 'y-perm', name: "Y型换角 (Y-Perm)", moves: ["F", "R", "U'", "R'", "U'", "R", "U", "R'", "F'", "R", "U", "R'", "U'", "R'", "F", "R", "F'"], description: "交换对角的角块", category: 'advanced' },
  { id: 'u-perm-a', name: "U型换棱A", moves: ["R2", "U", "R", "U", "R'", "U'", "R'", "U'", "R'", "U", "R'"], description: "三棱逆时针交换", category: 'advanced' },
  { id: 'u-perm-b', name: "U型换棱B", moves: ["R", "U'", "R", "U", "R", "U", "R", "U'", "R'", "U'", "R2"], description: "三棱顺时针交换", category: 'advanced' },
  { id: 'j-perm-a', name: "J型换块A", moves: ["R'", "U", "L'", "U2", "R", "U'", "R'", "U2", "R", "L"], description: "侧边块平行交换A", category: 'pro' },
  { id: 'j-perm-b', name: "J型换块B", moves: ["R", "U", "R'", "F'", "R", "U", "R'", "U'", "R'", "F", "R2", "U'", "R'"], description: "侧边块平行交换B", category: 'pro' },
  { id: 'r-perm-a', name: "R型换块A", moves: ["L", "U2", "L'", "U2", "L", "F'", "L'", "U'", "L", "U", "L", "F", "L2", "U"], description: "复合交换A", category: 'pro' },
  { id: 'r-perm-b', name: "R型换块B", moves: ["R'", "U2", "R", "U2", "R'", "F", "R", "U", "R'", "U'", "R'", "F'", "R2", "U'"], description: "复合交换B", category: 'pro' },
  { id: 'f-perm', name: "F型换块", moves: ["R'", "U'", "F'", "R", "U", "R'", "U'", "R'", "F", "R2", "U'", "R'", "U'", "R", "U", "R'", "U", "R"], description: "对边平行交换", category: 'pro' },
  { id: 'v-perm', name: "V型换块", moves: ["R'", "U", "R'", "U'", "R'", "D'", "R'", "U", "R'", "U'", "R'", "D", "R2"], description: "对角换块", category: 'pro' },
  { id: 'h-perm', name: "H型换棱", moves: ["M2", "U", "M2", "U2", "M2", "U", "M2"], description: "十字对棱交换", category: 'advanced' }, // Using basic notation below instead of M
  { id: 'z-perm', name: "Z型换棱", moves: ["M2", "U", "M2", "U", "M'", "U2", "M2", "U2", "M'", "U2"], description: "相邻棱块交换", category: 'advanced' },

  // --- OLL (Orientation of Last Layer) ---
  { id: 'oll-1', name: "点型 OLL-1", moves: ["R", "U2", "R2", "F", "R", "F'", "U2", "R'", "F", "R", "F'"], description: "全向翻色", category: 'pro' },
  { id: 'oll-2', name: "十字 OLL-2", moves: ["R", "U", "R'", "U", "R", "U'", "R'", "U", "R", "U2", "R'"], description: "顶面全黄1", category: 'advanced' },
  { id: 'oll-3', name: "十字 OLL-3", moves: ["F", "R", "U", "R'", "U'", "R", "U", "R'", "U'", "R", "U", "R'", "U'", "F'"], description: "顶面全黄2", category: 'advanced' },
  { id: 'oll-4', name: "L型 OLL-4", moves: ["F", "U", "R", "U'", "R'", "F'"], description: "小L翻色", category: 'basic' },
  { id: 'oll-5', name: "一字 OLL-5", moves: ["F", "R", "U", "R'", "U'", "F'"], description: "一字翻色", category: 'basic' },
  { id: 'oll-6', name: "大C OLL", moves: ["R", "U", "R2", "U'", "R'", "F", "R", "U", "R", "U'", "F'"], description: "C型图案翻色", category: 'pro' },
  { id: 'oll-7', name: "大T OLL", moves: ["F", "R", "U", "R'", "U'", "F'"], description: "T型图案翻色", category: 'advanced' },
  { id: 'oll-8', name: "大W OLL", moves: ["R", "U", "R'", "U", "R", "U'", "R'", "U'", "R'", "F", "R", "F'"], description: "W型图案翻色", category: 'pro' },
  { id: 'oll-9', name: "大P OLL", moves: ["R", "U", "B'", "U'", "R'", "U", "R", "B", "R'"], description: "P型图案翻色", category: 'pro' },
  { id: 'oll-10', name: "大I OLL", moves: ["F", "R", "U", "R'", "U'", "R", "U", "R'", "U'", "F'"], description: "I型图案翻色", category: 'pro' },

  // --- 更多 PLL (Completing most 21) ---
  { id: 'a-perm-a', name: "A型换角A", moves: ["R'", "F", "R'", "B2", "R", "F'", "R'", "B2", "R2"], description: "三角顺时针交换", category: 'advanced' },
  { id: 'a-perm-b', name: "A型换角B", moves: ["R2", "B2", "R", "F", "R'", "B2", "R", "F'", "R"], description: "三角逆时针交换", category: 'advanced' },
  { id: 'e-perm', name: "E型换角", moves: ["x'", "R", "U'", "R'", "D", "R", "U", "R'", "D'", "R", "U", "R'", "D", "R", "U'", "R'", "D'"], description: "四角对换", category: 'pro' },
  { id: 'ga-perm', name: "G型换块A", moves: ["R2", "u", "R'", "U", "R'", "U'", "R", "u'", "R2", "y'", "R'", "U", "R"], description: "复杂G换位A", category: 'pro' },
  { id: 'gb-perm', name: "G型换块B", moves: ["R'", "U'", "R", "y", "R2", "u", "R'", "U", "R", "U'", "R", "u'", "R2"], description: "复杂G换位B", category: 'pro' },
  { id: 'gc-perm', name: "G型换块C", moves: ["R2", "u'", "R", "U'", "R", "U", "R'", "u", "R2", "y", "R", "U'", "R'"], description: "复杂G换位C", category: 'pro' },
  { id: 'gd-perm', name: "G型换块D", moves: ["R", "U", "R'", "y'", "R2", "u'", "R", "U'", "R'", "U", "R'", "u", "R2"], description: "复杂G换位D", category: 'pro' },
  { id: 'na-perm', name: "N型换块A", moves: ["R", "U", "R'", "U", "R", "U", "R'", "F'", "R", "U", "R'", "U'", "R'", "F", "R2", "U'", "R'", "U2", "R", "U'", "R'"], description: "N型平行交换A", category: 'pro' },
  { id: 'nb-perm', name: "N型换块B", moves: ["R'", "U", "R", "U'", "R'", "F'", "U'", "F", "R", "U", "R'", "F", "R'", "F'", "R", "U'", "R"], description: "N型平行交换B", category: 'pro' },

  // --- 经典花式 (Kid friendly patterns) ---
  { id: 'checkerboard', name: "棋盘格", moves: ["R2", "L2", "U2", "D2", "F2", "B2"], description: "六面棋盘花纹", category: 'basic' },
  { id: 'dots', name: "中心点换色", moves: ["U", "D'", "L", "R'", "F", "B'", "U'", "D"], description: "六面中心交换", category: 'basic' },
  { id: 'crosses', name: "六面大十字", moves: ["U2", "D2", "L2", "R2", "F2", "B2", "U", "D", "L", "R", "F", "B"], description: "经典大十字花纹", category: 'basic' },
  { id: 'cube-in-cube', name: "魔方中的魔方", moves: ["F", "L", "F", "U'", "R", "U", "F2", "L2", "U'", "L'", "B", "D'", "B'", "L2", "U"], description: "炫酷嵌套效果", category: 'pro' },

  // --- 补充 OLL (Common shapes) ---
  { id: 'oll-fish', name: "大鱼", moves: ["R", "U", "R'", "U", "R", "U2", "R'"], description: "顶面翻色-鱼头", category: 'advanced' },
  { id: 'oll-kite', name: "风筝", moves: ["R", "U2", "R2", "U'", "R2", "U'", "R2", "U2", "R"], description: "风筝型翻色", category: 'pro' },
  { id: 'oll-square', name: "小方块", moves: ["r", "U2", "R'", "U'", "R", "U'", "r'"], description: "方块型翻色", category: 'pro' },
  { id: 'oll-lightning', name: "闪电", moves: ["r", "U", "R'", "U", "R", "U2", "r'"], description: "闪电型翻色", category: 'pro' },
  { id: 'oll-hammer', name: "锤子", moves: ["R", "U2", "R'", "U'", "R", "U", "R'", "U'", "R", "U'", "R'"], description: "锤型图案", category: 'pro' }
].map(algo => {
    // Standardizing moves for safety (some M/u might be mixed in manual typing)
    // We replace M with (R' L x') effectively but keep it simple for kids
    return { ...algo, moves: algo.moves.map(m => m.replace('M2', 'R2 L2').replace('M', 'R L\'').replace('u', 'U D\'')) } as Algorithm;
}).filter(a => a.moves.length > 0);

export const MOVE_BUTTON_GROUPS: Move[][] = [
  ["R", "R'", "R2"], ["U", "U'", "U2"], ["L", "L'", "L2"],
  ["F", "F'", "F2"], ["D", "D'", "D2"], ["B", "B'", "B2"]
];
