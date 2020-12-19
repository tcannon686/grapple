'use strict';

const canvas = document.getElementById("theCanvas")
const renderer = new THREE.WebGLRenderer({canvas})
const gameStateStack = new GameStateStack()
const print = console.log
let lastTime
let hasLockedPointer = false

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
  Update(dt)
  Render()

  requestAnimationFrame(Loop)
}

// send mousemove event to the top gamestate
document.addEventListener("mousemove", (event) => {
  const state = gameStateStack.peek()
  if (state) {
    state.mousemove(event.movementX, event.movementY)
  }
}, false)

// locks the pointer when you click
canvas.onclick = () => {
  canvas.requestPointerLock()
  hasLockedPointer = true
}

Start()
Loop()
