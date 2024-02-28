class Material {
    // ka    -> ambient light
    // kd    -> diffuse component
    // ks    -> specular component
    // alpha -> shininess
    constructor(ka, kd, ks, alpha) {
        this.ka = ka
        this.kd = kd
        this.ks = ks
        this.kt = new Color(1 - kd.r, 1 - kd.g, 1 - kd.b);
        // this.kt = new Color(100,100,100);
        this.alpha = alpha
    }
}