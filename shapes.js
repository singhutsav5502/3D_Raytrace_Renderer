class Sphere{

    constructor(x,y,z,r){
        this.center=new Vector3(x,y,z)
        this.radius=r
        this.color = new Color(1,0,0)
        this.material = (1,0.5,0.5,1)
    }

    _setColor(color){
        this.color=color
    }

    _setMaterial(Material){
        this.material = Material
    }
}