'use strict';

import * as THREE from './three.module.js'
import { Levels } from './levels.js'
import { TextureLoader, renderer } from './main.js'
import CollisionPruner from './collisionpruner.js'
import Player from './player.js'
import Enemy from './enemy.js'

export const GAMEMAP_AIR = 0
export const GAMEMAP_WALL = 1
export const GAMEMAP_ENEMY = 2
export const GAMEMAP_MESHSIZE = 10

export const GAMEMAP_MAP_THINGS = {
  [GAMEMAP_ENEMY]: (x,y,z) => new Enemy(x, y, z)
}

/* Press 1 to add enemy. */
export const KEY_TO_THING = {
  49: GAMEMAP_ENEMY
}

export class GameStateStack {
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

export class GameMap {
  constructor (gameState, name) {
    this.name = name

    // check if a map with this name already exists
    // load it if there is, otherwise create a new map
    let get = Levels[this.name]
    if (get) {
      this.map = get
    } else {
      this.map = {}
      this.map.arrayData = []
      this.map.width = 60
      this.map.height = 20

      //this.createRandom(20,40)
      for (let x = 0; x < this.map.width; x++) {
        this.map.arrayData[x] = []
        for (let y = 0; y < this.map.height; y++) {
          this.map.arrayData[x][y] = []
          for (let z = 0; z < this.map.width; z++) {
            this.map.arrayData[x][y][z] = y == 0 && Math.pow(x-this.map.width/2,2) + Math.pow(z-this.map.width/2,2) <= 25 ? 1 : 0
          }
        }
      }
    }

    const material = new THREE.MeshPhongMaterial({ map: TextureLoader.load("textures/wall.png") })
    this.meshList = []
    this.meshMap = {}
    this.meshChangedList = []
    for (let x=0; x<this.map.width; x+=GAMEMAP_MESHSIZE) {
      for (let z=0; z<this.map.width; z+=GAMEMAP_MESHSIZE) {
        for (let y=0; y<this.map.height; y+=GAMEMAP_MESHSIZE) {
          const meshIndex = this.getMeshName(x,y,z)
          this.addMeshChange(x,y,z)
          this.meshMap[meshIndex] = new THREE.Mesh(new THREE.BoxBufferGeometry(), material)
          gameState.scene.add(this.meshMap[meshIndex])
        }
      }
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

  getMeshName (x,y,z) {
    return "" + Math.floor(x/GAMEMAP_MESHSIZE) + ", " + Math.floor(y/GAMEMAP_MESHSIZE) + ", " + Math.floor(z/GAMEMAP_MESHSIZE)
  }

  addMeshChange (x,y,z) {
    const meshCoords = [Math.floor(x/GAMEMAP_MESHSIZE)*GAMEMAP_MESHSIZE,Math.floor(y/GAMEMAP_MESHSIZE)*GAMEMAP_MESHSIZE,Math.floor(z/GAMEMAP_MESHSIZE)*GAMEMAP_MESHSIZE]
    if (!this.meshChangedList.includes(meshCoords)) {
      this.meshChangedList.push(meshCoords)
      //console.log(meshCoords)
    }
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

  /*
  createRandom (width, height) {
    for (let x = 0; x < width; x++) {
      this.map.arrayData[x] = []
      for (let y = 0; y < height; y++) {
        this.map.arrayData[x][y] = []
        for (let z = 0; z < width; z++) {
          this.map.arrayData[x][y][z] = (y%4 == 1 || z%4 == 1) && x%4 > 0 ? 1 : 0
        }
      }
    }
  }
  */

  updateMesh () {
    for (const key in this.meshChangedList) {
      const coord = this.meshChangedList[key]
      const meshCoord = [Math.floor(coord[0]/GAMEMAP_MESHSIZE), Math.floor(coord[1]/GAMEMAP_MESHSIZE), Math.floor(coord[2]/GAMEMAP_MESHSIZE)]
      const startingCoord = [meshCoord[0]*GAMEMAP_MESHSIZE, meshCoord[1]*GAMEMAP_MESHSIZE, meshCoord[2]*GAMEMAP_MESHSIZE]
      const name = this.getMeshName(coord[0], coord[1], coord[2])

      if (!this.meshMap[name]) {
        continue;
      }

      let positions = []
      let uvs = []
      const addVert = (x,y,z, u,v) => {
        positions.push(x)
        positions.push(y)
        positions.push(z)
        uvs.push(u)
        uvs.push(v)
      }

      for (let x = startingCoord[0]; x < startingCoord[0] + GAMEMAP_MESHSIZE; x++) {
        for (let y = startingCoord[1]; y < startingCoord[1] + GAMEMAP_MESHSIZE; y++) {
          for (let z = startingCoord[2]; z < startingCoord[2] + GAMEMAP_MESHSIZE; z++) {
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
      this.meshMap[name].geometry = geometry
    }

    this.meshChangedList = []
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
      this.addMeshChange(vx,vy,vz)
      this.addMeshChange(vx-1,vy,vz)
      this.addMeshChange(vx,vy-1,vz)
      this.addMeshChange(vx,vy,vz-1)
      this.addMeshChange(vx+1,vy,vz)
      this.addMeshChange(vx,vy+1,vz)
      this.addMeshChange(vx,vy,vz+1)
    }
  }

  isSolid (vector) {
    return this.isSolidCoord(vector.x,vector.y,vector.z)
  }

  isSolidCoord (x,y,z) {
    let get = this.getCoord(x,y,z) === GAMEMAP_WALL
    return get
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

export class GameState {
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


    this.collisionPruner = new CollisionPruner()
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
    this.player = new Player(this.map.map.width/2 + 0.5,2.5,this.map.map.width/2 + 0.5)
    this.add(this.player)
    this.add(this.player.hook)
  }

  handleCollisions () {
    this.collisionPruner.update()
    /* Handle collisions. */
    for (let list of this.collisionPruner.getOverlappingObjects()) {
      for(let o1 of list) {
        for(let o2 of list) {
          if(o1 == o2) {
            continue
          }

          let dist = o1.position.distanceToSquared(o2.position)
          const r = 0.5
          if(dist <= r ** 2) {
            dist = Math.sqrt(dist)

            /* Collision occured. */
            if (o1.onCollision) {
              o1.onCollision(this, o2)
            }
            if (o2.onCollision) {
              o2.onCollision(this, o1)
            }
            
            const overlap = new THREE.Vector3()
            overlap.copy(o1.position)
            overlap.sub(o2.position)

            const cancelVelocity = new THREE.Vector3()
            
            overlap.multiplyScalar((r - dist) / 2)

            o1.position.add(overlap)

            cancelVelocity.copy(o1.velocity)
            cancelVelocity.projectOnVector(overlap)
            o1.velocity.sub(cancelVelocity)

            cancelVelocity.copy(o2.velocity)
            cancelVelocity.projectOnVector(overlap)
            o2.position.sub(overlap)
            o2.velocity.sub(cancelVelocity)
          }
        }
      }
    }
  }

  update () {
    this.handleCollisions()
    for (let i = 0; i < this.things.length; i++) {
      if (this.things[i].update && !this.things[i].update(this)) {
        this.things[i].onExitScene(this)
        this.collisionPruner.remove(this.things[i])
        this.things.splice(i--, 1)
      }
    }
  }

  render () {
    renderer.render(this.scene, this.camera)
  }

  add (thing) {
    this.things.push(thing)
    this.collisionPruner.add(thing)
    thing.onEnterScene(this)
  }
}
