class Player extends Thing {
  constructor () {
    super()

    this.camera = new THREE.PerspectiveCamera(90, canvas.width / canvas.height, 0.001, 1000)
    this.pitch = 0
    this.yaw = 0

    this.position = new THREE.Vector3(-2, 5, -2)
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.look = new THREE.Vector3(0,0,0)

    this.speed = 0.005
    this.height = 0.28
    this.width = 0.09
    this.jumpSpeed = 0.085

    this.beingPulledByHook = false

    // create grappling hook and add it to the gamestate
    this.hook = new Hook()

    this.isKeyDown = {}
    this.onGround = false
    this.wasOnGround = false
  }

  controllable () {
    return !this.beingPulledByHook
  }

  onEnterScene (gameState) {
    gameState.camera = this.camera

    // send mousemove event to the top gamestate
    this.onMouseMove = (e) => this.mousemove(e.movementX, e.movementY)
    document.addEventListener(
      'mousemove',
      this.onMouseMove)

    this.onKeyDown = (e) => {
      this.isKeyDown[e.key.toUpperCase()] = true

      // toggle editing level by pressing E
      if (e.keyCode == 69) {
        DebugModes.editingLevel = !DebugModes.editingLevel
      }
    }

    this.onKeyUp = (e) => {
      this.isKeyDown[e.key.toUpperCase()] = false
    }

    this.mouseDown = (e) => {
      let map = gameState.map

      if (DebugModes.editingLevel) {
        // destroy a block
        if (e.buttons == 1) {
          let hitPosition = map.raycast(this.position, this.look)

          if (map.get(hitPosition) !== undefined) {
            map.set(hitPosition, 0)
            map.updateMesh()
          }
        }

        // place a block
        if (e.buttons == 2) {
          let hitPosition = map.raycast(this.position, this.look)
          hitPosition = hitPosition.addScaledVector(this.look, -0.1)

          if (map.get(hitPosition) !== undefined) {
            map.set(hitPosition, 1)
            map.updateMesh()
          }
        }
      } else {
        //this.hook.reelIn()
        this.hook.shoot(this.look)
      }
    }

    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('mousedown', this.mouseDown)
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

  update (gameState) {
    // Pass for now.
    this.camera.aspect = canvas.width / canvas.height
    this.camera.updateProjectionMatrix()

    // basic movement
    if (this.controllable())
    {
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

      if(this.isKeyDown[' '] && this.onGround) {
        this.velocity.y = this.jumpSpeed
      }

      const len = Math.sqrt(dirX * dirX + dirZ * dirZ)

      if (len > 0) {
        dirX *= this.speed / len
        dirZ *= this.speed / len

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

        this.velocity.add(left)
        this.velocity.add(forward)
      }
    }

    // gravity
    if (!this.beingPulledByHook) {
      this.velocity.add(gameState.gravity)
    }

    // friction
    if (!this.beingPulledByHook) {
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
        }
      }
    }

    this.position.add(this.velocity)

    const worldFloor = 0
    this.position.y = Math.max(this.position.y, this.height)
    if (this.position.y <= worldFloor + this.height) {
      this.onGround = true
    }

    this.camera.position.x = this.position.x
    this.camera.position.y = this.position.y
    this.camera.position.z = this.position.z

    return true
  }
}
