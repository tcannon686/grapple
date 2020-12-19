import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r123/three.module.min.js'
import { GameState, GameStateStack } from './gamestate.js'

export const canvas = document.querySelector('#canvas')
export const renderer = new THREE.WebGLRenderer({ canvas })

function main () {
  const gameStateStack = new GameStateStack()
  gameStateStack.push(new GameState())

  function render () {
    const state = gameStateStack.peek()
    if (state) {
      state.render()
    }
  }

  function update (dt) {
    const state = gameStateStack.peek()
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
