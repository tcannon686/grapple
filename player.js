
class Player extends Thing {
  constructor () {
    super()

    this.camera = new THREE.PerspectiveCamera(
      90,
      canvas.width / canvas.height,
      0.1,
      1000)

    this.pitch = 0
    this.yaw = 0

    this.position = new THREE.Vector3(0, 0, 2)
    this.look = new THREE.Vector3(0,0,0)

    this.speed = 1.0

    this.isKeyDown = {}
  }

  onEnterScene (gameState) {
    gameState.camera = this.camera

    // send mousemove event to the top gamestate
    this.onMouseMove = (e) => this.mousemove(e.movementX, e.movementY)
    document.addEventListener(
      'mousemove',
      this.onMouseMove)

    this.onKeyDown = (e) => this.isKeyDown[e.key.toUpperCase()] = true
    this.onKeyUp = (e) => this.isKeyDown[e.key.toUpperCase()] = false
    this.mouseDown = (e) => {
      let map = gameState.map

      if (DebugModes.editingLevel) {
        // destroy a block
        if (e.buttons == 1) {
          // add 0.5 for rounding, so that it hits the block in the middle of the screen
          let hitPosition = map.raycast(new THREE.Vector3(this.position.x + 0.5, this.position.y + 0.5, this.position.z + 0.5), this.look)

          if (map.get(hitPosition) !== undefined) {
            map.set(hitPosition, 0)
            map.updateMesh()
          }
        }

        // place a block
        if (e.buttons == 2) {
          // add 0.5 for rounding, so that it hits the block in the middle of the screen
          let hitPosition = map.raycast(new THREE.Vector3(this.position.x + 0.5, this.position.y + 0.5, this.position.z + 0.5), this.look)
          hitPosition = hitPosition.addScaledVector(this.look, -0.1)

          if (map.get(hitPosition) !== undefined) {
            map.set(hitPosition, 1)
            map.updateMesh()
          }
        }
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

    let sign = Math.cos(this.pitch)
    if (sign > 0) {
      sign = 1
    } else if (sign < 0) {
      sign = -1
    } else {
      sign = 0
    }

    const cosPitch = sign * Math.max(Math.abs(Math.cos(this.pitch)), 0.001)

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

  update (dt, gameState) {
    // Pass for now.
    this.camera.aspect = canvas.width / canvas.height
    this.camera.updateProjectionMatrix()

    /* Do controls. */
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

      const len = Math.sqrt(dirX * dirX + dirZ * dirZ)
      if (len > 0) {
        dirX *= this.speed * dt / len
        dirZ *= this.speed * dt / len

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

        this.position.add(left)
        this.position.add(forward)
      }
    }

    this.camera.position.copy(this.position)

    return true
  }
}
