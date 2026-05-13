import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(5, 5, 10);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// GRID
const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

// LOAD GLB MODEL
const loader = new GLTFLoader();

loader.load(
  './models/LMF1.glb',

  function (gltf) {

    const model = gltf.scene;

    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);

    scene.add(model);

    console.log('LMF model loaded');

  },

  function (xhr) {

    console.log((xhr.loaded / xhr.total * 100) + '% loaded');

  },

  function (error) {

    console.error('Error loading model:', error);

  }
);

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
