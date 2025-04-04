import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let controller;
let reticle;
let model = null;

init();
animate();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Luz
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Controlador XR
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  // Retículo (local onde o objeto será colocado)
  const geometry = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // Hit test
  const session = renderer.xr.getSession();
  session.addEventListener('select', onSelect);

  renderer.xr.addEventListener('sessionstart', () => {
    session.requestReferenceSpace('viewer').then((refSpace) => {
      session.requestHitTestSource({ space: refSpace }).then((source) => {
        renderer.setAnimationLoop((timestamp, frame) => {
          if (frame) {
            const refSpace = renderer.xr.getReferenceSpace();
            const hitTestResults = frame.getHitTestResults(source);

            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(refSpace);

              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
            } else {
              reticle.visible = false;
            }
          }

          renderer.render(scene, camera);
        });
      });
    });
  });
}

function onSelect() {
  if (reticle.visible) {
    if (!model) {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      model = new THREE.Mesh(geometry, material);
      model.position.setFromMatrixPosition(reticle.matrix);
      model.quaternion.setFromRotationMatrix(reticle.matrix);
      scene.add(model);
    } else {
      model.position.setFromMatrixPosition(reticle.matrix);
      model.quaternion.setFromRotationMatrix(reticle.matrix);
    }
  }
}

function animate() {
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
