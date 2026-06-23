/* ============================================================
   TAQDEER MANPOWER — 3D animated globe
   A gold point-globe with navy/gold location markers and
   animated great-circle "deployment" arcs. Pure Three.js,
   no external textures required.
   ============================================================ */
import * as THREE from 'three';

const BRAND = {
  gold:  0xEEBE0D,
  goldS: 0xf6de86,
  blue:  0x274798,
  blueB: 0x3a63c9,
  navy:  0x0b1838,
};

// Key locations [lat, lon]
const DEPLOY = [
  [25.2, 55.3], [24.7, 46.7], [25.3, 51.5], [23.6, 58.5], [26.2, 50.6],
  [29.4, 47.9], [51.5, -0.1], [38.0, -97.0], [-33.9, 151.2],
  [52.2, 21.0], [44.8, 20.5], [44.4, 26.1],
];
const RECRUIT = [
  [20.6, 78.9], [30.4, 69.3], [23.7, 90.4], [28.4, 84.1], [7.9, 80.8],
  [12.9, 121.8], [26.8, 30.8], [1.4, 32.3], [9.1, 8.7], [0.0, 37.9],
];
// Source → destination flows (recruit hub → deploy hub)
const FLOWS = [
  [[20.6, 78.9], [25.2, 55.3]],   // India → UAE
  [[30.4, 69.3], [24.7, 46.7]],   // Pakistan → KSA
  [[12.9, 121.8], [25.3, 51.5]],  // Philippines → Qatar
  [[26.8, 30.8], [51.5, -0.1]],   // Egypt → UK
  [[20.6, 78.9], [38.0, -97.0]],  // India → USA
  [[23.7, 90.4], [-33.9, 151.2]], // Bangladesh → Australia
  [[9.1, 8.7],  [52.2, 21.0]],    // Nigeria → Poland
  [[28.4, 84.1], [26.2, 50.6]],   // Nepal → Bahrain
];

function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function fibonacciSphere(count, r) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const t = phi * i;
    pts.push(new THREE.Vector3(Math.cos(t) * rad * r, y * r, Math.sin(t) * rad * r));
  }
  return pts;
}

function createGlobe(canvas, opts = {}) {
  if (!canvas) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return null;
  }

  const R = 2;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, opts.distance || 6.2);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const root = new THREE.Group();
  root.rotation.z = -0.32;            // tilt
  root.rotation.x = 0.15;
  scene.add(root);

  // --- Core translucent sphere (gives the globe body) ---
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 64, 64),
    new THREE.MeshBasicMaterial({ color: BRAND.navy, transparent: true, opacity: 0.55 })
  );
  root.add(core);

  // --- Gold point cloud surface ---
  const surfacePts = fibonacciSphere(opts.density || 2600, R);
  const sGeo = new THREE.BufferGeometry().setFromPoints(surfacePts);
  const sMat = new THREE.PointsMaterial({ color: BRAND.gold, size: 0.022, transparent: true, opacity: 0.85, sizeAttenuation: true });
  root.add(new THREE.Points(sGeo, sMat));

  // --- Faint blue lat/long wire shell ---
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(R * 1.002, 22, 16)),
    new THREE.LineBasicMaterial({ color: BRAND.blueB, transparent: true, opacity: 0.10 })
  );
  root.add(wire);

  // --- Atmosphere glow (back-side shell) ---
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.18, 48, 48),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      uniforms: { c: { value: new THREE.Color(BRAND.blueB) } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vN; uniform vec3 c; void main(){ float i = pow(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(c, clamp(i,0.0,1.0)*0.9); }`,
    })
  );
  root.add(glow);

  // --- Location markers ---
  function addMarker(lat, lon, color, size) {
    const pos = latLonToVec3(lat, lon, R * 1.01);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(size, 12, 12),
      new THREE.MeshBasicMaterial({ color })
    );
    dot.position.copy(pos);
    root.add(dot);
    // pulsing halo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.6, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.position.copy(pos);
    halo.userData.base = size * 1.6;
    halo.userData.phase = Math.random() * Math.PI * 2;
    root.add(halo);
    return halo;
  }
  const halos = [];
  DEPLOY.forEach(([la, lo]) => halos.push(addMarker(la, lo, BRAND.goldS, 0.028)));
  RECRUIT.forEach(([la, lo]) => halos.push(addMarker(la, lo, BRAND.blueB, 0.026)));

  // --- Animated great-circle arcs ---
  const arcs = [];
  function addArc([la1, lo1], [la2, lo2]) {
    const start = latLonToVec3(la1, lo1, R * 1.01);
    const end   = latLonToVec3(la2, lo2, R * 1.01);
    const dist  = start.distanceTo(end);
    const mid = start.clone().add(end).multiplyScalar(0.5).setLength(R + dist * 0.55);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curve.getPoints(60);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: BRAND.gold, transparent: true, opacity: 0.28 }));
    root.add(line);

    // travelling pulse
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 10),
      new THREE.MeshBasicMaterial({ color: BRAND.goldS, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    root.add(pulse);
    arcs.push({ curve, pulse, t: Math.random(), speed: 0.12 + Math.random() * 0.12 });
  }
  FLOWS.forEach(f => addArc(f[0], f[1]));

  // --- Starfield (background depth) ---
  if (opts.stars !== false) {
    const starGeo = new THREE.BufferGeometry();
    const N = 600, arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(14 + Math.random() * 16);
      arr[i*3] = v.x; arr[i*3+1] = v.y; arr[i*3+2] = v.z;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xafc0ea, size: 0.05, transparent: true, opacity: 0.5 })));
  }

  // --- Interaction (parallax) ---
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  const onMove = (e) => {
    const x = (e.touches ? e.touches[0].clientX : e.clientX) / window.innerWidth - 0.5;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) / window.innerHeight - 0.5;
    targetX = y * 0.4; targetY = x * 0.5;
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });

  // --- Resize ---
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // --- Render loop ---
  const clock = new THREE.Clock();
  let running = true;
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();

    root.rotation.y += 0.0016 * (opts.spin || 1);
    curX += (targetX - curX) * 0.05;
    curY += (targetY - curY) * 0.05;
    root.rotation.x = 0.15 + curX;
    scene.rotation.y = curY * 0.4;

    // pulsing halos
    for (const h of halos) {
      const s = 1 + Math.sin(t * 2.2 + h.userData.phase) * 0.35;
      h.scale.setScalar(s);
      h.material.opacity = 0.32 - (s - 1) * 0.28;
    }
    // moving arc pulses
    for (const a of arcs) {
      a.t += a.speed * 0.016;
      if (a.t > 1) a.t -= 1;
      a.curve.getPoint(a.t, a.pulse.position);
    }
    renderer.render(scene, camera);
  }
  tick();

  return {
    destroy() { running = false; ro.disconnect(); io.disconnect();
      window.removeEventListener('mousemove', onMove); window.removeEventListener('touchmove', onMove);
      renderer.dispose(); },
  };
}

// --- Boot both globes ---
function boot() {
  createGlobe(document.getElementById('globe-canvas'),   { distance: 6.0, density: 2800, spin: 1 });
  createGlobe(document.getElementById('globe-canvas-2'), { distance: 6.6, density: 2200, spin: 0.7, stars: false });
}
if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
