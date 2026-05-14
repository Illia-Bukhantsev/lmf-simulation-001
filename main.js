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

// INFO PANEL
const infoPanel = document.createElement('div');
infoPanel.style.position = 'absolute';
infoPanel.style.top = '20px';
infoPanel.style.left = '20px';
infoPanel.style.padding = '14px 18px';
infoPanel.style.background = 'rgba(255, 255, 255, 0.92)';
infoPanel.style.border = '1px solid #dddddd';
infoPanel.style.borderRadius = '12px';
infoPanel.style.fontFamily = 'Arial, sans-serif';
infoPanel.style.fontSize = '15px';
infoPanel.style.maxWidth = '340px';
infoPanel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
infoPanel.style.zIndex = '10';
infoPanel.innerHTML = '<b>Select a component</b><br>Click any part of the LMF model.';
document.body.appendChild(infoPanel);

// COMPONENT DESCRIPTIONS
const descriptions = {
  ladle: 'The ladle holds molten steel during treatment.',
  electrode: 'Electrodes provide electrical energy for heating.',
  roof: 'The roof covers the ladle during furnace operation.',
  arm: 'The arm moves and positions furnace equipment.',
  hopper: 'The hopper is used for alloy or additive feeding.',
  pipe: 'Pipes transfer gases, additives, or support auxiliary systems.',
  platform: 'The platform supports the LMF equipment.',
  car: 'The ladle car transports the ladle into position.',
  cable: 'Cables provide electrical or control connections.',
  panel: 'The panel represents the control or service area.'
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
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.18 });

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.receiveShadow = true;
scene.add(floor);

// SELECTION SYSTEM
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;
let originalMaterial = null;

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

// CLICK TO SELECT OBJECT
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length === 0) {
    return;
  }

  const clickedObject = intersects[0].object;

  if (!clickedObject.isMesh || clickedObject === floor) {
    return;
  }

  if (selectedObject && originalMaterial) {
    selectedObject.material = originalMaterial;
  }

  selectedObject = clickedObject;
  originalMaterial = clickedObject.material;

  const highlightMaterial = clickedObject.material.clone();
  highlightMaterial.emissive = new THREE.Color(0x333333);
  highlightMaterial.emissiveIntensity = 0.8;

  selectedObject.material = highlightMaterial;

  const objectName = selectedObject.name || 'Unknown component';

  let description = 'No description added yet for this component.';

  for (const key in descriptions) {
    if (objectName.toLowerCase().includes(key)) {
      description = descriptions[key];
      break;
    }
  }

  infoPanel.innerHTML = `
    <b>Selected:</b> ${objectName}<br><br>
    <b>Description:</b><br>
    ${description}
  `;

  console.log('Selected object:', objectName);
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
