import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
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

// UI PANEL
const panel = document.createElement('div');
panel.style.position = 'absolute';
panel.style.top = '20px';
panel.style.left = '20px';
panel.style.width = '360px';
panel.style.padding = '16px';
panel.style.background = 'rgba(255,255,255,0.96)';
panel.style.border = '1px solid #ddd';
panel.style.borderRadius = '14px';
panel.style.fontFamily = 'Arial, sans-serif';
panel.style.fontSize = '15px';
panel.style.boxShadow = '0 4px 18px rgba(0,0,0,0.16)';
panel.style.zIndex = '10';
document.body.appendChild(panel);

let mode = 'explore';
let currentStep = 0;

const descriptions = {
  'Mesh050_2': 'Roof B — Close the ladle during heating and provide a controlled environment for electric arc treatment.',
  'Mesh051_1': 'Roof A — Close the ladle during heating and provide a controlled environment for electric arc treatment.',
  'Mesh050_1': 'Roof A — Doors for sampling, measurement, and manual FeAlloys addition.',
  'Mesh043_1': 'Robot for measurements and sampling.',
  'MHS': 'Material Handling System — Store, weigh, and automatically transfer additives and consumables to the Ladle Furnace.',
  'Mesh006': 'LMF Bin — Uses for material/additive feeding directly to the heat.',
  'Heat_Shield': 'Heat shield — Protects the area from radiation heat from electrodes.',
  'Bas_Tube_System': 'Bas Tube System — Conducts electricity from cables to electrode arms.',
  'Mesh003_1': 'The ladle is used to receive, contain, and safely transport up to 180 tonnes of molten steel.',
  'Mesh003': 'Ladle tilting device.',
  'Mesh026_6': 'Covers of LTC — Protects LTC drives from technological waste.',
  'Mesh026_3': 'LTC body.',
  'Mesh026_4': 'LTC body.',
  'Mesh026_5': 'LTC body.',
  'Mesh026_2': 'LTC body.',
  'Mesh049_1': 'Electrode arms and gantry — Positions and holds electrodes for arcing process between Roof A and B.',
  'Electrodes': 'Electrodes — transfer electrical power to the steel.'
};

const trainingSteps = [
  { target: 'Mesh051_1', instruction: 'Select Roof A' },
  { target: 'Mesh050_2', instruction: 'Select Roof B' },
  { target: 'Mesh006', instruction: 'Select LMF Bin' },
  { target: 'Mesh043_1', instruction: 'Select robot for measurements and sampling' },
  { target: 'Mesh003_1', instruction: 'Select the ladle' },
  { target: 'Mesh049_1', instruction: 'Select electrode arms and gantry' },
  { target: 'Electrodes', instruction: 'Select electrodes' }
];

function updatePanel(message = '') {
  if (mode === 'explore') {
    panel.innerHTML = `
      <div style="margin-bottom: 12px;">
        <button id="exploreBtn" style="padding:8px 10px; margin-right:6px;">Explore Mode</button>
        <button id="trainingBtn" style="padding:8px 10px;">Guided Training</button>
      </div>
      <b>Explore Mode</b><br>
      Click any component to see its description.<br><br>
      ${message}
    `;
  } else {
    const step = trainingSteps[currentStep];
    panel.innerHTML = `
      <div style="margin-bottom: 12px;">
        <button id="exploreBtn" style="padding:8px 10px; margin-right:6px;">Explore Mode</button>
        <button id="trainingBtn" style="padding:8px 10px;">Guided Training</button>
      </div>
      <b>Guided Training</b><br>
      Step ${currentStep + 1} of ${trainingSteps.length}<br><br>
      <b>Task:</b> ${step.instruction}<br><br>
      ${message}
    `;
  }

  document.getElementById('exploreBtn').onclick = () => {
    mode = 'explore';
    clearSelection();
    updatePanel();
  };

  document.getElementById('trainingBtn').onclick = () => {
    mode = 'training';
    currentStep = 0;
    clearSelection();
    updatePanel();
  };
}

updatePanel();

// LIGHTS
scene.add(new THREE.AmbientLight(0xffffff, 0.65));

const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(10, 15, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
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

// SELECTION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;
let originalMaterial = null;

function clearSelection() {
  if (selectedObject && originalMaterial) {
    selectedObject.material = originalMaterial;
  }
  selectedObject = null;
  originalMaterial = null;
}

function highlightObject(object) {
  clearSelection();

  selectedObject = object;
  originalMaterial = object.material;

  const highlightMaterial = object.material.clone();
  highlightMaterial.color = new THREE.Color(0xff0000);
  highlightMaterial.emissive = new THREE.Color(0xff0000);
  highlightMaterial.emissiveIntensity = 0.35;

  selectedObject.material = highlightMaterial;
}

function getDescription(objectName) {
  return descriptions[objectName] || 'No description added yet for this component.';
}

// LOAD MODEL
const loader = new GLTFLoader();

loader.load(
  './models/LMF1.glb',
  (gltf) => {
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
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100).toFixed(1) + '% loaded');
  },
  (error) => {
    console.error('Error loading LMF model:', error);
  }
);

// CLICK LOGIC
window.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON') return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length === 0) return;

  const clickedObject = intersects[0].object;

  if (!clickedObject.isMesh || clickedObject === floor) return;

  const objectName = clickedObject.name;
  highlightObject(clickedObject);

  if (mode === 'explore') {
    updatePanel(`
      <b>Description:</b><br>
      ${getDescription(objectName)}
    `);
    return;
  }

  const step = trainingSteps[currentStep];

  if (objectName === step.target) {
    currentStep++;

    if (currentStep >= trainingSteps.length) {
      updatePanel(`
        <span style="color:green; font-weight:bold;">✅ Training complete!</span><br><br>
        Great job. You identified all key LMF components.
      `);
      currentStep = 0;
      return;
    }

    updatePanel(`
      <span style="color:green; font-weight:bold;">✅ Correct!</span><br><br>
      ${getDescription(objectName)}
    `);
  } else {
    updatePanel(`
      <span style="color:red; font-weight:bold;">❌ Not correct.</span><br>
      Try again.
    `);
  }
});

// ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
