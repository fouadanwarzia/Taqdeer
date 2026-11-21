/* Taqdeer — 3D globe (three.js r149, works from file://) */
(function () {
  "use strict";
  var canvas = document.getElementById("globe");
  if (!canvas || typeof THREE === "undefined") return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { canvas.style.display = "none"; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  camera.position.set(0, 0, 6.2);

  /* lights */
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x0b1f8f, .55));
  var key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 4, 5); scene.add(key);
  var rim = new THREE.DirectionalLight(0xffc414, 2.2); rim.position.set(-5, -2, -1); scene.add(rim);
  var fill = new THREE.PointLight(0x6f8cff, 1.2, 20); fill.position.set(4, -3, 3); scene.add(fill);

  var world = new THREE.Group();
  world.rotation.z = .32;
  scene.add(world);
  var spin = new THREE.Group();
  world.add(spin);

  var R = 1;
  function ll(lat, lon, r) {
    var phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  }

  /* core sphere: glossy royal blue */
  var core = new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 96),
    new THREE.MeshPhysicalMaterial({ color: 0x0a1fa0, metalness: .15, roughness: .42, clearcoat: .8, clearcoatRoughness: .2 })
  );
  spin.add(core);

  /* land dots */
  var L = window.LAND_DOTS || [];
  var pos = new Float32Array(L.length / 2 * 3);
  for (var i = 0; i < L.length; i += 2) {
    var v = ll(L[i], L[i + 1], R * 1.006);
    pos[i / 2 * 3] = v.x; pos[i / 2 * 3 + 1] = v.y; pos[i / 2 * 3 + 2] = v.z;
  }
  var dotTex = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.45, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  var dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var dots = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffc414, size: .038, map: dotTex, transparent: true, depthWrite: false, opacity: 1 }));
  spin.add(dots);

  /* atmosphere (fresnel glow) */
  var atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.18, 64, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false,
      uniforms: { c: { value: new THREE.Color(0x5b7dff) } },
      vertexShader: "varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "uniform vec3 c;varying vec3 n;void main(){float i=pow(.68-dot(n,vec3(0,0,1.)),3.);gl_FragColor=vec4(c,i*.9);}"
    })
  );
  world.add(atmo);

  /* gold orbit rings */
  function ring(r, tilt, op) {
    var m = new THREE.Mesh(new THREE.TorusGeometry(r, .004, 8, 200), new THREE.MeshBasicMaterial({ color: 0xffc414, transparent: true, opacity: op }));
    m.rotation.x = Math.PI / 2 + tilt; return m;
  }
  var rings = new THREE.Group();
  rings.add(ring(1.55, .25, .55)); rings.add(ring(1.78, -.35, .3));
  world.add(rings);

  /* network: sources -> Dubai -> destinations */
  var hub = [25.2, 55.3];
  var sources = [[20.6, 78.9], [30.4, 69.3], [23.7, 90.4], [28.4, 84.1], [7.9, 80.8], [12.9, 121.8], [26.8, 30.8], [1.4, 32.3], [9.1, 8.7], [-0.02, 37.9]];
  var dests = [[-25.3, 133.8], [39.8, -98.6], [54.0, -2.0], [23.9, 45.1], [25.3, 51.2], [21.5, 55.9], [26.0, 50.5], [29.3, 47.5], [51.9, 19.1], [44.0, 21.0], [45.9, 24.9]];
  var arcs = [], pulseGeo = new THREE.SphereGeometry(.022, 12, 12);
  function arc(a, b, color) {
    var va = ll(a[0], a[1], R * 1.01), vb = ll(b[0], b[1], R * 1.01);
    var mid = va.clone().add(vb).multiplyScalar(.5);
    var d = va.distanceTo(vb);
    mid.normalize().multiplyScalar(R + .18 + d * .35);
    var curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    var g = new THREE.TubeGeometry(curve, 64, .0055, 6, false);
    var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: .85 }));
    spin.add(m);
    var p = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    spin.add(p);
    arcs.push({ curve: curve, pulse: p, t: Math.random(), speed: .0025 + Math.random() * .003 });
  }
  sources.forEach(function (s) { arc(s, hub, 0xffc414); });
  dests.forEach(function (s) { arc(hub, s, 0x9fb4ff); });

  /* markers */
  function marker(p, col, size) {
    var g = new THREE.Group();
    var v = ll(p[0], p[1], R * 1.012);
    var dot = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), new THREE.MeshBasicMaterial({ color: col }));
    dot.position.copy(v); g.add(dot);
    var halo = new THREE.Mesh(new THREE.RingGeometry(size * 1.4, size * 2.2, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .6, side: THREE.DoubleSide }));
    halo.position.copy(v); halo.lookAt(v.clone().multiplyScalar(2)); g.add(halo);
    g.userData.halo = halo; spin.add(g); return g;
  }
  var markers = [];
  sources.forEach(function (s) { markers.push(marker(s, 0xffc414, .018)); });
  dests.forEach(function (s) { markers.push(marker(s, 0xffffff, .016)); });
  markers.push(marker(hub, 0xffc414, .03));

  /* orbiting 3D icon sprites */
  var iconNames = ["construction", "oilgas", "hospitality", "logistics", "safety", "transport"];
  var loader = new THREE.TextureLoader();
  var sprites = [];
  iconNames.forEach(function (n, i) {
    var tex = loader.load("img/icons/" + n + ".png");
    tex.encoding = THREE.sRGBEncoding;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.set(.42, .42, 1);
    s.userData.a = i / iconNames.length * Math.PI * 2;
    world.add(s); sprites.push(s);
  });

  /* start orientation: Middle East facing camera */
  spin.rotation.y = 3.2;

  /* sizing */
  function size() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  size(); window.addEventListener("resize", size);

  /* interaction */
  var mx = 0, my = 0, tx = 0, ty = 0, scrollRot = 0, intro = 0;
  window.addEventListener("mousemove", function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  window.addEventListener("scroll", function () { scrollRot = window.scrollY * .0015; }, { passive: true });
  // drag to spin
  var drag = false, lastX = 0, vel = 0;
  canvas.addEventListener("pointerdown", function (e) { drag = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", function (e) { if (!drag) return; vel = (e.clientX - lastX) * .006; spin.rotation.y += vel; lastX = e.clientX; });
  canvas.addEventListener("pointerup", function () { drag = false; });

  var visible = true;
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);

  var clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    var dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    intro += (1 - intro) * .03;
    if (!reduce && !drag) { spin.rotation.y += .12 * dt + vel; vel *= .94; }
    tx += (mx - tx) * .05; ty += (my - ty) * .05;
    world.rotation.x = ty * .35;
    world.rotation.y = tx * .5 + scrollRot;
    world.scale.setScalar(.6 + .4 * intro);
    rings.rotation.z = t * .08;
    arcs.forEach(function (a) { a.t = (a.t + a.speed) % 1; a.pulse.position.copy(a.curve.getPoint(a.t)); });
    markers.forEach(function (m, i) { var s = 1 + .5 * Math.sin(t * 2.4 + i); m.userData.halo.scale.setScalar(s); m.userData.halo.material.opacity = .7 - .45 * (s - .5); });
    sprites.forEach(function (s, i) {
      var a = s.userData.a + t * .25, r = 1.66;
      s.position.set(Math.cos(a) * r, Math.sin(a * 2 + i) * .18 + Math.sin(a) * .35, Math.sin(a) * r);
      var depth = (s.position.z + r) / (2 * r);
      s.material.opacity = .35 + .65 * depth;
      var sc = .3 + .18 * depth; s.scale.set(sc, sc, 1);
    });
    renderer.render(scene, camera);
  }
  tick();
})();
