class Sphere{

    constructor(x,y,z,r, material = Material._DefaultMaterial()){
        this.center=new Vector3(x,y,z)
        this.radius=r
        this.color = new Color(0,0,1)
        this.material = material
    }

    _setColor(color){
        this.color=color
    }

    _setMaterial(Material){
        this.material = Material
    }
}