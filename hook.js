const HOOK_HOLDING = 0
const HOOK_SHOOTING = 1
const HOOK_LATCHED = 2
const HOOK_REELING = 3

class Hook extends Thing {
  constructor (owner) {
    super()
    this.state = HOOK_HOLDING
    this.shootDirection = null
    this.reelDirection = null
  }

  /* Called when the thing is added to the gamestate's thing list. */
  onEnterScene (gameState) {
    const createCube = (sizes, color, depthTestBoolean, material) => {
      material = material || new THREE.MeshBasicMaterial({color: color, depthTest:depthTestBoolean})
      const geometry = new THREE.BoxGeometry(sizes[0],sizes[1],sizes[2])
      return new THREE.Mesh(geometry, material) 
    }

    this.handModel = createCube([1,1,1],0x3366bb,false, new THREE.MeshPhongMaterial({color: 0x3366bb, depthTest:false}))
    this.handModel.scale.set(0.15,0.15,0.25)
    this.handModel.geometry.translate(2, -1.5, 3)
    gameState.scene.add(this.handModel)

    this.shootModel = createCube([1,1,1],0x4488ff,true)
    this.shootModel.scale.set(0.15,0.15,0.15)


    this.crosshair = createCube([1,1,1],0xffffff,false)
    this.crosshair.scale.set(0.01,0.01,0.01)
    gameState.scene.add(this.crosshair)

    this.onMouseMove = () => this.mousemove(gameState)
    document.addEventListener('mousemove', this.onMouseMove)
  }

  /* Called when the thing is removed from the gamestate's thing list. */
  onExitScene (gameState) {
  	document.removeEventListener('mousemove', this.onMouseMove)
  }

  /* Returns true if the thing should be removed this frame or not. */
  update (gameState) {
  	this.updateGun(gameState)

    if (this.state == HOOK_SHOOTING) {
      // move in the direction being shot
      this.shootModel.position.addScaledVector(this.shootDirection, 0.15)

      if (gameState.map.isSolid(this.shootModel.position)) {
        // move to the surface of the block
        let hookMoveToSurface = gameState.map.getOverlap(this.shootModel.position.x, this.shootModel.position.y, this.shootModel.position.z)

        if (hookMoveToSurface) {
          this.shootModel.position.add(hookMoveToSurface)
        }

        this.state = HOOK_LATCHED
        // this.reelIn()
      }

      // if distance is greater than max distance, just give up
      if (gameState.player.position.distanceTo(this.shootModel.position) > 8) {
        this.reset()
      }
    }

    if (this.state == HOOK_REELING) {
      let player = gameState.player

      if (!player.velocity.equals(this.pullingVelocity)) {
        this.reset()
      }
    }

    return true
  }

  mousemove (gameState) {
  	this.updateGun(gameState)
  }

  updateGun (gameState) {
  	this.camera = gameState.camera
  	this.look = gameState.things[0].look

    // hook follows view, held in player's hand
    this.handModel.position.set(
      this.camera.position.x + this.look.x,
      this.camera.position.y + this.look.y,
      this.camera.position.z + this.look.z
    )
    this.handModel.rotation.set(
      this.camera.rotation.x,
      this.camera.rotation.y,
      this.camera.rotation.z
    )

    this.crosshair.position.set(
      this.camera.position.x + this.look.x,
      this.camera.position.y + this.look.y,
      this.camera.position.z + this.look.z
    )
    this.crosshair.rotation.set(
      this.camera.rotation.x,
      this.camera.rotation.y,
      this.camera.rotation.z
    )
  }

  shoot (look) {
    // can't shoot hook if not holding it!
    if (this.state != HOOK_HOLDING) { return }

    this.shootDirection = look.clone()
    // console.log(this.shootDirection)
    //this.shootDirection.multiplyScalar(10)
    // this.shootDirection.sub(this.handModel.position)
    // this.shootDirection.add(new THREE.Vector3(-1,0,0))
    this.shootDirection.normalize()
    // this.shootDirection.multiplyScalar(0.15)
    this.state = HOOK_SHOOTING

    gameStateStack.peek().scene.add(this.shootModel)
    
    // const right = new THREE.Vector3()
    // const forward = new THREE.Vector3()
    // const up = new THREE.Vector3()

    // gameStateStack.peek().camera.matrix.extractBasis(right, up, forward)
    // console.log(right)

    this.shootModel.position.copy(this.handModel.position)

    // this.shootModel.position.addScaledVector(right, .5)
    // this.shootModel.position.addScaledVector(up, -0.3)
    // this.shootDirection.addScaledRector(up, 1)


    this.shootModel.rotation.copy(this.handModel.rotation)
  }

  reelIn () {
    if (this.state != HOOK_LATCHED) { return }

    let gamestate = gameStateStack.peek()
    let player = gamestate.player
    this.pullingVelocity = this.shootModel.position.clone()
    this.pullingVelocity.sub(gamestate.player.position)
    this.pullingVelocity.normalize()
    this.pullingVelocity.multiplyScalar(0.125)
    player.velocity = this.pullingVelocity.clone()
    player.beingPulledByHook = true
    this.state = HOOK_REELING
  }

  reset () {
    let gameState = gameStateStack.peek()
    gameState.player.beingPulledByHook = false
    gameState.scene.remove(this.shootModel)
    this.state = HOOK_HOLDING
  }
}
