
class CollisionPruner {
  constructor () {
    this.coordToObject = new Map()
    this.objects = []
  }

  add (object) {
    this.objects.push(object)
  }

  remove (object) {
    this.objects.splice(this.objects.indexOf(object), 1)
  }

  update () {
    this.coordToObject.clear()
    for (let object of this.objects) {
      if(object.position) {
        const minX = Math.floor(object.position.x - 0.5)
        const minY = Math.floor(object.position.y - 0.5)
        const minZ = Math.floor(object.position.z - 0.5)
        
        /* Add the object to each space that the object takes up. */
        for(let i = 0; i < 8; i ++) {
          // Calculate the position and calculate a key for it.
          const key = this.getKey(
            minX + (i & 1),
            minY + (i & 2) >> 1,
            minZ + (i & 4) >> 2)

          let array
          if(!this.coordToObject.has(key)) {
            array = []
            this.coordToObject.set(key, array)
          } else {
            array = this.coordToObject.get(key)
          }

          /*
           * Acceptable performance since we expect coordToObject[key] to only
           * contain 2 or 3 objects at a time.
           */
          if(!array.includes(object)) {
            array.push(object)
          }
        }
      }
    }
  }

  /* 
   * Returns the 'hash' for the given coordinate. Doesn't really tho, just
   * append the x y z together into an integer. Shifting by 5 since the map is
   * 20x20, 2^5 is 32, so we should be covered for the X and Z. Y is shifted by
   * 10, which gives us 2^(22) = 4,194,304 spaces for Y, which I think is pretty
   * reasonable.
   */
  getKey (x, y, z) {
    return (x + (z << 5) + (y << 10))
  }

  /*
   * Returns an iterator where each item is a list of possible overlaps.
   */
  getOverlappingObjects () {
    return this.coordToObject.values()
  }
}

