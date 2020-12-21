'use strict';

const GAMEMAP_AIR = 0
const GAMEMAP_WALL = 1
const GAMEMAP_ENEMY = 2
const GAMEMAP_MESHSIZE = 10

const GAMEMAP_MAP_THINGS = {
  [GAMEMAP_ENEMY]: (x,y,z) => new Enemy(x, y, z)
}

/* Press 1 to add enemy. */
const KEY_TO_THING = {
  49: GAMEMAP_ENEMY
}

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
  constructor (gameState, name) {
    this.name = name

    // check if a map with this name already exists
    // load it if there is, otherwise create a new map
    let get = Levels[this.name]
    if (get) {
      this.map = get
    } else {
      this.map = {}
      this.createRandom(20,40)
    }

    const material = new THREE.MeshPhongMaterial({ map: TextureLoader.load("textures/wall.png") })
    this.meshList = []
    this.meshChangedList = []
    for (let i=0; i<this.map.height/GAMEMAP_MESHSIZE; i++) {
      this.meshChangedList[i] = true
      this.meshList[i] = new THREE.Mesh(new THREE.BoxBufferGeometry(), material)
      gameState.scene.add(this.meshList[i])
    }

    this.updateMesh()

    document.addEventListener("keydown", (event) => {
      // press enter to save the current level
      if (event.keyCode == 13) {
        this.saveLevel("level.json", this.map)
      }
    })

    /* A list of things placed by calling placeThings. */
    this.things = []
  }

  saveLevel (filename, data) {
    let element = document.createElement('a')
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  createRandom (width, height) {
    this.map.arrayData = []
    this.map.width = width
    this.map.height = height

    for (let x = 0; x < width; x++) {
      this.map.arrayData[x] = []
      for (let y = 0; y < height; y++) {
        this.map.arrayData[x][y] = []
        for (let z = 0; z < width; z++) {
          this.map.arrayData[x][y][z] = 1
        }
      }
    }
  }

  updateMesh () {
    for (let index=0; index<this.map.height/GAMEMAP_MESHSIZE; index++) {
      if (!this.meshChangedList[index]) { continue }
      this.meshChangedList[index] = false

      let positions = []
      let uvs = []
      const addVert = (x,y,z, u,v) => {
        positions.push(x)
        positions.push(y)
        positions.push(z)
        uvs.push(u)
        uvs.push(v)
      }

      let width = this.map.width
      let height = Math.min(this.map.height, GAMEMAP_MESHSIZE)
      for (let x = 0; x < width; x++) {
        for (let y = index*GAMEMAP_MESHSIZE; y < height + index*GAMEMAP_MESHSIZE; y++) {
          for (let z = 0; z < width; z++) {
            // if a block exists
            if (this.getCoord(x,y,z) === GAMEMAP_WALL) {
              let x0 = x
              let y0 = y
              let z0 = z
              let x1 = x+1
              let y1 = y+1
              let z1 = z+1

              // add each face individually

              // + x
              if (this.getCoord(x+1,y,z) !== GAMEMAP_WALL) {
                addVert(x1,y0,z0, 0,0)
                addVert(x1,y1,z0, 1,0)
                addVert(x1,y0,z1, 0,1)

                addVert(x1,y1,z0, 1,0)
                addVert(x1,y1,z1, 1,1)
                addVert(x1,y0,z1, 0,1)
              }

              // - x
              if (this.getCoord(x-1,y,z) !== GAMEMAP_WALL) {
                addVert(x0,y1,z0, 1,0)
                addVert(x0,y0,z0, 0,0)
                addVert(x0,y0,z1, 0,1)

                addVert(x0,y1,z1, 1,1)
                addVert(x0,y1,z0, 1,0)
                addVert(x0,y0,z1, 0,1)
              }

              // + z
              if (this.getCoord(x,y,z+1) !== GAMEMAP_WALL) {
                addVert(x0,y0,z1, 0,0)
                addVert(x1,y0,z1, 1,0)
                addVert(x0,y1,z1, 0,1)

                addVert(x1,y0,z1, 1,0)
                addVert(x1,y1,z1, 1,1)
                addVert(x0,y1,z1, 0,1)
              }

              // - z
              if (this.getCoord(x,y,z-1) !== GAMEMAP_WALL) {
                addVert(x1,y0,z0, 1,0)
                addVert(x0,y0,z0, 0,0)
                addVert(x0,y1,z0, 0,1)

                addVert(x1,y1,z0, 1,1)
                addVert(x1,y0,z0, 1,0)
                addVert(x0,y1,z0, 0,1)
              }

              // + y
              if (this.getCoord(x,y+1,z) !== GAMEMAP_WALL) {
                addVert(x1,y1,z0, 1,0)
                addVert(x0,y1,z0, 0,0)
                addVert(x0,y1,z1, 0,1)

                addVert(x1,y1,z1, 1,1)
                addVert(x1,y1,z0, 1,0)
                addVert(x0,y1,z1, 0,1)
              }

              // - y
              if (this.getCoord(x,y-1,z) !== GAMEMAP_WALL) {
                addVert(x0,y0,z0, 0,0)
                addVert(x1,y0,z0, 1,0)
                addVert(x0,y0,z1, 0,1)

                addVert(x1,y0,z0, 1,0)
                addVert(x1,y0,z1, 1,1)
                addVert(x0,y0,z1, 0,1)
              }
            }
          }
        }
      }

      let geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))
      geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2))
      geometry.computeVertexNormals()
      this.meshList[index].geometry = geometry
    }
  }

  /* Places the things on the map. */
  placeThings (gameState) {
    this.clearThings(gameState)

    const width = this.map.width
    const height = this.map.height

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < width; z++) {
          const factory = GAMEMAP_MAP_THINGS[this.getCoord(x, y, z)]
          if(factory) {
            const thing = factory(x + 0.5, y + 0.5, z + 0.5)
            gameState.add(thing)
            this.things.push(thing)
          }
        }
      }
    }
  }

  /* Remove the things placed using placeThings from the map. */
  clearThings (gameState) {
    this.things.forEach((thing) => {
      /* Force remove of the thing. */
      thing.update = () => false
    })
    this.things.splice(0)
  }

  raycast (from, direction, maxDistance) {
    let raypos = from.clone()
    let distance = 0
    const step = 0.1
    maxDistance = maxDistance || 10

    while (distance < maxDistance && !this.get(raypos)) {
      raypos = raypos.addScaledVector(direction, step)
      distance += step
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

      const meshIndex = Math.floor(vy/GAMEMAP_MESHSIZE)
      if (vy%GAMEMAP_MESHSIZE == 0) {
        this.meshChangedList[Math.max(meshIndex-1, 0)] = true
      }
      if (vy%GAMEMAP_MESHSIZE == GAMEMAP_MESHSIZE-1) {
        this.meshChangedList[Math.min(meshIndex+1, this.meshChangedList.length-1)] = true
      }
      this.meshChangedList[meshIndex] = true
    }
  }

  isSolid (vector) {
    return this.isSolidCoord(vector.x,vector.y,vector.z)
  }

  isSolidCoord (x,y,z) {
    let get = this.getCoord(x,y,z) === GAMEMAP_WALL
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
    this.map = new GameMap(this, "testmap3")
    //this.scene.add(this.map.mesh)
    //this.scene.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshPhongMaterial({map: TextureLoader.load("textures/wall1.png")})))

    this.scene.add(new THREE.AmbientLight(0x404040))
    const sunlight = new THREE.DirectionalLight(0x999999)
    sunlight.position.set(-1,1,-1)
    /*
    let target = new THREE.Object3D()
    target.position.x = 1
    target.position.y = -1
    target.position.z = 1
    sunlight.target = target
    */
    this.scene.add(sunlight)
    //this.scene.add(new THREE.DirectionalLightHelper(sunlight, 5))


    this.things = []

    this.gravity = new THREE.Vector3(0, -0.005, 0)

    //this.scene.add(new THREE.GridHelper(4, 10))
    //this.scene.add(new THREE.AxesHelper())

    // add sky
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: TextureLoader.load("textures/sunrise.png"),
      side: THREE.DoubleSide
    })
    this.scene.add(new THREE.Mesh(new THREE.SphereBufferGeometry(1000, 24,8), skyMaterial))

    /* Add the player. */
    this.player = new Player() 
    this.add(this.player)
    this.add(this.player.hook)
  }

  update () {
    for (let i = 0; i < this.things.length; i++) {
      if (this.things[i].update && !this.things[i].update(this)) {
        this.things[i].onExitScene(this)
        this.things.splice(i--, 1)
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
