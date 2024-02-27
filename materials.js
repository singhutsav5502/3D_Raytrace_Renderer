class Material {
    // ka    -> ambient light
    // kd    -> diffuse component
    // ks    -> specular component
    // alpha -> shininess
    constructor(ka, kd, ks, alpha) {
        this.ka = new Color(ka.r, ka.g, ka.b)
        this.kd = kd
        this.ks = ks
        this.alpha = alpha
    }
}