
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

    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
  }

  onExitScene (gameState) {
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
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
    this.camera.lookAt(
      this.camera.position.x + Math.sin(this.yaw) * cosPitch,
      this.camera.position.y - Math.sin(this.pitch),
      this.camera.position.z + Math.cos(this.yaw) * cosPitch
    )
  }

  update (dt) {
    // Pass for now.
    this.camera.aspect = canvas.width / canvas.height
    this.camera.updateProjectionMatrix()

    this.camera.position.copy(this.position)

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

    return true
  }
}