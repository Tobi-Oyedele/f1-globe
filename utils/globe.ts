import * as THREE from "three";

export function latLngToPos(
  lat: number,
  lng: number,
  radius: number = 1.005,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function createArcPoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments: number = 50,
  altitude: number = 0.035,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;

    // Blend between start and end
    const point = new THREE.Vector3().lerpVectors(start, end, t);

    // Push point back onto sphere surface
    point.normalize();

    // Add arc height — sin gives us the curve shape
    const elevation = 1.005 + altitude * Math.sin(Math.PI * t);
    point.multiplyScalar(elevation);

    points.push(point);
  }

  return points;
}
