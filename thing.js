export default class Thing {
  constructor () {
  }

  /* Called when the thing is added to the gamestate's thing list. */
  onEnterScene (gameState) {
  }

  /* Called when the thing is removed from the gamestate's thing list. */
  onExitScene (gameState) {
  }

  /* Called when the thing is colliding with another thing. */
  onCollision (gameState, other) {
  }

  /* Returns true if the thing should be removed this frame or not. */
  update (gameState) {
    return true
  }
}
