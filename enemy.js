import * as THREE from './three.module.js'
import Character from './character.js'

export default class Enemy extends Character {
  constructor (x, y, z) {
    super()
    this.position.set(x || 0, y || 0, z || 0)
    this.speed = 0.001
    this.direction = new THREE.Vector3(1, 0, 0)
    this.nextCubePos = new THREE.Vector3()
    this.up = new THREE.Vector3(0, 1, 0)
  }

  onEnterScene (gameState) {
    this.sprite = makeEnemySprite()
    gameState.scene.add(this.sprite)
  }

  onExitScene (gameState) {
    gameState.scene.remove(this.sprite)
  }

  update (gameState) {

    /* Find out where we will be next. */
    for(let i = 0; i < 4; i ++) {
      this.nextCubePos.copy(this.position)
      this.nextCubePos.addScaledVector(this.direction, 0.5)

      if(gameState.map.isSolid(this.nextCubePos) ||
         !gameState.map.isSolidCoord(
          this.nextCubePos.x,
          this.nextCubePos.y - 1.0,
          this.nextCubePos.z)
      ) {
        this.direction.applyAxisAngle(this.up, Math.PI / 2)
      } else {
        break
      }
    }

    this.velocity.addScaledVector(this.direction, this.speed)

    super.update (gameState)

    this.sprite.position.copy(this.position)
    return true
  }
}

/*
 * Creates a new enemy sprite. If the texture hasn't been loaded, it is loaded,
 * otherwise the sprite is cloned.
 */
const makeEnemySprite = (() => {
  let sprite
  return () => {
    if (!sprite) {
      const loader = new THREE.TextureLoader()
      const mat = new THREE.SpriteMaterial({
        map: loader.load("textures/enemy1.png"),
        transparent: true
      })
      sprite = new THREE.Sprite(mat)
    }
    return sprite.clone ()
  }
})()
