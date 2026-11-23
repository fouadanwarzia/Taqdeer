/* ============================================================================
   Taqdeer V8 · the two-tone globe
   One scene, rendered twice per frame with a scissor at the seam: blue points
   on the limestone SOURCE half, gold points on the navy SITE half. The
   deployment arcs therefore change colour as they cross the divider, the
   same way the trade words do further down the page.
   ========================================================================== */
import * as THREE from 'three';

const canvas = document.getElementById('globe');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phoneMQ = matchMedia('(max-width: 860px)');
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

const DEPLOY = [
  [25.2, 55.3], [24.7, 46.7], [25.3, 51.5], [23.6, 58.5], [26.2, 50.6],
  [29.4, 47.9], [51.5, -0.1], [38.0, -97.0], [-33.9, 151.2],
  [52.2, 21.0], [44.8, 20.5], [44.4, 26.1],
];
const RECRUIT = [
  [20.6, 78.9], [30.4, 69.3], [23.7, 90.4], [28.4, 84.1], [7.9, 80.8],
  [12.9, 121.8], [26.8, 30.8], [1.4, 32.3], [9.1, 8.7], [0.0, 37.9],
];
const FLOWS = [
  [[20.6, 78.9], [25.2, 55.3]], [[30.4, 69.3], [24.7, 46.7]], [[12.9, 121.8], [25.3, 51.5]],
  [[26.8, 30.8], [51.5, -0.1]], [[20.6, 78.9], [38.0, -97.0]], [[23.7, 90.4], [-33.9, 151.2]],
  [[9.1, 8.7], [52.2, 21.0]], [[28.4, 84.1], [26.2, 50.6]], [[7.9, 80.8], [44.4, 26.1]],
];

const THEME = {
  src:  { pts: 0x274798, ptsOp: 0.78, core: 0xD3D8E2, coreOp: 0.62, wire: 0x0C1633, wireOp: 0.07, arc: 0x274798, arcOp: 0.55, pulse: 0x274798, glow: false },
  site: { pts: 0xEEBE0D, ptsOp: 0.86, core: 0x0B1A42, coreOp: 0.72, wire: 0x3A63C9, wireOp: 0.12, arc: 0xEEBE0D, arcOp: 0.5,  pulse: 0xF6DE86, glow: true },
};

function ll(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
function fib(n, r) {
  const out = [], g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, rad = Math.sqrt(1 - y * y), t = g * i;
    out.push(new THREE.Vector3(Math.cos(t) * rad * r, y * r, Math.sin(t) * rad * r));
  }
  return out;
}

function boot() {
  if (!canvas) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); return; }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.autoClear = false;

  const R = 2;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const root = new THREE.Group();
  root.rotation.set(0.2, -1.2, -0.3);
  scene.add(root);

  const coreMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: true });
  root.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 64), coreMat));

  const ptsMat = new THREE.PointsMaterial({ size: 0.024, transparent: true, sizeAttenuation: true });
  root.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(fib(2800, R)), ptsMat));

  const wireMat = new THREE.LineBasicMaterial({ transparent: true });
  root.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(R * 1.003, 24, 16)), wireMat));

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.16, 48, 48),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      uniforms: { c: { value: new THREE.Color(0x3A63C9) } },
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vN; uniform vec3 c; void main(){ float i = pow(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(c, clamp(i,0.0,1.0)*0.45); }',
    })
  );
  scene.add(glow);

  const halos = [];
  function marker(lat, lon, color, size) {
    const pos = ll(lat, lon, R * 1.01);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12), new THREE.MeshBasicMaterial({ color }));
    dot.position.copy(pos); root.add(dot);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(size * 1.7, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false }));
    halo.position.copy(pos); halo.userData.ph = Math.random() * 6.28; root.add(halo); halos.push(halo);
  }
  DEPLOY.forEach(([a, b]) => marker(a, b, 0xEEBE0D, 0.03));
  RECRUIT.forEach(([a, b]) => marker(a, b, 0x3A63C9, 0.028));

  const arcMat = new THREE.LineBasicMaterial({ transparent: true });
  const pulseMat = new THREE.MeshBasicMaterial({ depthWrite: false });
  const arcs = FLOWS.map(([s, e]) => {
    const a = ll(s[0], s[1], R * 1.01), b = ll(e[0], e[1], R * 1.01);
    const mid = a.clone().add(b).multiplyScalar(0.5).setLength(R + a.distanceTo(b) * 0.5);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), arcMat));
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), pulseMat);
    root.add(pulse);
    return { curve, pulse, t: Math.random(), v: 0.1 + Math.random() * 0.1 };
  });

  function apply(th) {
    coreMat.color.setHex(th.core); coreMat.opacity = th.coreOp;
    ptsMat.color.setHex(th.pts); ptsMat.opacity = th.ptsOp;
    wireMat.color.setHex(th.wire); wireMat.opacity = th.wireOp;
    arcMat.color.setHex(th.arc); arcMat.opacity = th.arcOp;
    pulseMat.color.setHex(th.pulse);
    glow.visible = th.glow;
  }

  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // globe diameter as a share of the shorter side
    const share = phoneMQ.matches ? 0.64 : 0.6;
    const fracH = share * Math.min(W, H) / H;
    camera.position.set(0, 0, (2 * R) / (2 * Math.tan(camera.fov * Math.PI / 360) * fracH));
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let tx = 0, ty = 0, cx = 0, cy = 0;
  if (fine && !reduce) {
    addEventListener('pointermove', (e) => {
      tx = (e.clientY / innerHeight - 0.5) * 0.25;
      ty = (e.clientX / innerWidth - 0.5) * 0.35;
    }, { passive: true });
  }

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  function render() {
    const dpr = renderer.getPixelRatio();
    renderer.setScissorTest(true);
    renderer.clear();
    if (phoneMQ.matches) {
      // WebGL's origin is bottom-left: SITE is the lower half
      const half = Math.round(H / 2);
      apply(THEME.site); renderer.setScissor(0, 0, W, half); renderer.render(scene, camera);
      apply(THEME.src);  renderer.setScissor(0, half, W, H - half); renderer.render(scene, camera);
    } else {
      const half = Math.round(W / 2);
      apply(THEME.src);  renderer.setScissor(0, 0, half, H); renderer.render(scene, camera);
      apply(THEME.site); renderer.setScissor(half, 0, W - half, H); renderer.render(scene, camera);
    }
    renderer.setScissorTest(false);
    void dpr;
  }

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    root.rotation.y += dt * 0.09;
    cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
    root.rotation.x = 0.2 + cx;
    scene.rotation.y = cy * 0.4;
    for (const h of halos) {
      const s = 1 + Math.sin(t * 2 + h.userData.ph) * 0.3;
      h.scale.setScalar(s); h.material.opacity = 0.3 - (s - 1) * 0.3;
    }
    for (const a of arcs) { a.t = (a.t + a.v * dt) % 1; a.curve.getPoint(a.t, a.pulse.position); }
    render();
  }
  if (reduce) {
    arcs.forEach((a) => a.curve.getPoint(a.t, a.pulse.position));
    render();
    addEventListener('resize', () => requestAnimationFrame(render));
  } else {
    tick();
  }
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
