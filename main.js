import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r123/three.module.min.js'
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#canvas')
const renderer = new THREE.WebGLRenderer({ canvas })

class GameStateStack
{
  constructor () {
    this.gameStateStack = []
  }

  push(gameState) {
    this.gameStateStack.push(gameState)
  }

  pop(gameState) {
    return this.gameStateStack.pop()
  }

  clear() {
    this.gameStateStack = []
  }

  jump (gameState) {
    this.clear()
    this.push(gameState)
  }

  peek () {
    return this.gameStateStack[this.gameStateStack.length-1]
  }
}

class GameState
{
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(90, canvas.width/canvas.height, 0.1, 1000)
    this.controls = new OrbitControls(this.camera, renderer.domElement)

    // define the map
    const map = []
    const MapSize = 2
    const MapHeight = 2

    //const material = new THREE.MeshBasicMaterial({ color: 0x050505 })
    const material = new THREE.MeshNormalMaterial()
    for (let x=0; x<MapSize; x++)
    {
      map[x] = []
      for (let y=0; y<MapHeight; y++)
      {
        map[x][y] = []
        for (let z=0; z<MapSize; z++)
        {
          map[x][y][z] = Math.floor(Math.random() + 0.5)

          // only add a block if there's a block here
          if (map[x][y][z] == 1)
          {
            const geometry = new THREE.BoxGeometry(1, 1, 1)
            geometry.translate(x,y,z)
            this.scene.add(new THREE.Mesh(geometry, material))
          }
        }
      }
    }

    this.camera.position.z = 2
  }

  render () {
    renderer.render(this.scene, this.camera)
  }

  update () {
    this.camera.aspect = canvas.width / canvas.height
    this.camera.updateProjectionMatrix()
    this.controls.update()
  }
}

function main () {
  let gameStateStack = new GameStateStack()
  gameStateStack.push(new GameState())

  function render () {
    let state = gameStateStack.peek()
    if (state) {
      state.render()
    }
  }

  function update (dt) {
    let state = gameStateStack.peek()
    if (state) {
      state.update(dt)
    }
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

    /* Update then render. */
    update(dt)
    render()

    requestAnimationFrame(loop)
  }

  loop()
}

main()
