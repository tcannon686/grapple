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
  constructor (name) {
    this.name = name

    // check if a map with this name already exists
    // load it if there is, otherwise create a new map
    let get = GetItem(this.name)
    if (get) {
      this.map = get
      print(this.map)
    } else if (confirm("Create a new map named \"" + this.name + "\"?")) {
      let width = parseInt(prompt("Width of \"" + this.name + "\"", "20"))
      let height = parseInt(prompt("Height of \"" + this.name + "\"", "20"))

      this.map = {}
      this.createRandom(width,height)
      StoreItem(this.name, this.map)
    }
  }

  // fill the map with random blocks
  createRandom (width, height) {
    this.map.arrayData = []
    this.map.width = width
    this.map.height = height

    for (let x = 0; x < width; x++) {
      this.map.arrayData[x] = []
      for (let y = 0; y < height; y++) {
        this.map.arrayData[x][y] = []
        for (let z = 0; z < width; z++) {
          this.map.arrayData[x][y][z] = Math.floor(Math.random() + 0.5)
        }
      }
    }
  }

  getMesh () {
    this.geometry = new THREE.Geometry()

    let width = this.map.width
    let height = this.map.height
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < width; z++) {
          if (this.map.arrayData[x][y][z] === 1) {
            this.geometry.merge(new THREE.BoxGeometry(1,1,1).translate(x,y,z))
          }
        }
      }
    }

    const textureLoader = new THREE.TextureLoader()
    let material = new THREE.MeshBasicMaterial({map: textureLoader.load("textures/wall1.png")})
    return new THREE.Mesh(this.geometry, material)
  }

  getBlock (x,y,z) {
    return this.map.arrayData[x][y][z]
  }
}

class GameState {
  constructor () {
    this.scene = new THREE.Scene()

    // set up the map
    this.map = new GameMap("testmap3")
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
