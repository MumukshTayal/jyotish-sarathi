import * as THREE from './vendor/three.module.min.js';

const canvas = document.getElementById('bgStars');
if (canvas) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x1a0e06, 1);

    function applyCanvasStyle() {
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '0';
      canvas.style.pointerEvents = 'none';
    }
    applyCanvasStyle();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0e06);

    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 150);
    camera.position.set(0, -2, 18);

    // Minimal lighting
    const hemi = new THREE.HemisphereLight(0xffcc88, 0x1a0e06, 0.5);
    scene.add(hemi);

    // --- Static starfield (no per-frame buffer updates) ---
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 30 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const y = -30 + Math.random() * 70;
      starPos[i * 3] = Math.cos(theta) * r;
      starPos[i * 3 + 1] = y;
      starPos[i * 3 + 2] = Math.sin(theta) * r;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({
      color: 0xffe8b0, size: 0.3, transparent: true, opacity: 0.85, sizeAttenuation: true
    }));
    scene.add(stars);

    // --- 12 Rashi Constellations (accurate stick figures from reference) ---
    const rashiPatterns = [
      // 1. Aries (Mesha) — three stars in a gentle curve
      { pts:[[0,0],[1.2,0.6],[2.5,0.4],[3.2,1.2]], lines:[[0,1],[1,2],[2,3]] },

      // 2. Taurus (Vrishabha) — V-shape body with two horn tips branching up
      { pts:[[0,2.5],[0.8,1.8],[1.8,1.2],[2.8,0.5],[1.8,2.5],[2.6,1.8],[3.2,2.2],[0.8,1.8],[1.8,1.2]], 
        lines:[[0,1],[1,2],[2,3],[1,4],[2,5],[5,6]] },

      // 3. Gemini (Mithuna) — two stick figures side by side, connected at waist
      { pts:[[0,0],[0,1],[0,2],[0.5,2.8],[-0.5,2.8],[2,0],[2,1],[2,2],[2.5,2.8],[1.5,2.8],[0,1],[2,1]],
        lines:[[0,1],[1,2],[2,3],[2,4],[5,6],[6,7],[7,8],[7,9],[10,11]] },

      // 4. Cancer (Karka) — inverted Y with extra branch
      { pts:[[0,0],[1,1],[2,0.5],[1,2],[0.5,3],[1.8,2.8]],
        lines:[[0,1],[1,2],[1,3],[3,4],[3,5]] },

      // 5. Leo (Simha) — sickle (hook) on right + triangle body on left
      { pts:[[0,2],[1,2.8],[2,2.8],[2.8,2.2],[3,1.2],[2.5,0.5],[1.8,0],[1,0.5],[0.5,1.2],[0,2]],
        lines:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]] },

      // 6. Virgo (Kanya) — angular body with extended leg
      { pts:[[0,0],[1,0.8],[2,0.2],[3,1],[2,2],[1,1.8],[1,0.8],[2,2],[3,3]],
        lines:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[4,8]] },

      // 7. Libra (Tula) — triangle on top, horizontal bar below
      { pts:[[1,0],[0,1.5],[2,1.5],[0,2.5],[2,2.5],[1,1.5]],
        lines:[[0,1],[0,2],[1,5],[2,5],[1,3],[2,4],[3,4]] },

      // 8. Scorpio (Vrishchika) — long chain curving right with upward sting
      { pts:[[0,1.5],[1,1.2],[2,1],[3,1.2],[3.8,2],[4.2,1.2],[4.5,0.5]],
        lines:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },

      // 9. Sagittarius (Dhanu) — arrow shape pointing upper-right
      { pts:[[0,3],[1,2],[2,1],[3,0],[2,0],[3,0],[3,1],[1.5,2.5],[2.5,1.5]],
        lines:[[0,1],[1,2],[2,3],[3,4],[3,6],[1,7],[2,8]] },

      // 10. Capricorn (Makara) — triangle head with curved tail
      { pts:[[0,0.5],[1,0],[2,0.8],[1.5,1.8],[2.5,2.5],[3.5,2.2],[3.8,1.5]],
        lines:[[0,1],[1,2],[2,0],[2,3],[3,4],[4,5],[5,6]] },

      // 11. Aquarius (Kumbha) — two zigzag water lines
      { pts:[[0,0],[0.8,0.6],[1.6,0],[2.4,0.6],[3.2,0],
             [0,1.2],[0.8,1.8],[1.6,1.2],[2.4,1.8],[3.2,1.2]],
        lines:[[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9]] },

      // 12. Pisces (Meena) — two fish (V shapes) connected by horizontal line
      { pts:[[0,0],[0.5,1],[0,2],[3,0],[2.5,1],[3,2],[0.5,1],[2.5,1]],
        lines:[[0,1],[1,2],[3,4],[4,5],[6,7]] },
    ];

    const constellationGroup = new THREE.Group();
    const constellationRadius = 22;

    rashiPatterns.forEach((rashi, idx) => {
      const angle = (idx / 12) * Math.PI * 2;
      const cx = Math.cos(angle) * constellationRadius;
      const cz = Math.sin(angle) * constellationRadius;
      const cy = -2 + (idx % 3) * 4;
      const scale = 3.5;

      // Star dots at constellation vertices — large, no attenuation
      const dotGeo = new THREE.BufferGeometry();
      const dotPos = new Float32Array(rashi.pts.length * 3);
      rashi.pts.forEach((p, i) => {
        dotPos[i*3]   = cx + p[0] * scale;
        dotPos[i*3+1] = cy + p[1] * scale;
        dotPos[i*3+2] = cz;
      });
      dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
      const dots = new THREE.Points(dotGeo, new THREE.PointsMaterial({
        color: 0xffeedd, size: 4, transparent: true, opacity: 0.95, sizeAttenuation: false
      }));
      constellationGroup.add(dots);

      // Lines connecting the stars — clearly visible
      const lineVerts = [];
      rashi.lines.forEach(([a, b]) => {
        if (a < rashi.pts.length && b < rashi.pts.length) {
          lineVerts.push(
            cx + rashi.pts[a][0]*scale, cy + rashi.pts[a][1]*scale, cz,
            cx + rashi.pts[b][0]*scale, cy + rashi.pts[b][1]*scale, cz
          );
        }
      });
      if (lineVerts.length) {
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
        const line = new THREE.LineSegments(lineGeo, lineMat);
        constellationGroup.add(line);
      }
    });

    scene.add(constellationGroup);

    const clock = new THREE.Clock();

    function animate() {
      const t = clock.getElapsedTime();

      // Slow star drift (no buffer update)
      stars.rotation.y += 0.0002;
      constellationGroup.rotation.y = stars.rotation.y;

      // Gentle camera drift
      camera.position.x = Math.sin(t * 0.03) * 2;
      camera.position.y = -2.0 + Math.sin(t * 0.05) * 0.4;
      camera.lookAt(0, 2, 0);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      applyCanvasStyle();
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  } catch (err) {
    console.error('divine-bg error', err);
  }
}
