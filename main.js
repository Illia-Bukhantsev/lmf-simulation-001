import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(8, 6, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);
controls.update();

// FLOATING DESCRIPTION PANEL
const infoPanel = document.createElement('div');
infoPanel.style.position = 'absolute';
infoPanel.style.display = 'none';
infoPanel.style.padding = '12px 16px';
infoPanel.style.background = 'rgba(255, 255, 255, 0.96)';
infoPanel.style.border = '1px solid #dddddd';
infoPanel.style.borderRadius = '12px';
infoPanel.style.fontFamily = 'Arial, sans-serif';
infoPanel.style.fontSize = '15px';
infoPanel.style.maxWidth = '360px';
infoPanel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
infoPanel.style.zIndex = '10';
infoPanel.style.pointerEvents = 'none';
document.body.appendChild(infoPanel);

// DESCRIPTIONS BY EXACT MESH NAME
const descriptions = {
  'Mesh050_2': 'Roof B — Close the ladle during heating and provide a controlled environment for electric arc treatment.',
  'Mesh051_1': 'Roof A — Close the ladle during heating and provide a controlled environment for electric arc treatment.',
  'Mesh050_1': 'Roof A — Doors for sampling, measurement, and manual FeAlloys addition.',
  'Mesh043_1': 'Robot for measurements and sampling.',
  'MHS': 'Store, weigh, and automatically transfer additives and consumables to the Ladle Furnace.',
  'Mesh006': 'LMF Bin — used for material/additive feeding.',
  'Bas_Tube_System': 'Conducts electricity from cables to electrode arms.',
  'Mesh049_1': 'Electrode arms and gantry — position and hold electrodes for arcing process between Roof A and B.',
  'Electrodes': 'Electrodes transfer electrical power to the steel.'
};

// LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(10, 15, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -15;
mainLight.shadow.camera.right = 15;
mainLight.shadow.camera.top = 15;
mainLight.shadow.camera.bottom = -15;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
fillLight.position.set(-10, 8, -10);
scene.add(fillLight);

// SHADOW FLOOR
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.ShadowMaterial({ opacity: 0.18 })
);

floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.receiveShadow = true;
scene.add(floor);

// SELECTION SYSTEM
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;
let originalMaterial = null;
let selectedCenter = null;

// LOAD MODEL
const loader = new GLTFLoader();

loader.load(
  './models/LMF1.glb',

  function (gltf) {
    const model = gltf.scene;

    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });

    scene.add(model);
    console.log('LMF model loaded successfully');
  },

  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100).toFixed(1) + '% loaded');
  },

  function (error) {
    console.error('Error loading LMF model:', error);
  }
);

function updateInfoPanelPosition() {
  if (!selectedObject || !selectedCenter) return;

  const screenPosition = selectedCenter.clone();
  screenPosition.project(camera);

  const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;

  infoPanel.style.left = `${x}px`;
  infoPanel.style.top = `${y}px`;
  infoPanel.style.transform = 'translate(-50%, -120%)';
}

// CLICK TO SELECT OBJECT
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length === 0) {
    infoPanel.style.display = 'none';
    return;
  }

  const clickedObject = intersects[0].object;

  if (!clickedObject.isMesh || clickedObject === floor) {
    infoPanel.style.display = 'none';
    return;
  }

  if (selectedObject && originalMaterial) {
    selectedObject.material = originalMaterial;
  }

  selectedObject = clickedObject;
  originalMaterial = clickedObject.material;

  // RED HIGHLIGHT
  const highlightMaterial = clickedObject.material.clone();
  highlightMaterial.color = new THREE.Color(0xff0000);
  highlightMaterial.emissive = new THREE.Color(0xff0000);
  highlightMaterial.emissiveIntensity = 0.35;
  selectedObject.material = highlightMaterial;

  const objectName = selectedObject.name || 'Unknown component';
  const description =
    descriptions[objectName] || 'No description added yet for this component.';

  // Show only description, not mesh name
  infoPanel.innerHTML = `
    <b>Description:</b><br>
    ${description}
  `;

  // Calculate point above selected object
  const box = new THREE.Box3().setFromObject(selectedObject);
  selectedCenter = new THREE.Vector3();
  box.getCenter(selectedCenter);
  selectedCenter.y = box.max.y + 0.6;

  infoPanel.style.display = 'block';
  updateInfoPanelPosition();

  console.log('Selected object:', objectName);
});

// ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);

  controls.update();
  updateInfoPanelPosition();

  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  updateInfoPanelPosition();
});
