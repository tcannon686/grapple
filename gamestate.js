'use strict';

class GameStateStack {
  constructor () {
    this.gameStateStack = []
  }

  push (gameState) {
    this.gameStateStack.push(gameState)
  }

  pop (gameState) {
    return this.gameStateStack.pop()
  }

  clear () {
    this.gameStateStack = []
  }

  jump (gameState) {
    this.clear()
    this.push(gameState)
  }

  peek () {
    return this.gameStateStack[this.gameStateStack.length - 1]
  }
}

class GameMap {
  constructor (width, height) {
    this.map = []
    this.geometry = new THREE.Geometry()

    for (let x = 0; x < width; x++) {
      this.map[x] = []
      for (let y = 0; y < height; y++) {
        this.map[x][y] = []
        for (let z = 0; z < width; z++) {
          this.map[x][y][z] = Math.floor(Math.random() + 0.5)

          // only add a block if there's supposed to be a block here
          if (this.map[x][y][z] === 1) {
            this.geometry.merge(new THREE.BoxGeometry(1,1,1).translate(x,y,z))
          }
        }
      }
    }
  }

  getMesh () {
    let material = new THREE.MeshNormalMaterial()
    return new THREE.Mesh(this.geometry, material)
  }

  getBlock (x,y,z) {
    return this.map[x][y][z]
  }
}

class GameState {
  constructor () {
    this.scene = new THREE.Scene()

    // set up the map
    this.map = new GameMap(20,20)
    this.scene.add(this.map.getMesh())

    this.things = []
    /* Add the player. */
    this.add(new Player())
  }

  update (dt) {
    for (let i = 0; i < this.things.length; i++) {
      if (this.things[i].update && !this.things[i].update(dt)) {
        this.things[i].splice(i--, 1)
      }
    }
  }

  render () {
    renderer.render(this.scene, this.camera)
  }

  add (thing) {
    this.things.push(thing)
    thing.onEnterScene(this)
  }
}
