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

class GameState {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(90, canvas.width / canvas.height, 0.1, 1000)
    this.pitch = 0
    this.yaw = 0
    this.cameraPosition = [0,0,0]

    // define the map
    const map = []
    const MapSize = 2
    const MapHeight = 2

    // const material = new THREE.MeshBasicMaterial({ color: 0x050505 })
    const material = new THREE.MeshNormalMaterial()
    for (let x = 0; x < MapSize; x++) {
      map[x] = []
      for (let y = 0; y < MapHeight; y++) {
        map[x][y] = []
        for (let z = 0; z < MapSize; z++) {
          map[x][y][z] = Math.floor(Math.random() + 0.5)

          // only add a block if there's a block here
          if (map[x][y][z] === 1) {
            const geometry = new THREE.BoxGeometry(1, 1, 1)
            geometry.translate(x, y, z)
            this.scene.add(new THREE.Mesh(geometry, material))
          }
        }
      }
    }

    this.camera.position.z = 2
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
