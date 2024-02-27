class Material {
    // ka    -> ambient light
    // kd    -> diffuse component
    // ks    -> specular component
    // alpha -> shininess
    constructor(ka, kd, ks, alpha) {
        this.ka = ka
        this.kd = kd
        this.ks = ks
        this.alpha = alpha
    }
}