import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const NODE_SPACE = 100;
const STATES_VALUE = [0xffffff, 0xff0000, 0xffff00, 0x0000ee];

let font = null;
let scene = null;
let camera = null;
let renderer = null;
const cameraSettings = { x: -300, y: 250, z: 1, scale: 0, zoom: 1 };
const nodeGeometry = new THREE.PlaneGeometry(NODE_WIDTH, NODE_HEIGHT);

const nodes = {
  0: { id: 0, state: 0, x: 0, y: 0, shape: null },
  1: { id: 1, state: 0, x: 0, y: -(NODE_HEIGHT + NODE_SPACE), shape: null },
  2: {
    id: 2,
    state: 0,
    x: NODE_WIDTH + NODE_SPACE,
    y: -(NODE_HEIGHT + NODE_SPACE),
    shape: null,
  },
  3: { id: 3, state: 0, x: 0, y: -2 * (NODE_HEIGHT + NODE_SPACE), shape: null },
  4: {
    id: 4,
    state: 0,
    x: NODE_WIDTH + NODE_SPACE,
    y: -2 * (NODE_HEIGHT + NODE_SPACE),
    shape: null,
  },
  5: {
    id: 5,
    state: 0,
    x: 2 * (NODE_WIDTH + NODE_SPACE),
    y: -2 * (NODE_HEIGHT + NODE_SPACE),
    shape: null,
  },
  6: { id: 6, state: 0, x: 0, y: -3 * (NODE_HEIGHT + NODE_SPACE), shape: null },
  7: {
    id: 7,
    state: 0,
    x: NODE_WIDTH + NODE_SPACE,
    y: -3 * (NODE_HEIGHT + NODE_SPACE),
    shape: null,
  },
  8: {
    id: 8,
    state: 0,
    x: 2 * (NODE_WIDTH + NODE_SPACE),
    y: -3 * (NODE_HEIGHT + NODE_SPACE),
    shape: null,
  },
  9: {
    id: 9,
    state: 0,
    x: 3 * (NODE_WIDTH + NODE_SPACE),
    y: -3 * (NODE_HEIGHT + NODE_SPACE),
    shape: null,
  },
};

const relations = [
  { from: 9, to: 5 },
  { from: 8, to: 5 },
  { from: 7, to: 4 },
  { from: 7, to: 3 },
  { from: 6, to: 3 },
  { from: 5, to: 2 },
  { from: 4, to: 2 },
  { from: 3, to: 1 },
  { from: 2, to: 0 },
  { from: 1, to: 0 },
];

function generateNodes() {
  console.time("generateNodes");
  let row = 4;
  while (Object.keys(nodes).length < 10000) {
    const nodesCount = THREE.MathUtils.randInt(3, 8);
    for (let cell = 0; cell < nodesCount; cell++) {
      const id = Object.keys(nodes).length;
      const node = {
        id,
        state: 0,
        x: cell * (NODE_WIDTH + NODE_SPACE),
        y: -row * (NODE_HEIGHT + NODE_SPACE),
        shape: null,
      };
      nodes[id] = node;
    }
    row++;
  }

  console.log(Object.keys(nodes).length);
  console.timeEnd("generateNodes");
}

generateNodes();

function getSize(mesh) {
  let boundingBox = new THREE.Box3().setFromObject(mesh);
  let size = new THREE.Vector3(0, 0);
  size = boundingBox.getSize(size);

  return size;
}

function createText(textContent) {
  const material = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const geometry = new TextGeometry(textContent, {
    font: font,
    size: 30,
    height: 0,
    curveSegments: 2,
  });

  const text = new THREE.Mesh(geometry, material);

  const size = getSize(text);
  text.position.x = text.position.x - size.x / 2;
  text.position.y = text.position.y - size.y / 2;
  // text.position.x = text.position.x - 50;
  // text.position.y = text.position.y - 25;

  return text;
}

/**
 *
 * @param {{ id: number; state: number, x: number; y: number }} node
 * @returns
 */
function createNode(node) {
  const material = new THREE.MeshBasicMaterial({
    color: STATES_VALUE[node.state],
  });
  const nodeShape = new THREE.Mesh(nodeGeometry, material);
  nodeShape.position.x = node.x;
  nodeShape.position.y = node.y;

  // const labelShape = createText(`node ${node.id}`);
  // nodeShape.add(labelShape);

  return nodeShape;
}

function createRelation(from, to) {
  const start = new THREE.Vector2(from.x, from.y + 50);
  const end = new THREE.Vector2(to.x, to.y - 50);
  const curve = new THREE.LineCurve(start, end);

  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  var material = new THREE.LineBasicMaterial({
    color: 0xff00f0,
  });

  const relation = new THREE.Line(geometry, material);

  return relation;
}

function initCamera() {
  const camera = new THREE.OrthographicCamera(
    0,
    window.innerWidth,
    0,
    -window.innerHeight,
    1,
    1000
  );
  camera.position.x = cameraSettings.x;
  camera.position.y = cameraSettings.y;
  camera.position.z = cameraSettings.z;
  camera.zoom = cameraSettings.zoom;

  return camera;
}

function buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#263238");

  camera = initCamera();

  const gridHelper = new THREE.GridHelper(10000, 200, 0x888888, 0x888888);
  gridHelper.position.set(-100, 50, 0);
  gridHelper.rotation.x = Math.PI / 2;

  scene.add(gridHelper);

  console.time("createNodeShapes");
  Object.values(nodes).forEach((node) => {
    const shape = createNode(node);
    scene.add(shape);
    node.shape = shape;
  });
  console.timeEnd("createNodeShapes");

  for (const rel of relations) {
    const fromNode = nodes[rel.from];
    const toNode = nodes[rel.to];
    const relation = createRelation(fromNode, toNode);

    scene.add(relation);
  }

  renderer = new THREE.WebGLRenderer({ antialias: true, depth: false });
  renderer.setSize(window.innerWidth, window.innerHeight);

  //
  document.body.appendChild(renderer.domElement);
  window.addEventListener("resize", onWindowResize, false);
  renderer.domElement.addEventListener("mousemove", onMouseMove, false);
  renderer.domElement.addEventListener("wheel", onMouseWheel, false);
  //
}

async function prepare() {
  const loader = new FontLoader();

  font = await new Promise((resolve, reject) => {
    loader.load(
      "fonts/helvetiker_regular.typeface.json",
      (font) => {
        resolve(font);
      },
      () => {
        // progress
      },
      (err) => {
        reject(err);
      }
    );
  });
}

function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera = initCamera();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  if (event.which === 1) {
    cameraSettings.x = cameraSettings.x + -event.movementX;
    cameraSettings.y = cameraSettings.y + event.movementY;
    camera = initCamera();
    camera.updateProjectionMatrix();
  }
}

function onMouseWheel(event) {
  const zoomFactor = cameraSettings.zoom + (event.deltaY > 0 ? -1 : 1);
  cameraSettings.zoom = zoomFactor < 1 ? 1 : zoomFactor;
  camera = initCamera();
  camera.updateProjectionMatrix();
}

let nodesCount = Object.keys(nodes).length;

setInterval(() => {
  console.time("update state");
  const nodesCountForUpdate = THREE.MathUtils.randInt(0, nodesCount - 1);

  for (let i = 0; i < nodesCountForUpdate; i++) {
    const idx = THREE.MathUtils.randInt(0, nodesCount - 1);
    const node = nodes[idx];
    if (node) {
      node.state = THREE.MathUtils.randInt(0, STATES_VALUE.length - 1);
      const color = STATES_VALUE[node.state];
      node.shape.material.color.setHex(color);
    }
  }

  console.timeEnd("update state");
}, 500);

prepare().then(() => {
  buildScene();
  animate();
});
