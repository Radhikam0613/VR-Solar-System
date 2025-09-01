// --- billboard component ---
AFRAME.registerComponent('billboard', {
  init() {
    this.cam = document.querySelector('[camera]');
    this.tmp = new THREE.Vector3();
  },
  tick() {
    if (!this.cam) return;
    this.cam.object3D.getWorldPosition(this.tmp);
    this.el.object3D.lookAt(this.tmp);
  }
});

// --- elliptical-orbit component ---
AFRAME.registerComponent('elliptical-orbit', {
  schema: {
    a: { type: 'number' },
    b: { type: 'number' },
    speed: { type: 'number' },
    centerX: { type: 'number', default: 0 },
    centerY: { type: 'number', default: 1.25 },
    centerZ: { type: 'number', default: -5 }
  },
  init() {
    this.angle = Math.random() * Math.PI * 2;
    this.el.object3D.position.set(
      this.data.centerX + this.data.a * Math.cos(this.angle),
      this.data.centerY,
      this.data.centerZ + this.data.b * Math.sin(this.angle)
    );
  },
  tick(time, timeDelta) {
    this.angle += (timeDelta / this.data.speed) * 2 * Math.PI;
    const x = this.data.a * Math.cos(this.angle);
    const z = this.data.b * Math.sin(this.angle);
    this.el.object3D.position.set(
      this.data.centerX + x,
      this.data.centerY,
      this.data.centerZ + z
    );
  }
});

// --- ellipse-ring component ---
AFRAME.registerComponent('ellipse-ring', {
  schema: {
    a: { type: 'number' },
    b: { type: 'number' },
    segments: { type: 'int', default: 128 },
    color: { type: 'color', default: '#151515ff' }
  },
  init() {
    const a = this.data.a;
    const b = this.data.b;
    const seg = this.data.segments;
    const pts = [];
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      pts.push(new THREE.Vector3(a * Math.cos(t), 0, b * Math.sin(t)));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({ color: new THREE.Color(this.data.color) });
    const line = new THREE.LineLoop(geometry, material);
    this.el.setObject3D('ellipse', line);
  },
  remove() {
    this.el.removeObject3D('ellipse');
  }
});

// --- Create planets and asteroid belt ---
document.addEventListener('DOMContentLoaded', () => {
  const solarSystem = document.querySelector('#solar-system');
  const scene = document.querySelector('a-scene');
  if (!solarSystem) {
    console.error('No #solar-system element found.');
    return;
  }

  const planets = [
    { name: 'Mercury', radius: 1, distance: 8, ecc: 0.2056, texture: 'mercury.jpeg', speed: 3000 },
    { name: 'Venus', radius: 1.4, distance: 10.5, ecc: 0.0067, texture: 'venus.jpeg', speed: 6000 },
    { name: 'Earth', radius: 1.9, distance: 14.5, ecc: 0.0167, texture: 'earth.jpeg', speed: 9000 },
    { name: 'Mars', radius: 1.4, distance: 17, ecc: 0.0934, texture: 'mars.jpeg', speed: 12000 },
    { name: 'Jupiter', radius: 2.1, distance: 24, ecc: 0.0489, texture: 'jupiter.jpeg', speed: 15000 },
    { name: 'Saturn', radius: 1.4, distance: 28, ecc: 0.0565, texture: 'saturn.jpeg', speed: 20000 },
    { name: 'Uranus', radius: 1.6, distance: 31, ecc: 0.0460, texture: 'uranus.jpeg', speed: 25000 },
    { name: 'Neptune', radius: 1.7, distance: 35, ecc: 0.0090, texture: 'neptune.jpeg', speed: 30000 }
  ];

  const SUN_CENTER = { x: 0, y: 1.25, z: -5 };

  planets.forEach(planet => {
    const a = planet.distance;
    const e = planet.ecc || 0;
    const b = a * Math.sqrt(Math.max(0, 1 - e * e));

    const planetEntity = document.createElement('a-entity');
    planetEntity.setAttribute('elliptical-orbit',
      `a: ${a}; b: ${b}; speed: ${planet.speed}; centerX: ${SUN_CENTER.x}; centerY: ${SUN_CENTER.y}; centerZ: ${SUN_CENTER.z}`);

    const sphere = document.createElement('a-sphere');
    sphere.setAttribute('radius', planet.radius);
    sphere.setAttribute('src', `planet_textures/${planet.texture}`);
    planetEntity.appendChild(sphere);

    const label = document.createElement('a-text');
    label.setAttribute('value', planet.name);
    label.setAttribute('align', 'center');
    label.setAttribute('color', '#ffffffff');
    label.setAttribute('width', '20');
    label.setAttribute('position', `0 ${planet.radius + 0.8} 0`);
    label.setAttribute('billboard', '');
    label.setAttribute('side', 'double');
    planetEntity.appendChild(label);

    if (planet.name.toLowerCase() === 'saturn') {
      const satRing = document.createElement('a-ring');
      const inner = planet.radius * 1.9;
      const outer = planet.radius * 3;
      satRing.setAttribute('radius-inner', inner);
      satRing.setAttribute('radius-outer', outer);
      satRing.setAttribute('rotation', '-90 0 0');
      satRing.setAttribute('material', 'color: #585858ff; opacity: 0.6; transparent: true; side: double');
      satRing.setAttribute('animation', 'property: rotation; to: -90 360 0; loop: true; dur: 22000; easing: linear');
      planetEntity.appendChild(satRing);
    }

    solarSystem.appendChild(planetEntity);

    const ringEntity = document.createElement('a-entity');
    ringEntity.setAttribute('ellipse-ring', `a: ${a}; b: ${b}; segments: 160; color: #888`);
    ringEntity.setAttribute('position', `${SUN_CENTER.x} ${SUN_CENTER.y} ${SUN_CENTER.z}`);
    solarSystem.appendChild(ringEntity);
  });

// --- Asteroid Belt ---
const asteroidCount = 200;
const aMin = 19; // semi-major axis minimum (just outside Mars)
const aMax = 21; // semi-major axis maximum (just inside Jupiter)
const eccentricity = 0.05; // small eccentricity for realism

// 1. Create the Dark Transparent Ring for the Asteroid Belt
const asteroidRing = document.createElement('a-ring');
asteroidRing.setAttribute('radius-inner', aMin);
asteroidRing.setAttribute('radius-outer', aMax);
asteroidRing.setAttribute('rotation', '-90 0 0'); // flat on XZ plane
asteroidRing.setAttribute('material', 'color: #6e5151ff; opacity: 0.3; transparent: true; side: double;'); // Dark and semi-transparent
asteroidRing.setAttribute('position', '0 1.24 -5'); // Align with solar system center
solarSystem.appendChild(asteroidRing);

// 2. Add Asteroids on top of the ring
for (let i = 0; i < asteroidCount; i++) {
  const asteroid = document.createElement('a-sphere');
  asteroid.setAttribute('color', '#111111'); // very dark gray
  asteroid.setAttribute('material', 'opacity: 0.6; transparent: true;'); // semi-transparent asteroids
  asteroid.setAttribute('radius', (Math.random() * 0.15 + 0.05).toFixed(2));

  // Random semi-major axis between Mars and Jupiter
  const a = aMin + Math.random() * (aMax - aMin);
  const b = a * Math.sqrt(1 - eccentricity * eccentricity);

  // Even angle distribution with slight randomness
  const baseAngle = (i / asteroidCount) * 2 * Math.PI;
  const randomOffset = (Math.random() - 0.5) * (Math.PI / asteroidCount) * 10;
  const angle = baseAngle + randomOffset;

  const x = a * Math.cos(angle);
  const z = b * Math.sin(angle);

  asteroid.setAttribute('position', `${x} 1.26 ${z}`); // slightly above the ring

  // Optional: add slow orbit for realism
  asteroid.setAttribute(
    'elliptical-orbit',
    `a: ${a}; b: ${b}; speed: ${60000 + Math.random() * 20000}; centerX: 0; centerY: 1.25; centerZ: -5`
  );

  solarSystem.appendChild(asteroid);
}


});
