"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { races, Race } from "@/data/races";
import { latLngToPos, createArcPoints } from "@/utils/globe";

interface GlobeProps {
  onMarkerHover: (race: Race | null, x: number, y: number) => void;
}

export default function Globe({ onMarkerHover }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverCallbackRef = useRef(onMarkerHover);

  useEffect(() => {
    hoverCallbackRef.current = onMarkerHover;
  }, [onMarkerHover]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    // === GLOBE GROUP ===
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

    // NEW === INTERACTION STATE ===
    // === RACE MARKERS ===

    const markerMeshes: {
      ring: THREE.Mesh;
      dot: THREE.Mesh;
      pulse: THREE.Mesh;
      pos: THREE.Vector3;
      baseOpacity: number;
    }[] = [];

    races.forEach((race) => {
      const pos = latLngToPos(race.lat, race.lng, 1.006);

      // Outer glow ring
      const ringGeo = new THREE.RingGeometry(0.012, 0.018, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xe10600,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(ring);

      // Inner dot
      const dotGeo = new THREE.CircleGeometry(0.007, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xe10600,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(dot);

      // Pulse sphere
      const pulseGeo = new THREE.SphereGeometry(0.004, 8, 8);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0xe10600,
        transparent: true,
        opacity: 0.7,
      });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.position.copy(pos);
      globeGroup.add(pulse);

      markerMeshes.push({ ring, dot, pulse, pos, baseOpacity: 0.3 });
    });

    // === RACE PATHS ===
    interface PathLine {
      line: THREE.Line;
      targetOpacity: number;
      delay: number;
    }

    const pathLines: PathLine[] = [];

    for (let i = 0; i < races.length - 1; i++) {
      const startPos = latLngToPos(races[i].lat, races[i].lng);
      const endPos = latLngToPos(races[i + 1].lat, races[i + 1].lng);
      const arcPoints = createArcPoints(startPos, endPos);

      const geo = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const mat = new THREE.LineBasicMaterial({
        color: 0xe10600,
        transparent: true,
        opacity: 0.0,
      });
      const line = new THREE.Line(geo, mat);
      globeGroup.add(line);

      pathLines.push({
        line,
        targetOpacity: 0.18,
        delay: i * 0.08,
      });
    }

    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    const rotationVelocity = { x: 0, y: 0 };
    let targetRotationX = 0.3;
    let targetRotationY = 0;
    let autoRotate = true;
    let hoveredIndex = -1;

    // NEW === MOUSE EVENTS ===
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
      autoRotate = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - previousMouse.x;
        const dy = e.clientY - previousMouse.y;
        rotationVelocity.y += dx * 0.003;
        rotationVelocity.x += dy * 0.002;
        previousMouse = { x: e.clientX, y: e.clientY };
        return;
      }

      let found = false;

      for (let i = 0; i < markerMeshes.length; i++) {
        const m = markerMeshes[i];
        const worldPos = new THREE.Vector3();
        m.pulse.getWorldPosition(worldPos);
        const screenPos = worldPos.clone().project(camera);

        const sx = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

        const dist = Math.hypot(e.clientX - sx, e.clientY - sy);

        if (dist < 20 && screenPos.z < 1) {
          (m.ring.material as THREE.MeshBasicMaterial).opacity = 0.8;
          (m.dot.material as THREE.MeshBasicMaterial).opacity = 1;
          m.pulse.scale.set(2.5, 2.5, 2.5);

          let tx = e.clientX + 20;
          let ty = e.clientY - 20;
          if (tx + 260 > window.innerWidth) tx = e.clientX - 270;
          if (ty + 150 > window.innerHeight) ty = e.clientY - 150;

          hoveredIndex = i;
          hoverCallbackRef.current(races[i], tx, ty);
          found = true;
          break;
        }
      }

      if (!found) {
        hoveredIndex = -1;
        markerMeshes.forEach((m) => {
          (m.ring.material as THREE.MeshBasicMaterial).opacity = m.baseOpacity;
          (m.dot.material as THREE.MeshBasicMaterial).opacity = 0.9;
          m.pulse.scale.set(1, 1, 1);
        });
        hoverCallbackRef.current(null, 0, 0);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // NEW === TOUCH EVENTS ===
    let touchStart: { x: number; y: number } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        autoRotate = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !touchStart || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      rotationVelocity.y += dx * 0.003;
      rotationVelocity.x += dy * 0.002;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
      touchStart = null;
    };

    // NEW === ZOOM ===
    const onWheel = (e: WheelEvent) => {
      camera.position.z += e.deltaY * 0.001;
      camera.position.z = Math.max(1.8, Math.min(5, camera.position.z));
    };

    // NEW === ATTACH EVENTS ===
    const el = container;
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: true });

    // === RENDER LOOP (UPDATED) ===
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // NEW: auto-rotate adds tiny velocity each frame
      if (autoRotate) {
        rotationVelocity.y += 0.0002;
      }

      // NEW: apply velocity to target rotation
      targetRotationY += rotationVelocity.y;
      targetRotationX += rotationVelocity.x;

      // NEW: clamp vertical rotation so you can't flip the globe
      targetRotationX = Math.max(-1.2, Math.min(1.2, targetRotationX));

      // NEW: damping — this is what makes it feel smooth
      rotationVelocity.x *= 0.92;
      rotationVelocity.y *= 0.92;

      // NEW: lerp actual rotation toward target (smooth easing)
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.06;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.06;

      // Marker pulse animation
      const time = performance.now() * 0.001;
      markerMeshes.forEach((m, i) => {
        if (i === hoveredIndex) return; // skip — hover is controlling this one

        const pulse = 0.7 + 0.3 * Math.sin(time * 2 + i * 0.5);
        (m.ring.material as THREE.MeshBasicMaterial).opacity =
          m.baseOpacity * pulse;

        const s = 1 + 0.2 * Math.sin(time * 3 + i * 0.7);
        m.pulse.scale.set(s, s, s);
      });

      // Path fade-in animation
      pathLines.forEach((p) => {
        const progress = Math.max(0, Math.min(1, (time - p.delay) * 0.5));
        (p.line.material as THREE.LineBasicMaterial).opacity =
          p.targetOpacity * progress;
      });
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

    // === CLEANUP (UPDATED) ===
    return () => {
      window.removeEventListener("resize", handleResize);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mouseleave", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [onMarkerHover]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full cursor-grab active:cursor-grabbing"
    />
  );
}
