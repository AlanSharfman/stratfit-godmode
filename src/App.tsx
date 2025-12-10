import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const Mountain: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(width, height);
    renderer.setClearColor("#111111");
    mountRef.current.appendChild(renderer.domElement);

    camera.position.set(0, 2.5, 5);

    const geometry = new THREE.PlaneGeometry(6, 3, 50, 50);
    const material = new THREE.MeshBasicMaterial({
      color: "#00f2ff",
      wireframe: true,
    });

    const mountain = new THREE.Mesh(geometry, material);
    mountain.rotation.x = -Math.PI / 2.5;
    scene.add(mountain);

    const animate = () => {
      requestAnimationFrame(animate);
      mountain.rotation.z += 0.0008;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
};

export default Mountain;
