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
    //this.controls = new OrbitControls(this.camera, renderer.domElement)

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
    //this.controls.update()
    //this.camera.rotation.y += 0.05
  }

  render () {
    renderer.render(this.scene, this.camera)
  }

  mouseMove () {
  }
}
