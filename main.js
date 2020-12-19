import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r123/three.module.min.js'

function main () {
  const canvas = document.querySelector('#canvas')
  const renderer = new THREE.WebGLRenderer({ canvas })

  const scene = new THREE.Scene()

  const fov = 75
  const aspect = canvas.width / canvas.height
  const near = 0.1
  const far = 5
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

  camera.position.z = 2

  {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })

    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
  }

  function render () {
    renderer.render(scene, camera)
  }

  function update (dt) {
    /* TODO put stuff here. */
  }

  let lastTime = performance.now() / 1000.0
  function loop () {
    /* Calculate delta. */
    const dt = performance.now() / 1000.0 - lastTime
    lastTime += dt

    /* Update the canvas and camera. */
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    renderer.setSize(canvas.width, canvas.height)

    camera.aspect = canvas.width / canvas.height
    camera.updateProjectionMatrix()

    /* Update then render. */
    update(dt)
    render()

    requestAnimationFrame(loop)
  }

  loop()
}

main()
