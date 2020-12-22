import * as THREE from './three.module.js'
import Thing from './thing.js'

export default class Character extends Thing {
  constructor () {
    super()
    this.pitch = 0
    this.yaw = 0

    this.position = new THREE.Vector3(-2, 5, -2)
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.look = new THREE.Vector3(0,0,0)

    this.height = 0.28
    this.width = 0.09
    this.jumpSpeed = 0.085

    this.onGround = false
    this.wasOnGround = false
  }

  canJump () {
    return this.onGround
  }

  jump () {
    if (this.canJump()) {
      this.velocity.y = this.jumpSpeed
    }
  }

  doGravity () {
    return !this.beingPulledByHook
  }

  doFriction () {
    return !this.beingPulledByHook
  }

  update (gameState) {
    // gravity
    if (this.doGravity()) {
      this.velocity.add(gameState.gravity)
    }

    // friction
    if (this.doFriction()) {
      this.velocity.x *= 0.9
      this.velocity.z *= 0.9
    }

    const map = gameState.map
    const width = this.width

    this.wasOnGround = this.onGround

    // floor
    this.onGround = false
    if (this.velocity.y < 0) {
      if (map.isSolidCoord(this.position.x + width, this.position.y + this.velocity.y - this.height, this.position.z + width)
      || map.isSolidCoord(this.position.x + width, this.position.y + this.velocity.y - this.height, this.position.z - width)
      || map.isSolidCoord(this.position.x - width, this.position.y + this.velocity.y - this.height, this.position.z + width)
      || map.isSolidCoord(this.position.x - width, this.position.y + this.velocity.y - this.height, this.position.z - width)) {
        this.position.y = Math.ceil(this.position.y + this.velocity.y - this.height) + this.height
        this.velocity.y = 0
        this.onGround = true
      }
    }

    // ceiling
    const headroom = 0.1
    this.onCeiling = false
    if (this.velocity.y > 0) {
      if (map.isSolidCoord(this.position.x + width, this.position.y + this.velocity.y + headroom, this.position.z + width)
      || map.isSolidCoord(this.position.x + width, this.position.y + this.velocity.y + headroom, this.position.z - width)
      || map.isSolidCoord(this.position.x - width, this.position.y + this.velocity.y + headroom, this.position.z + width)
      || map.isSolidCoord(this.position.x - width, this.position.y + this.velocity.y + headroom, this.position.z - width)) {
        this.position.y = Math.floor(this.position.y + this.velocity.y + headroom) - headroom
        this.velocity.y = -0.01
        this.onCeiling = true
      }
    }

    // walls
    this.onWall = false
    for (let x=-1*width; x<=1*width; x+=0.5*width) {
      for (let y=-0.9*this.height; y<=0; y+=0.1*this.height) {
        for (let z=-1*width; z<=1*width; z+=0.5*width) {
          if (map.isSolidCoord(this.position.x + x + this.velocity.x, this.position.y + y, this.position.z + z)) {
            this.velocity.x = 0
            this.onWall = true
          }

          if (map.isSolidCoord(this.position.x + x, this.position.y + y, this.position.z + z + this.velocity.z)) {
            this.velocity.z = 0
            this.onWall = true
          }

          // also test while incorporating more than one speed at a time
          if (map.isSolidCoord(this.position.x + x, this.position.y + y + this.velocity.y, this.position.z + z + this.velocity.z)) {
            this.velocity.z = 0
            this.velocity.y = 0
            this.onWall = true
          }

          if (map.isSolidCoord(this.position.x + x + this.velocity.x, this.position.y + y + this.velocity.y, this.position.z + z)) {
            this.velocity.x = 0
            this.velocity.y = 0
            this.onWall = true
          }

          if (map.isSolidCoord(this.position.x + x + this.velocity.x, this.position.y + y + this.velocity.y, this.position.z + z + this.velocity.z)) {
            this.velocity.x = 0
            this.velocity.y = 0
            this.velocity.z = 0
            this.onWall = true
          }
        }
      }
    }

    this.position.add(this.velocity)

    const worldFloor = 0
    this.position.y = Math.max(this.position.y, this.height)
    if (this.position.y <= worldFloor + this.height) {
      this.onGround = true
    }
    return true
  }
}
