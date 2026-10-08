<script>
  import { onMount } from 'svelte';
  import { elementStyle } from '$lib/elements.js';

  /** Maille cristalline en 3D : atomes (sphères) + contour de la cellule unitaire. */
  let { lattice, sites, supercell = 1 } = $props();

  let host = $state();
  let status = $state('loading'); // loading | ready | error
  let rebuild = $state.raw(null);

  const symbols = $derived([...new Set(sites.map((s) => s.el))]);

  onMount(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (disposed) return;

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        host.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'block';

        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        controls.autoRotateSpeed = 1.2;

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const sun = new THREE.DirectionalLight(0xffffff, 2.2);
        sun.position.set(5, 8, 6);
        scene.add(sun);

        const [va, vb, vc] = lattice.map((r) => new THREE.Vector3(...r));
        const toCart = (abc) => va.clone().multiplyScalar(abc[0]).addScaledVector(vb, abc[1]).addScaledVector(vc, abc[2]);

        const group = new THREE.Group();
        scene.add(group);
        const geometries = [];
        const materials = [];

        function clear() {
          for (const g of geometries.splice(0)) g.dispose();
          for (const m of materials.splice(0)) m.dispose();
          group.clear();
        }

        function build(n) {
          clear();
          const eps = 1e-3;
          const positions = new Map(); // élément → liste de Vector3

          for (const { el, abc } of sites) {
            const f = abc.map((x) => x - Math.floor(x));
            // Un atome posé sur une face de la maille est aussi dessiné sur la face opposée.
            const shifts = f.map((x) => {
              const s = Array.from({ length: n }, (_, i) => i);
              if (x < eps || x > 1 - eps) s.push(n);
              return s;
            });
            for (const i of shifts[0]) for (const j of shifts[1]) for (const k of shifts[2]) {
              const frac = [(x0(f[0]) + i), (x0(f[1]) + j), (x0(f[2]) + k)];
              if (!positions.has(el)) positions.set(el, []);
              positions.get(el).push(toCart(frac));
            }
          }
          function x0(x) { return x > 1 - eps ? 0 : x; }

          const sphere = new THREE.SphereGeometry(1, 20, 14);
          geometries.push(sphere);
          for (const [el, list] of positions) {
            const { color, radius } = elementStyle(el);
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.1 });
            materials.push(mat);
            const mesh = new THREE.InstancedMesh(sphere, mat, list.length);
            const m4 = new THREE.Matrix4();
            list.forEach((p, idx) => {
              const r = radius * 0.45;
              m4.compose(p, new THREE.Quaternion(), new THREE.Vector3(r, r, r));
              mesh.setMatrixAt(idx, m4);
            });
            group.add(mesh);
          }

          // Contour de la cellule unitaire (12 arêtes).
          const o = new THREE.Vector3();
          const corners = [o, va, vb, vc, va.clone().add(vb), va.clone().add(vc), vb.clone().add(vc), va.clone().add(vb).add(vc)];
          const edges = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 4], [2, 6], [3, 5], [3, 6], [4, 7], [5, 7], [6, 7]];
          const pts = edges.flatMap(([a, b]) => [corners[a], corners[b]]);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.7 });
          geometries.push(lineGeo);
          materials.push(lineMat);
          group.add(new THREE.LineSegments(lineGeo, lineMat));

          // Centre le modèle et cadre la caméra selon sa taille.
          const box = new THREE.Box3().setFromObject(group);
          const center = box.getCenter(new THREE.Vector3());
          group.position.sub(center);
          const radius = box.getSize(new THREE.Vector3()).length() / 2 || 5;
          const dist = radius / Math.sin((camera.fov * Math.PI) / 360) * 1.25;
          camera.position.set(dist * 0.6, dist * 0.45, dist * 0.7);
          camera.near = dist / 100;
          camera.far = dist * 20;
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.update();
        }

        function resize() {
          const w = host.clientWidth || 600;
          const h = host.clientHeight || 400;
          renderer.setSize(w, h, false);
          renderer.domElement.style.width = '100%';
          renderer.domElement.style.height = '100%';
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
        const ro = new ResizeObserver(resize);
        ro.observe(host);
        resize();

        let raf = 0;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          controls.update();
          renderer.render(scene, camera);
        };
        tick();

        rebuild = build;
        status = 'ready';

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          controls.dispose();
          clear();
          renderer.dispose();
          renderer.domElement.remove();
        };
        if (disposed) cleanup();
      } catch (err) {
        console.error('[CrystalViewer]', err);
        status = 'error';
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  });

  $effect(() => {
    if (rebuild) rebuild(supercell);
  });
</script>

<div class="relative h-[420px] w-full overflow-hidden bg-nano-void md:h-[520px]">
  <div bind:this={host} class="absolute inset-0" role="img" aria-label="Maille cristalline en 3D, glisser pour tourner, molette pour zoomer"></div>
  {#if status === 'loading'}
    <p class="absolute inset-0 grid place-items-center text-[11px] tracking-[0.1em] text-nano-dim uppercase">Chargement de la maille…</p>
  {:else if status === 'error'}
    <p class="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-nano-warn">Impossible d'afficher la 3D (WebGL indisponible sur cet appareil).</p>
  {:else}
    <ul class="absolute bottom-2 left-3 m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-[10px] text-nano-muted">
      {#each symbols as el}
        <li class="flex items-center gap-1.5"><i class="inline-block h-2 w-2 rounded-full" style:background={elementStyle(el).color}></i>{el}</li>
      {/each}
    </ul>
    <p class="absolute right-3 bottom-2 m-0 text-[10px] text-nano-dim">glisser · molette</p>
  {/if}
</div>
