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

    // set up the camera
    this.camera = new THREE.PerspectiveCamera(90, canvas.width / canvas.height, 0.1, 1000)
    this.pitch = 0
    this.yaw = -1*Math.PI
    this.camera.position.z = 2

    // set up the map
    this.map = new GameMap(20,20)
    this.scene.add(this.map.getMesh())
  }

  update () {
    this.camera.aspect = canvas.width / canvas.height
    this.camera.updateProjectionMatrix()
  }

  render () {
    renderer.render(this.scene, this.camera)
  }

  mousemove (dx,dy) {
    this.yaw += dx/-500
    this.pitch += dy/300
    this.pitch = Math.min(this.pitch, Math.PI/2)
    this.pitch = Math.max(this.pitch, Math.PI/-2)

    let sign = Math.cos(this.pitch)
    if (sign > 0) {
        sign = 1
    }
    else if (sign < 0) {
        sign = -1
    }
    else {
        sign = 0
    }

    const cosPitch = sign*Math.max(Math.abs(Math.cos(this.pitch)), 0.001)
    this.camera.lookAt(
      this.camera.position.x+Math.sin(this.yaw)*cosPitch,
      this.camera.position.y-Math.sin(this.pitch),
      this.camera.position.z+Math.cos(this.yaw)*cosPitch
    )
  }
}
