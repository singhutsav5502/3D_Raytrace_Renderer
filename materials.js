class Material {
    // ka    -> ambient light
    // kd    -> diffuse component
    // ks    -> specular component
    // kt    -> reflectivity
    // mu    -> refractive index
    // alpha -> shininess
    // transparency 
    constructor(ka, kd, ks, kt, transparency, mu, alpha, opacity = 1) {

        this.ka = ka
        this.kd = kd
        this.ks = ks
        this.kt = kt;
        // this.kt = new Color(100,100,100);
        this.transparency = transparency
        this.mu = mu
        this.alpha = alpha
        this.opacity = opacity
    }
    static _TransparentMaterial() {
        return new Material(
            new Color(1, 1, 1),
            new Color(1, 1, 1),
            new Color(0, 0, 0),
            new Color(0, 0, 0),
            0.9, // transparency
            1.5, // mu
            200,
            0.5// opacity
        )
    }
    static _DefaultMaterial() {
        return new Material(
            new Color(1, 1, 1),
            new Color(1, 1, 1),
            new Color(1, 1, 1),
            new Color(1, 1, 1),
            0,
            1,
            200,
            1,
        )
    }
}