"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // === SCENE, CAMERA, RENDERER ===
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // === GLOBE GROUP (everything attaches to this) ===
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // === LIGHTING ===
    const ambientLight = new THREE.AmbientLight(0x334455, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 3, 5);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x4488cc, 0.3);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // === MAIN SPHERE ===
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0x050508,
      specular: 0x222233,
      shininess: 30,
      transparent: true,
      opacity: 0.95,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globe);

    // === ATMOSPHERE GLOW ===
    const atmosGeo = new THREE.SphereGeometry(1.02, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.15, 0.25, 0.45, 1.0) * intensity * 0.6;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosphere);

    // === WIREFRAME OVERLAY ===
    const wireGeo = new THREE.SphereGeometry(1.002, 36, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const wireframe = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireframe);

    // === LATITUDE LINES ===
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * (Math.PI / 180);
      const r = Math.sin(phi) * 1.003;
      const y = Math.cos(phi) * 1.003;
      const curve = new THREE.EllipseCurve(
        0,
        0,
        r,
        r,
        0,
        2 * Math.PI,
        false,
        0,
      );
      const points = curve.getPoints(80);
      const geo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, y, p.y)),
      );
      const mat = new THREE.LineBasicMaterial({
        color: 0x1a1a2e,
        transparent: true,
        opacity: 0.15,
      });
      const line = new THREE.Line(geo, mat);
      globeGroup.add(line);
    }

    // === RENDER LOOP ===
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      globeGroup.rotation.y += 0.002; // slow auto-rotate
      renderer.render(scene, camera);
    };

    animate();

    // === HANDLE RESIZE ===
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // === CLEANUP ===
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full" />;
}
