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
panel.style.width = '380px';
panel.style.padding = '18px';
panel.style.background = 'rgba(255,255,255,0.97)';
panel.style.border = '1px solid #e5e5e5';
panel.style.borderRadius = '18px';
panel.style.fontFamily = 'Arial, sans-serif';
panel.style.fontSize = '15px';
panel.style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)';
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
  'Mesh006': 'LMF Bin — Used for material/additive feeding directly to the heat.',
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
  'Electrodes': 'Electrodes — Transfer electrical power to the steel.'
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

function modeButton(id, label, icon, active) {
  return `
    <button
      id="${id}"
      style="
        flex:1;
        padding:11px 12px;
        border-radius:12px;
        border:1px solid ${active ? '#2563eb' : '#d6d6d6'};
        background:${active ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#ffffff'};
        color:${active ? '#ffffff' : '#222222'};
        font-weight:700;
        cursor:pointer;
        box-shadow:${active ? '0 5px 14px rgba(37,99,235,0.35)' : '0 2px 8px rgba(0,0,0,0.08)'};
        transition:all 0.2s ease;
      "
    >
      ${icon} ${label}
    </button>
  `;
}

function updatePanel(message = '') {
  const exploreActive = mode === 'explore';
  const trainingActive = mode === 'training';

  if (mode === 'explore') {
    panel.innerHTML = `
      <div style="display:flex; gap:10px; margin-bottom:16px;">
        ${modeButton('exploreBtn', 'Explore', '👁️', exploreActive)}
        ${modeButton('trainingBtn', 'Guided', '🎯', trainingActive)}
      </div>

      <div style="font-size:18px; font-weight:800; margin-bottom:6px;">
        Explore Mode
      </div>

      <div style="color:#555; line-height:1.45;">
        Click any component to see its description.
      </div>

      <div style="margin-top:14px; line-height:1.45;">
        ${message}
      </div>
    `;
  } else {
    const step = trainingSteps[currentStep];

    panel.innerHTML = `
      <div style="display:flex; gap:10px; margin-bottom:16px;">
        ${modeButton('exploreBtn', 'Explore', '👁️', exploreActive)}
        ${modeButton('trainingBtn', 'Guided', '🎯', trainingActive)}
      </div>

      <div style="font-size:18px; font-weight:800; margin-bottom:6px;">
        Guided Training
      </div>

      <div style="height:8px; background:#e5e7eb; border-radius:999px; overflow:hidden; margin:10px 0 14px;">
        <div style="
          width:${((currentStep + 1) / trainingSteps.length) * 100}%;
          height:100%;
          background:linear-gradient(90deg,#22c55e,#16a34a);
        "></div>
      </div>

      <div style="color:#555; margin-bottom:10px;">
        Step ${currentStep + 1} of ${trainingSteps.length}
      </div>

      <div style="padding:12px; background:#f8fafc; border-radius:12px; border:1px solid #e5e7eb;">
        <b>Task:</b> ${step.instruction}
      </div>

      <div style="margin-top:14px; line-height:1.45;">
        ${message}
      </div>
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
      <div style="padding:12px; background:#f8fafc; border-radius:12px; border:1px solid #e5e7eb;">
        <b>Description:</b><br>
        ${getDescription(objectName)}
      </div>
    `);
    return;
  }

  const step = trainingSteps[currentStep];

  if (objectName === step.target) {
    currentStep++;

    if (currentStep >= trainingSteps.length) {
      updatePanel(`
        <div style="padding:12px; background:#dcfce7; color:#166534; border-radius:12px; border:1px solid #86efac;">
          <b>✅ Training complete!</b><br><br>
          Great job. You identified all key LMF components.
        </div>
      `);
      currentStep = 0;
      return;
    }

    updatePanel(`
      <div style="padding:12px; background:#dcfce7; color:#166534; border-radius:12px; border:1px solid #86efac;">
        <b>✅ Correct!</b><br><br>
        ${getDescription(objectName)}
      </div>
    `);
  } else {
    updatePanel(`
      <div style="padding:12px; background:#fee2e2; color:#991b1b; border-radius:12px; border:1px solid #fecaca;">
        <b>❌ Not correct.</b><br>
        Try again.
      </div>
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
