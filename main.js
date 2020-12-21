'use strict'

const canvas = document.getElementById('theCanvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })

const gameStateStack = new GameStateStack()
const print = console.log

let lastTime
let hasLockedPointer = false
let TimeAccumulator = 0
const TimeStep = 1/60
const TextureLoader = new THREE.TextureLoader()

const DebugModes = {
  editingLevel: false,
  flying: true
}

function Start () {
  gameStateStack.push(new GameState())
  lastTime = performance.now() / 1000.0
}

function Update (dt) {
  const state = gameStateStack.peek()
  if (state) {
    state.update(dt)
  }
}

function Render () {
  const state = gameStateStack.peek()
  if (state) {
    state.render()
  }
}

function Loop () {
  /* Calculate delta. */
  const dt = performance.now() / 1000.0 - lastTime
  lastTime += dt

  /* Update the canvas and camera. */
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  renderer.setSize(canvas.width, canvas.height)

  /* Update then render. */
  TimeAccumulator += dt

  // fixed timestep
  while (TimeAccumulator > TimeStep) {
    TimeAccumulator -= TimeStep
    Update(TimeStep)
  }

  Render()

  requestAnimationFrame(Loop)
}

// locks the pointer when you click
canvas.onclick = () => {
  canvas.requestPointerLock()
  hasLockedPointer = true
}

Start()
Loop()
