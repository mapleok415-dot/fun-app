
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
  
  // Animation lock to prevent double execution
  const activeAnimationRef = useRef<string | null>(null);

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
    controls.dampingFactor = 0.1;

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dLight.position.set(10, 15, 10);
    scene.add(dLight);

    const cubeGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mats = Array(6).fill(0).map(() => new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.1,
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

  // Update sticker colors based on state
  useEffect(() => {
    // Only update colors when not in the middle of a rotation
    if (!sceneRef.current || activeAnimationRef.current) return;
    
    cubesRef.current.forEach((cube) => {
      const p = cube.position;
      const mats = cube.material as THREE.MeshStandardMaterial[];
      mats.forEach(m => m.color.set(0x1a1a1a));
      
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      const z = Math.round(p.z);
      
      // Face materials Order: 0:Right, 1:Left, 2:Up, 3:Down, 4:Front, 5:Back
      if (y === 1) mats[2].color.set(COLORS[cubeState[Face.U][(z + 1) * 3 + (x + 1)]]);
      if (y === -1) mats[3].color.set(COLORS[cubeState[Face.D][(1 - z) * 3 + (x + 1)]]);
      if (x === -1) mats[1].color.set(COLORS[cubeState[Face.L][(1 - y) * 3 + (z + 1)]]);
      if (x === 1) mats[0].color.set(COLORS[cubeState[Face.R][(1 - y) * 3 + (1 - z)]]);
      if (z === 1) mats[4].color.set(COLORS[cubeState[Face.F][(1 - y) * 3 + (x + 1)]]);
      if (z === -1) mats[5].color.set(COLORS[cubeState[Face.B][(1 - y) * 3 + (1 - x)]]);
    });
  }, [cubeState]);

  // Handle animation
  useEffect(() => {
    if (isAnimating && pendingMove && sceneRef.current && !activeAnimationRef.current) {
      activeAnimationRef.current = pendingMove;
      
      const face = pendingMove[0] as Face;
      const suffix = pendingMove.substring(1);
      
      const group = new THREE.Group();
      sceneRef.current.add(group);
      
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
        
        if (match) {
          group.add(c);
          affected.push(c);
        }
      });

      // Standard coordinate rotation angles
      let targetAngle = (face === 'U' || face === 'R' || face === 'F') ? -Math.PI / 2 : Math.PI / 2;
      if (suffix === "'") targetAngle *= -1;
      if (suffix === "2") targetAngle *= 2;

      const startTime = performance.now();
      
      const animateFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationSpeed, 1);
        
        // Simple cubic ease out
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentAngle = targetAngle * ease;
        
        group.rotation.set(0, 0, 0);
        if (face === 'U' || face === 'D') group.rotation.y = currentAngle;
        else if (face === 'L' || face === 'R') group.rotation.x = currentAngle;
        else group.rotation.z = currentAngle;

        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        } else {
          // Finalize the rotation and clean up
          group.updateMatrixWorld();
          affected.forEach(c => {
            c.applyMatrix4(group.matrixWorld);
            sceneRef.current?.add(c);
            // Snap to exact integers to avoid floating point drift
            c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
            // Reset local rotation after world matrix application
            c.rotation.set(0, 0, 0);
          });
          sceneRef.current?.remove(group);
          
          activeAnimationRef.current = null;
          setIsAnimating(false);
          onAnimationComplete();
        }
      };

      requestAnimationFrame(animateFrame);
    }
  }, [isAnimating, pendingMove, animationSpeed, onAnimationComplete, setIsAnimating]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default Cube3D;
