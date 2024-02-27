class pointLight{
    // x,y,z  -> 3D space coords
    // id -> diffuse intensity
    // is -> specular intensity
    constructor(location,id,is){
        this.location = location
        this.id = id
        this.is = is
    }
}

class ambientLight{
    // color -> Vector3 value
    // ia -> ambient intensity
    constructor(color , ia){
        this.color = color
        this.ia = ia
    }
}