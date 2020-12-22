import Thing from './thing.js'
import * as THREE from './three.module.js'
import { gameStateStack, GltfLoader } from './main.js'
import { PlaySound } from './main.js'

export const HOOK_HOLDING = 0
export const HOOK_SHOOTING = 1
export const HOOK_LATCHED = 2
export const HOOK_REELING = 3
const HOOK_MAX = 6
const HOOK_SPEED = 0.6
const HOOK_PULLSPEED = 0.2

const HOOK_SWING_SOUND = new Audio("/sounds/swing.mp3")
const HOOK_STICK_SOUND = new Audio("/sounds/stick.mp3")

export class Hook extends Thing {
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

    GltfLoader.load(
      'models/GrapplingGun.glb',
      (gltf) => {
        this.handModel = gltf.scene
        this.bulletExit = this.handModel.getObjectByName('BulletExit')
        this.hookInGun = this.handModel.getObjectByName('GrapplingHook')
        //this.handModel.scale.set(0.15,0.15,0.25)
        //this.handModel.geometry.translate(2, -1.5, 3)
        gameState.scene.add(this.handModel)
      },
      (xhr) => {},
      (error) => {
        console.error(error)
      })

    GltfLoader.load(
      'models/GrapplingHook.glb',
      (gltf) => {
        this.shootModel = gltf.scene
      },
      (xhr) => {},
      (error) => {
        console.error(error)
      })

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
      this.shootModel.position.addScaledVector(this.shootDirection, HOOK_SPEED)
      if (this.shootModel.position.distanceTo(this.target) < 0.1
      || this.targetDistance <= this.shootModel.position.distanceTo(this.target)) {
        if (gameState.map.isSolid(this.target)) {
          this.state = HOOK_LATCHED
          PlaySound(HOOK_STICK_SOUND)
          this.maxDistance = gameState.player.position.distanceTo(this.shootModel.position)
          this.shootModel.position.copy(this.target)
          this.reelIn()
        } else {
          this.reset()
        }
      }
      this.targetDistance = this.shootModel.position.distanceTo(this.target)

      // if distance is greater than max distance, just give up
      if (gameState.player.position.distanceTo(this.shootModel.position) > HOOK_MAX) {
        this.reset()
      }
    }

    if (this.state == HOOK_LATCHED) {
        if (this.maxDistance < gameState.player.position.distanceTo(this.shootModel.position)) {
          const stopVelocity = this.shootModel.position.clone()
          stopVelocity.sub(gameState.player.position)
          stopVelocity.normalize()
          stopVelocity.multiplyScalar(0.009)
          gameState.player.velocity.add(stopVelocity)
        }
    }

    if (this.state == HOOK_REELING) {
      const pullingVelocity = this.shootModel.position.clone()
      pullingVelocity.sub(gameState.player.position)
      pullingVelocity.normalize()
      pullingVelocity.multiplyScalar(HOOK_PULLSPEED)

      gameState.player.velocity.copy(pullingVelocity)
    }

    return true
  }

  mousemove (gameState) {
  	this.updateGun(gameState)
  }

  updateGun (gameState) {
  	this.camera = gameState.camera
  	this.look = gameState.things[0].look

    if(this.handModel) {
      // hook follows view, held in player's hand
      this.handModel.position.copy(this.camera.position)
      this.handModel.rotation.set(
        this.camera.rotation.x,
        this.camera.rotation.y,
        this.camera.rotation.z
      )
    }

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

    this.state = HOOK_SHOOTING

    const gameState = gameStateStack.peek()
    gameState.scene.add(this.shootModel)
    this.hookInGun.visible = false

    // get the target point to move shootmodel to
    this.target = gameState.map.raycast(gameState.player.position, look, HOOK_MAX)

    // move shootmodel to be where the handmodel is, but in world space
    const right = new THREE.Vector3()
    const forward = new THREE.Vector3()
    const up = new THREE.Vector3()
    this.camera.matrix.extractBasis(right, up, forward)
    this.bulletExit.getWorldPosition(this.shootModel.position)
    if(this.handModel) {
      this.shootModel.rotation.copy(this.handModel.rotation)
    }

    PlaySound(HOOK_SWING_SOUND)

    this.shootDirection = this.target.clone().sub(this.shootModel.position)
    this.shootDirection.normalize()
    this.targetDistance = this.target.distanceTo(this.shootModel.position)
  }

  reelIn () {
    if (this.state != HOOK_LATCHED) { return }

    let gamestate = gameStateStack.peek()
    let player = gamestate.player
    this.playerDistance = player.position.distanceTo(this.shootModel.position)
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
    this.hookInGun.visible = true
    this.state = HOOK_HOLDING
  }
}
