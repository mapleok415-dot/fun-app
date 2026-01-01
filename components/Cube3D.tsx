
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CubeState, Move, Face } from '../types';
import { COLORS } from '../constants';

interface Cube3DProps {
  cubeState: CubeState;
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
  onAnimationComplete: () => void;
  pendingMove?: Move;
  animationSpeed: number;
}

const Cube3D: React.FC<Cube3DProps> = ({ 
  cubeState, 
  isAnimating, 
  setIsAnimating, 
  onAnimationComplete,
  pendingMove,
  animationSpeed
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(6, 5, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dLight.position.set(10, 15, 10);
    scene.add(dLight);

    const cubeGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mats = Array(6).fill(0).map(() => new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            roughness: 0.2,
            metalness: 0.1 
          }));
          const cube = new THREE.Mesh(cubeGeo, mats);
          cube.position.set(x, y, z);
          scene.add(cube);
          cubesRef.current.push(cube);
        }
      }
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => { mountRef.current?.removeChild(renderer.domElement); };
  }, []);

  // Sync Sticker Colors using fixed indexing to match logically unfolded cube
  useEffect(() => {
    if (!sceneRef.current) return;
    cubesRef.current.forEach((cube) => {
      const p = cube.position;
      const mats = cube.material as THREE.MeshStandardMaterial[];
      mats.forEach(m => m.color.set(0x111111));
      
      const rx = Math.round(p.x);
      const ry = Math.round(p.y);
      const rz = Math.round(p.z);
      
      // Standard Cube Mapping to Array Index 0-8
      // Indexing rule: row-major from top-left of the face
      if (ry === 1) mats[2].color.set(COLORS[cubeState[Face.U][(1 - rz) * 3 + (rx + 1)]]);
      if (ry === -1) mats[3].color.set(COLORS[cubeState[Face.D][(rz + 1) * 3 + (rx + 1)]]);
      if (rx === -1) mats[1].color.set(COLORS[cubeState[Face.L][(1 - ry) * 3 + (1 - rz)]]);
      if (rx === 1) mats[0].color.set(COLORS[cubeState[Face.R][(1 - ry) * 3 + (rz + 1)]]);
      if (rz === 1) mats[4].color.set(COLORS[cubeState[Face.F][(1 - ry) * 3 + (rx + 1)]]);
      if (rz === -1) mats[5].color.set(COLORS[cubeState[Face.B][(1 - ry) * 3 + (1 - rx)]]);
    });
  }, [cubeState]);

  useEffect(() => {
    if (isAnimating && pendingMove && sceneRef.current) {
      const group = new THREE.Group();
      sceneRef.current.add(group);
      const face = pendingMove[0] as Face;
      const suffix = pendingMove.substring(1);
      
      const affected: THREE.Mesh[] = [];
      cubesRef.current.forEach(c => {
        const p = c.position;
        let match = false;
        if (face === 'U' && p.y > 0.5) match = true;
        if (face === 'D' && p.y < -0.5) match = true;
        if (face === 'L' && p.x < -0.5) match = true;
        if (face === 'R' && p.x > 0.5) match = true;
        if (face === 'F' && p.z > 0.5) match = true;
        if (face === 'B' && p.z < -0.5) match = true;
        if (match) { group.add(c); affected.push(c); }
      });

      let angle = (face === 'U' || face === 'R' || face === 'F') ? -Math.PI / 2 : Math.PI / 2;
      if (suffix === "'") angle *= -1;
      if (suffix === "2") angle *= 2;

      const start = performance.now();
      const step = (t: number) => {
        const elapsed = t - start;
        const progress = Math.min(elapsed / animationSpeed, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        group.rotation.set(0,0,0);
        if (face === 'U' || face === 'D') group.rotation.y = angle * ease;
        else if (face === 'L' || face === 'R') group.rotation.x = angle * ease;
        else group.rotation.z = angle * ease;

        if (progress < 1) requestAnimationFrame(step);
        else {
          group.updateMatrixWorld();
          affected.forEach(c => {
            c.applyMatrix4(group.matrixWorld);
            sceneRef.current?.add(c);
            c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
            c.rotation.set(0,0,0);
          });
          sceneRef.current?.remove(group);
          setIsAnimating(false);
          onAnimationComplete();
        }
      };
      requestAnimationFrame(step);
    }
  }, [isAnimating, pendingMove, animationSpeed]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default Cube3D;
