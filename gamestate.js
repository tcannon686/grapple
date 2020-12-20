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

    const textureLoader = new THREE.TextureLoader()
    let material = new THREE.MeshBasicMaterial({map: textureLoader.load("textures/wall1.png")})
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), material)

    // check if a map with this name already exists
    // load it if there is, otherwise create a new map
    let get = Levels[this.name]
    if (get) {
      this.map = get
    } else {
      this.map = {}
      this.createRandom(20,20)
    }

    if (DebugModes.editingLevel) {
      document.addEventListener("keydown", (event) => {
        // press enter to save the current level
        if (event.keyCode == 13) {
          this.saveLevel("level.json", this.map)
        }
      })
    }
  }

  saveLevel (filename, data) {
    var element = document.createElement('a')
    element.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`)
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
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

  updateMesh () {
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

    this.geometry.translate(+0.5,+0.5,+0.5)
    this.mesh.geometry = this.geometry
  }

  raycast (from, direction) {
    let raypos = from.clone()

    while (true) {
      if (this.get(raypos) === undefined || this.get(raypos)) {
        break
      }

      raypos = raypos.addScaledVector(direction, 0.1)
    }

    return raypos
  }

  get (vector) {
    return this.getCoord(vector.x,vector.y,vector.z)
  }

  set (vector, value) {
    this.setCoord(vector.x,vector.y,vector.z, value)
  }

  getCoord (x,y,z) {
    let vx = Math.floor(x)
    let vy = Math.floor(y)
    let vz = Math.floor(z)
    return this.map.arrayData[vx] && this.map.arrayData[vx][vy] && this.map.arrayData[vx][vy][vz]
  }

  setCoord (x,y,z, value) {
    let vx = Math.floor(x)
    let vy = Math.floor(y)
    let vz = Math.floor(z)
    if (this.map.arrayData[vx] !== undefined
      && this.map.arrayData[vx][vy] !== undefined
      && this.map.arrayData[vx][vy][vz] !== undefined)
    {
      this.map.arrayData[vx][vy][vz] = value
    }
  }

  isSolid (vector) {
    return this.isSolidCoord(vector.x,vector.y,vector.z)
  }

  isSolidCoord (x,y,z) {
    let get = this.getCoord(x,y,z)
    return get || y <= 0
  }

  getOverlap(x, y, z) {
    const pos = [x, y, z]
    const min = pos.map(Math.floor)
    const max = pos.map(Math.ceil)

    if (this.getCoord(...min)) {
      // Move to the shortest of the sides.
      const deltas = min.map((x, i) => x - pos[i])
        .concat(max.map((x, i) => x - pos[i]))
      const minIndex = deltas.reduce(
        (m, e, i, a) => Math.abs(e) < Math.abs(a[m]) ? i : m,
        0)
      const moveAmount = new THREE.Vector3()
      moveAmount.setComponent(minIndex % 3, deltas[minIndex])

      return moveAmount
    }
    return null
  }
}

class GameState {
  constructor () {
    this.scene = new THREE.Scene()

    // set up the map
    this.map = new GameMap("testmap3")
    this.map.updateMesh()
    this.scene.add(this.map.mesh)

    this.things = []
    /* Add the player. */
    this.player = new Player() 
    this.add(this.player)
    this.add(this.player.hook)

    this.gravity = new THREE.Vector3(0, -0.005, 0)

    // console.log(this.things)
  }

  update () {
    for (let i = 0; i < this.things.length; i++) {
      if (this.things[i].update && !this.things[i].update(this)) {
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
