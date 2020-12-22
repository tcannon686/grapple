import Character from './character.js'
import {
  Hook,
  HOOK_REELING,
  HOOK_HOLDING,
  HOOK_LATCHED,
  HOOK_SHOOTING
} from './hook.js'
import {
  GAMEMAP_AIR,
  GAMEMAP_WALL,
  GAMEMAP_ENEMY,
  GAMEMAP_MAP_THINGS,
  KEY_TO_THING
} from './gamestate.js'

import {
  DebugModes,
  canvas
} from './main.js'

import * as THREE from './three.module.js'

export default class Player extends Character {
  constructor (x,y,z) {
    super()
    this.camera = new THREE.PerspectiveCamera(90, canvas.width / canvas.height, 0.001, 5000)

    this.beingPulledByHook = false
    this.speed = 0.009
    this.jumpSpeed = 0.08
    this.lastVelocity = new THREE.Vector3()

    this.height = 0.8
    this.width = 0.15

    this.position.set(x,y,z)
    this.lastSafePoint = this.position.clone()

    // create grappling hook and add it to the gamestate
    this.hook = new Hook()
    this.isKeyDown = {}
  }

  doGravity () {
    return !this.beingPulledByHook && !this.isFlying()
  }

  doFriction () {
    return (!this.beingPulledByHook && this.onGround) || this.isFlying()
  }

  isFlying () {
    return DebugModes.editingLevel
  }

  update (gameState) {
    this.camera.aspect = canvas.width / canvas.height
    this.camera.updateProjectionMatrix()

    // basic movement
    let dirX = 0.0
    let dirZ = 0.0
    if (this.isKeyDown.A) {
      dirX -= 1.0
    }
    if (this.isKeyDown.D) {
      dirX += 1.0
    }
    if (this.isKeyDown.S) {
      dirZ += 1.0
    }
    if (this.isKeyDown.W) {
      dirZ -= 1.0
    }

    let speed = this.speed

    if (this.isFlying()) {
      this.velocity.y *= 0.9
      speed *= 3

      if (this.isKeyDown['SHIFT']) {
        this.velocity.y -= speed
      }

      if (this.isKeyDown[' ']) {
        this.velocity.y += speed
      }
    }

    const len = Math.sqrt(dirX * dirX + dirZ * dirZ)

    if (len > 0) {
      dirX *= speed / len
      dirZ *= speed / len

      const left = new THREE.Vector3()
      const forward = new THREE.Vector3()
      const up = new THREE.Vector3()

      this.camera.matrix.extractBasis(left, up, forward)

      left.y = 0
      forward.y = 0

      left.normalize()
      forward.normalize()

      left.multiplyScalar(dirX)
      forward.multiplyScalar(dirZ)

      this.lastVelocity.copy(this.velocity)
      this.velocity.add(left)
      this.velocity.add(forward)

      // clamp the X and Z velocity components
      // so that the vector length can never increase while in the air
      const lastLength = Math.sqrt(Math.pow(this.lastVelocity.x, 2) + Math.pow(this.lastVelocity.z, 2))
      const length = Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.z, 2))
      if (!this.doFriction() && !this.isFlying() && lastLength < length) {
        const lastVelocityY = this.velocity.y
        this.velocity.y = 0
        this.velocity.clampLength(0, lastLength)
        this.velocity.y = lastVelocityY
      }
    }

    super.update(gameState)
    this.camera.position.copy(this.position)

    if (this.hook.state == HOOK_REELING) {
      const playerDistance = this.position.distanceTo(this.hook.shootModel.position)
      if (playerDistance+0.025 >= this.hook.playerDistance) {
        this.hook.reset()
      }
      this.hook.playerDistance = playerDistance
    }

    // save the last point the player was on the ground as their last safe point
    /*
    if (this.onGround) {
      this.lastSafePoint.copy(this.position)
    }
    */

    if (this.position.y < 0) {
      console.log(this.lastSafePoint)
      this.position.copy(this.lastSafePoint)
      this.velocity.set(0,0,0)
    }

    return true
  }

  onEnterScene (gameState) {
    gameState.camera = this.camera

    // send mousemove event to the top gamestate
    this.onMouseMove = (e) => this.mousemove(e.movementX, e.movementY)
    document.addEventListener(
      'mousemove',
      this.onMouseMove)

    this.onKeyDown = (e) => {
      const last = this.isKeyDown[e.key.toUpperCase()]
      this.isKeyDown[e.key.toUpperCase()] = true

      if (e.keyCode == 32 && !last) {
        this.jump()
        if (this.hook.state == HOOK_REELING) {
          this.hook.reset()
        }
      }

      if ((e.keyCode == 65 || e.keyCode == 68 || e.keyCode == 83 || e.keyCode == 87) && !last) {
        if (this.hook.state == HOOK_REELING) {
          this.hook.reset()
        }
      }

      // toggle editing level by pressing E
      if (e.keyCode == 69) {
        DebugModes.editingLevel = !DebugModes.editingLevel
        // replace things
        gameState.map.placeThings(gameState)
      }

      if(DebugModes.editingLevel) {
        if (KEY_TO_THING[e.keyCode]) {
          let hitPosition = gameState.map.raycast(this.position, this.look)
          hitPosition = hitPosition.addScaledVector(this.look, -0.1)

          if (gameState.map.get(hitPosition) !== undefined) {
            gameState.map.set(hitPosition, KEY_TO_THING[e.keyCode])
            gameState.map.placeThings(gameState)
          }
        }
      }
    }

    this.onKeyUp = (e) => {
      this.isKeyDown[e.key.toUpperCase()] = false
    }

    this.mouseDown = (e) => {
      let map = gameState.map

      if (DebugModes.editingLevel) {
        /* The action to perform. */
        let action

        // destroy a block
        if (e.buttons == 1) {
          action = () => {
            let hitPosition = map.raycast(this.position, this.look)

            if (map.get(hitPosition) !== undefined) {
              map.set(hitPosition, GAMEMAP_AIR)
              map.updateMesh()
            }
          }
        }

        // place a block
        if (e.buttons == 2) {
          action = () => {
            let hitPosition = map.raycast(this.position, this.look)
            hitPosition = hitPosition.addScaledVector(this.look, -0.1)

            if (map.get(hitPosition) !== undefined) {
              map.set(hitPosition, GAMEMAP_WALL)
              map.updateMesh()
            }
          }
        }

        /* Keep doing the action until the player mouses up. */
        if (action) {
          /*
           * Note we add the event listener here to create a closure with
           * isMouseDown, that way we are covered even if the user double
           * clicks.
           */
          let isMouseDown = true
          const onMouseUp = () => { isMouseDown = false }
          document.addEventListener('mouseup', onMouseUp)
          const loop = () => {
            if(isMouseDown) {
              action()
              setTimeout(loop, 1000 / 8)
            } else {
              document.removeEventListener('mouseup', onMouseUp)
            }
          }
          loop()
        }
      } else {
        //this.hook.reelIn()
        if(e.buttons == 1) {
          if (this.hook.state == HOOK_REELING || this.hook.state == HOOK_HOLDING) {
            this.hook.reset()
            this.hook.shoot(this.look)
          } else if (this.hook.state == HOOK_LATCHED) {
            //this.hook.reelIn()
          }
        }
        if(e.buttons == 2) {
          this.hook.reset()
        }
      }
    }

    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('mousedown', this.mouseDown)
  }

  canJump() {
    return (this.onGround || this.beingPulledByHook) && !this.isFlying()
  }

  onExitScene (gameState) {
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('mousedown', this.mouseDown)
  }

  mousemove (dx, dy) {
    this.yaw += dx / -500
    this.pitch += dy / 300
    this.pitch = Math.min(this.pitch, Math.PI / 2)
    this.pitch = Math.max(this.pitch, Math.PI / -2)

    const cosPitch = Math.sign(Math.cos(this.pitch)) * Math.max(Math.abs(Math.cos(this.pitch)), 0.001)

    // update the look vector
    this.look.x = Math.sin(this.yaw) * cosPitch
    this.look.y = -1 * Math.sin(this.pitch)
    this.look.z = Math.cos(this.yaw) * cosPitch
    this.look.normalize()

    this.camera.lookAt(
      this.camera.position.x + this.look.x,
      this.camera.position.y + this.look.y,
      this.camera.position.z + this.look.z
    )
  }
}
