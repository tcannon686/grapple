class Hook extends Thing {
	constructor () {
		super()
  }

  /* Called when the thing is added to the gamestate's thing list. */
  onEnterScene (gameState) {

    this.cube = createCube([1,1,1],0x00ff00,false)
    this.cube.scale.set(0.15,0.15,0.15)
    this.cube.geometry.translate(2, -1.5 ,3)
    gameState.scene.add(this.cube)


    this.crosshair = createCube([1,1,1],0xffffff, false)
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
  update (dt, gameState) {
  	this.updateGun(gameState)
    return true
  }

  mousemove (gameState) {
  	this.updateGun(gameState)
  }

  updateGun (gameState) {
  	this.camera = gameState.camera
  	this.look = gameState.things[0].look

	  this.cube.position.set(
	    this.camera.position.x + this.look.x,
	    this.camera.position.y + this.look.y,
	    this.camera.position.z + this.look.z
	  );
	  this.cube.rotation.set(
	    this.camera.rotation.x,
	    this.camera.rotation.y,
	    this.camera.rotation.z
	  );

	  this.crosshair.position.set(
	    this.camera.position.x + this.look.x,
	    this.camera.position.y + this.look.y,
	    this.camera.position.z + this.look.z
	  );
	  this.crosshair.rotation.set(
	    this.camera.rotation.x,
	    this.camera.rotation.y,
	    this.camera.rotation.z
	  );
  }
}

function createCube(sizes, color, depthTestBoolean) {	
	const geometry = new THREE.BoxGeometry( sizes[0],sizes[1],sizes[2] );
  const material = new THREE.MeshBasicMaterial( {color: color, depthTest:depthTestBoolean} );
  cube =  new THREE.Mesh( geometry, material )
  return cube
}