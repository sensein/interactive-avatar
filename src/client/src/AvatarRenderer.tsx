import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export interface VisemeData {
  mouthCues: {
    start: number;
    end: number;
    value: string;
  }[];
}

interface AvatarRendererProps {
  avatarUrl: string;
  animationUrl?: string;
  visemeData?: VisemeData;
  playAnimation?: boolean;
  playViseme?: boolean;
}

const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  avatarUrl,
  animationUrl,
  visemeData,
  playAnimation = false,
  playViseme = false,
}) => {
  return (
    <Canvas shadows>
      <AvatarScene
        avatarUrl={avatarUrl}
        animationUrl={animationUrl}
        visemeData={visemeData}
        playAnimation={playAnimation}
        playViseme={playViseme}
      />
    </Canvas>
  );
};

interface AvatarSceneProps {
  avatarUrl: string;
  animationUrl?: string;
  visemeData?: VisemeData;
  playAnimation?: boolean;
  playViseme?: boolean;
}

const AvatarScene: React.FC<AvatarSceneProps> = ({
  avatarUrl,
  animationUrl,
  visemeData,
  playAnimation = false,
  playViseme = false,
}) => {
  // Refs and state
  const avatarRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const morphTargetMeshesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const clockRef = useRef(new THREE.Clock());
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  // Initialize the scene and load the avatar
  useEffect(() => {
    if (avatarUrl) {
      initializeScene();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl]);

  const initializeScene = () => {
    const loader = new GLTFLoader();
    loader.load(
      avatarUrl,
      (gltf: GLTF) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
              if (
                ['Wolf3D_Avatar', 'Wolf3D_Head', 'Wolf3D_Teeth', 'Wolf3D_Beard'].includes(
                  mesh.name
                )
              ) {
                morphTargetMeshesRef.current[mesh.name] = mesh;
              }
            }
          }
        });
        avatarRef.current = model;
        mixerRef.current = new THREE.AnimationMixer(model);

        // Load idle animation
        loader.load('/animations/idle/F_Standing_Idle_001.glb', (idleGltf) => {
          const idleAnimation = idleGltf.animations[0];
          idleActionRef.current = mixerRef.current!.clipAction(idleAnimation);
          idleActionRef.current.play();
          idleActionRef.current.loop = THREE.LoopRepeat;
          currentActionRef.current = idleActionRef.current;

          setAvatarLoaded(true);
        });
      },
      undefined,
      (error) => {
        console.error('Error loading avatar:', error);
      }
    );
  };

  // Handle playing full-body animations
  useEffect(() => {
    if (playAnimation && animationUrl && mixerRef.current) {
      playFullBodyAnimation(animationUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playAnimation]);

  const playFullBodyAnimation = (animationUrl: string) => {
    const loader = new GLTFLoader();
    loader.load(
      animationUrl,
      (gltf) => {
        const animationClip = gltf.animations[0];
        const newAction = mixerRef.current!.clipAction(animationClip);

        newAction.reset();
        newAction.play();
        newAction.clampWhenFinished = true;
        newAction.loop = THREE.LoopOnce;

        if (currentActionRef.current && currentActionRef.current !== newAction) {
          currentActionRef.current.crossFadeTo(newAction, 0.5, false);
        }
        currentActionRef.current = newAction;

        const onFinished = () => {
          if (idleActionRef.current) {
            currentActionRef.current = idleActionRef.current;
            idleActionRef.current.reset().fadeIn(0.5).play();
          }
          mixerRef.current!.removeEventListener('finished', onFinished);
        };

        mixerRef.current!.addEventListener('finished', onFinished);
      },
      undefined,
      (error) => {
        console.error('Error loading animation:', error);
      }
    );
  };

  // Lip Sync Implementation
  const [isLipSyncPlaying, setIsLipSyncPlaying] = useState(false); // Added useState to imports
  const lipsyncStartTimeRef = useRef<number>(0);
  const currentCueRef = useRef<any>(null);
  const targetValuesRef = useRef<{ [key: string]: number }>({});
  const currentValuesRef = useRef<{ [key: string]: number }>({});
  const lerpFactorRef = useRef<number>(0);

  // Viseme mapping
  const visemeToBlendShape: { [key: string]: string[] } = {
    X: ['viseme_sil'],
    A: ['viseme_PP'],
    B: ['viseme_kk'],
    C: ['viseme_I'],
    D: ['viseme_aa'],
    E: ['viseme_O'],
    F: ['viseme_U'],
    G: ['viseme_FF'],
    H: ['viseme_TH'],
  };

  // List of visemes that require teeth movement
  const teethMovingVisemes = ['viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U'];

  const resetToNeutralExpression = () => {
    const shapes = Object.values(visemeToBlendShape).flat();
    const values = new Array(shapes.length).fill(0);
    setBlendShapes(shapes, values);
    currentValuesRef.current = Object.fromEntries(shapes.map((shape) => [shape, 0]));
    targetValuesRef.current = { ...currentValuesRef.current };
    setIsLipSyncPlaying(false);
  };

  const setBlendShapes = (shapes: string[], values: number[]) => {
    Object.entries(morphTargetMeshesRef.current).forEach(([meshName, mesh]) => {
      if (meshName === 'Wolf3D_Teeth') {
        // For teeth, only use 'mouthOpen'
        const mouthOpenIndex = mesh.morphTargetDictionary?.['mouthOpen'];
        if (mouthOpenIndex !== undefined && mesh.morphTargetInfluences) {
          let mouthOpenValue = 0;
          shapes.forEach((shape, index) => {
            if (teethMovingVisemes.includes(shape)) {
              mouthOpenValue = Math.max(mouthOpenValue, values[index]);
            }
          });
          mesh.morphTargetInfluences[mouthOpenIndex] = mouthOpenValue * 1;
        } else {
          console.warn("'mouthOpen' morph target not found for teeth");
        }
      } else {
        // For other meshes, apply all visemes normally
        shapes.forEach((shape, index) => {
          const morphIndex = mesh.morphTargetDictionary?.[shape];
          if (morphIndex !== undefined && mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[morphIndex] = values[index] * 0.6;
          }
        });
      }
    });
  };

  const animateLipsync = (delta: number) => {
    if (!visemeData || !isLipSyncPlaying) return;

    const currentTime = performance.now() / 1000 - lipsyncStartTimeRef.current;
    const currentCue = visemeData.mouthCues.find(
      (cue) => currentTime >= cue.start && currentTime < cue.end
    );

    if (currentCue && currentCue !== currentCueRef.current) {
      const blendShapes = visemeToBlendShape[currentCue.value];
      if (blendShapes) {
        Object.values(visemeToBlendShape)
          .flat()
          .forEach((shape) => {
            targetValuesRef.current[shape] = blendShapes.includes(shape) ? 1 : 0;
          });
      }
      currentCueRef.current = currentCue;
      lerpFactorRef.current = 0;
    }

    // Interpolate between current and target values
    lerpFactorRef.current = Math.min(lerpFactorRef.current + delta * 5, 1);
    const shapes = Object.keys(targetValuesRef.current);
    const values = shapes.map((shape) => {
      const current = currentValuesRef.current[shape] || 0;
      const target = targetValuesRef.current[shape] || 0;
      const value = THREE.MathUtils.lerp(current, target, lerpFactorRef.current);
      currentValuesRef.current[shape] = value;
      return value;
    });

    setBlendShapes(shapes, values);
  };

  useEffect(() => {
    if (playViseme && visemeData) {
      startLipSync();
    } else {
      resetToNeutralExpression();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playViseme, visemeData]);

  const startLipSync = () => {
    lipsyncStartTimeRef.current = performance.now() / 1000;
    setIsLipSyncPlaying(true);
  };

  useFrame(() => {
    const delta = clockRef.current.getDelta();

    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    if (isLipSyncPlaying) {
      animateLipsync(delta);
    }
  });

  // Rendering and camera adjustments
  const AvatarModel: React.FC = () => {
    if (!avatarLoaded || !avatarRef.current) return null;

    return <primitive object={avatarRef.current} scale={1.5} position={[0, -1, 0]} />;
  };

  // Camera position variables
  const cameraPosition: [number, number, number] = [0, 1.636, 1.154]; // Adjust camera as u like
  const cameraTarget: [number, number, number] = [0, 1.46, 0]; // Focus camera on point

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(new THREE.Vector3(...cameraTarget));
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={cameraPosition} fov={40} />
      {/* Lock the camera */}
      <color attach="background" args={['#f0f0f0']} />

      {/* Improved Lighting Setup */}
      <hemisphereLight intensity={0.6} color="#ffffff" groundColor="#b9b9b9" />
      <directionalLight
        position={[5, 10, 7.5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Avatar Model */}
      <AvatarModel />

      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>

      {/* Environment */}
      <Environment preset="sunset" />
    </>
  );
};

export default AvatarRenderer;
