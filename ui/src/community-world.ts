import * as THREE from "three";

export type CommunityWorld = {
  render: (progress: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};
const clamp = THREE.MathUtils.clamp;
const ease = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const poses = [
  { eye: [3.3, 2.5, 5.5], target: [0, 0.7, 1.1] },
  { eye: [4.9, 3.8, 6.5], target: [0, 0.55, 0.2] },
  { eye: [3.2, 5.1, 7.3], target: [0, 0.4, -0.3] },
  { eye: [4.6, 4.9, 6.8], target: [0, 0.7, 0] },
  { eye: [7.4, 6.8, 8.1], target: [0, 0.35, 0] },
  { eye: [5.6, 6.2, 8.8], target: [0, 0.45, 0] },
];

export function createCommunityWorld(
  canvas: HTMLCanvasElement,
): CommunityWorld {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 60);
  const world = new THREE.Group();
  scene.add(world);
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const material = (color: string) => {
    const value = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0,
    });
    materials.push(value);
    return value;
  };
  const palette = {
    grass: material("#b7c9a8"),
    edge: material("#d4dcbd"),
    path: material("#ede7d5"),
    bark: material("#806b50"),
    leaf: material("#64866a"),
    leafLight: material("#92aa7b"),
    stone: material("#dadfce"),
    roof: material("#729486"),
    wall: material("#f0ecdd"),
  };
  const sphere = new THREE.SphereGeometry(1, 18, 12),
    cylinder = new THREE.CylinderGeometry(1, 1, 1, 24),
    capsule = new THREE.CapsuleGeometry(0.13, 0.28, 5, 12),
    box = new THREE.BoxGeometry(1, 1, 1);
  geometries.push(sphere, cylinder, capsule, box);
  function mesh(
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D,
    position: number[],
    scale: number[],
  ) {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(position[0], position[1], position[2]);
    m.scale.set(scale[0], scale[1], scale[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  // A single quiet landscape is shared by all six chapters.
  mesh(cylinder, palette.edge, world, [0, -0.2, 0], [3.8, 0.34, 3.15]);
  mesh(cylinder, palette.grass, world, [0, -0.015, 0], [3.8, 0.08, 3.15]);
  const pathGeo = new THREE.TorusGeometry(2.15, 0.16, 8, 80);
  geometries.push(pathGeo);
  const path = mesh(pathGeo, palette.path, world, [0, 0.04, 0], [1, 1, 0.4]);
  path.rotation.x = Math.PI / 2;
  const foliage: THREE.Group[] = [];
  function tree(x: number, z: number, size: number) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    world.add(tree);
    mesh(
      cylinder,
      palette.bark,
      tree,
      [0, 0.62 * size, 0],
      [0.07 * size, 1.24 * size, 0.07 * size],
    );
    const leaves = new THREE.Group();
    tree.add(leaves);
    for (const [dx, dy, dz, r] of [
      [0, 1.6, 0, 0.57],
      [-0.3, 1.34, 0.04, 0.43],
      [0.3, 1.4, 0.03, 0.43],
      [0.03, 1.3, -0.27, 0.41],
    ])
      mesh(
        sphere,
        dx < 0 ? palette.leaf : palette.leafLight,
        leaves,
        [dx * size, dy * size, dz * size],
        [r * size, r * 1.15 * size, r * size],
      );
    foliage.push(leaves);
  }
  tree(-2.65, -1.1, 1.1);
  tree(2.6, -1.15, 0.95);
  tree(-1.4, -2.1, 0.8);
  tree(0.05, -0.05, 0.65);
  // Low garden beds and planted leaves give the environmental metaphor scale.
  for (const [x, z, angle] of [
    [-2.5, 0.9, -0.3],
    [2.5, 0.85, 0.3],
    [-0.4, -2.5, 0],
  ]) {
    const bed = new THREE.Group();
    bed.position.set(x, 0, z);
    bed.rotation.y = angle;
    world.add(bed);
    mesh(box, palette.path, bed, [0, 0.12, 0], [0.72, 0.2, 0.4]);
    for (let i = 0; i < 3; i++) {
      const leaf = mesh(
        sphere,
        palette.leaf,
        bed,
        [(i - 1) * 0.2, 0.3, 0],
        [0.1, 0.2, 0.07],
      );
      leaf.rotation.z = (i - 1) * 0.25;
    }
  }
  for (const [x, z] of [
    [-3, -0.1],
    [2.9, -0.2],
    [-1.8, 2.2],
    [1.8, 2.3],
  ])
    mesh(sphere, palette.stone, world, [x, 0.08, z], [0.2, 0.12, 0.16]);
  const home = new THREE.Group();
  home.position.set(0.85, 0, -2.05);
  world.add(home);
  mesh(box, palette.wall, home, [0, 0.36, 0], [0.7, 0.7, 0.65]);
  const roofGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.8, 3);
  geometries.push(roofGeo);
  const roof = mesh(roofGeo, palette.roof, home, [0, 0.88, 0], [1, 1, 1]);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  mesh(box, palette.bark, home, [0, 0.21, 0.331], [0.16, 0.4, 0.02]);

  const clothes = [
    "#285e58",
    "#8caa96",
    "#d9d7c6",
    "#667d86",
    "#a1ad8a",
    "#4e7668",
    "#c7b9a3",
  ].map(material);
  const skins = ["#bb8a68", "#d4ac87", "#8d624d", "#c09673"].map(material);
  type Person = {
    group: THREE.Group;
    angle: number;
    arms: {
      upper: THREE.Mesh;
      lower: THREE.Mesh;
      hand: THREE.Mesh;
      side: number;
    }[];
  };
  const people: Person[] = [];
  const radius = 1.65;
  const count = 7;
  function segment(
    node: THREE.Mesh,
    from: THREE.Vector3,
    to: THREE.Vector3,
    r: number,
  ) {
    const delta = new THREE.Vector3().subVectors(to, from);
    node.position.copy(from).add(to).multiplyScalar(0.5);
    node.scale.set(r, delta.length(), r);
    node.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
  }
  for (let i = 0; i < count; i++) {
    const group = new THREE.Group();
    const angle = Math.PI / 2 + (i * Math.PI * 2) / count;
    group.rotation.y = -angle - Math.PI / 2;
    world.add(group);
    const shirt = clothes[i],
      skin = skins[i % skins.length];
    mesh(sphere, skin, group, [0, 1.28, 0], [0.145, 0.175, 0.14]);
    const body = mesh(capsule, shirt, group, [0, 0.82, 0], [1.65, 1.25, 1]);
    body.rotation.z = (i % 2 ? 1 : -1) * 0.025;
    for (const side of [-1, 1]) {
      mesh(
        capsule,
        clothes[(i + 3) % clothes.length],
        group,
        [side * 0.105, 0.29, 0],
        [0.65, 0.91, 0.7],
      );
      mesh(
        sphere,
        palette.bark,
        group,
        [side * 0.105, 0.06, 0.04],
        [0.09, 0.055, 0.15],
      );
    }
    const arms: Person["arms"] = [];
    for (const side of [-1, 1]) {
      const upper = mesh(cylinder, shirt, group, [0, 0, 0], [1, 1, 1]),
        lower = mesh(cylinder, skin, group, [0, 0, 0], [1, 1, 1]),
        hand = mesh(sphere, skin, group, [0, 0, 0], [0.072, 0.072, 0.072]);
      arms.push({ upper, lower, hand, side });
    }
    people.push({ group, angle, arms });
  }
  const fill = new THREE.HemisphereLight(0xffffff, 0x899a7c, 2.5);
  scene.add(fill);
  const sun = new THREE.DirectionalLight(0xfffaf0, 4.2);
  sun.position.set(-3, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -6,
    right: 6,
    top: 6,
    bottom: -6,
    near: 0.5,
    far: 25,
  });
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 4;
  scene.add(sun);
  let last = 0,
    width = 1,
    height = 1,
    disposed = false;
  const target = new THREE.Vector3();
  function render(progress: number) {
    if (disposed) return;
    last = clamp(progress, 0, 5);
    const index = Math.min(4, Math.floor(last)),
      t = ease(last - index);
    const a = poses[index],
      b = poses[index + 1];
    camera.position.set(
      THREE.MathUtils.lerp(a.eye[0], b.eye[0], t),
      THREE.MathUtils.lerp(a.eye[1], b.eye[1], t),
      THREE.MathUtils.lerp(a.eye[2], b.eye[2], t),
    );
    target.set(
      THREE.MathUtils.lerp(a.target[0], b.target[0], t),
      THREE.MathUtils.lerp(a.target[1], b.target[1], t),
      THREE.MathUtils.lerp(a.target[2], b.target[2], t),
    );
    if (width < 560)
      camera.position.sub(target).multiplyScalar(1.06).add(target);
    camera.lookAt(target);
    const together = ease((last - 1.9) / 1.1);
    people.forEach((person, i) => {
      const visible = i === 0 ? 1 : ease((last - 0.3 - i * 0.055) / 1.3);
      person.group.scale.setScalar(Math.max(0.001, visible));
      const spread = radius + (1 - together) * (i === 0 ? 0 : 0.65);
      person.group.position.set(
        Math.cos(person.angle) * spread,
        0,
        Math.sin(person.angle) * spread,
      );
      person.arms.forEach(({ upper, lower, hand, side }) => {
        const shoulder = new THREE.Vector3(side * 0.22, 0.99, 0);
        const elbow = new THREE.Vector3(
          side * THREE.MathUtils.lerp(0.25, 0.44, together),
          THREE.MathUtils.lerp(0.74, 0.8, together),
          THREE.MathUtils.lerp(0, 0.14, together),
        );
        const end = new THREE.Vector3(
          side *
            THREE.MathUtils.lerp(
              0.27,
              (radius * Math.sin((2 * Math.PI) / count)) / 2,
              together,
            ),
          THREE.MathUtils.lerp(0.53, 0.84, together),
          THREE.MathUtils.lerp(
            0.03,
            (radius * (1 - Math.cos((2 * Math.PI) / count))) / 2,
            together,
          ),
        );
        segment(upper, shoulder, elbow, 0.073);
        segment(lower, elbow, end, 0.055);
        hand.position.copy(end);
        hand.visible = side === 1 || together < .99;
      });
    });
    foliage.forEach((leaves, i) =>
      leaves.scale.setScalar(0.8 + 0.2 * ease((last + 0.5 - i * 0.08) / 2.2)),
    );
    home.scale.setScalar(0.6 + 0.4 * ease((last - 1) / 2));
    renderer.render(scene, camera);
    canvas.dataset.progress = last.toFixed(4);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
  }
  return {
    render,
    resize(w, h) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      renderer.setPixelRatio(
        Math.min(devicePixelRatio || 1, width < 560 ? 1.5 : 2),
      );
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render(last);
    },
    dispose() {
      disposed = true;
      for (const geometry of geometries) geometry.dispose();
      for (const mat of materials) mat.dispose();
      renderer.dispose();
    },
  };
}
