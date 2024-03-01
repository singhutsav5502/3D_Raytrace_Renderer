//  canvas dimensions
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const SCENE = {
    objectsInScene: [],
    numberOfSpheres: 3,
    backgroundColor: new Color(0.7, 0.7, 0.7),
    camera: new Vector3(0, 0, 2),
    imagePlane: {
        topLeft: new Vector3(-1.52, 0.86, -0.5),
        topRight: new Vector3(1.52, 0.86, -0.5),
        bottomLeft: new Vector3(-1.52, -0.86, -0.5),
        bottomRight: new Vector3(1.52, -0.86, -0.5)
    },
    lighting: {
        ambientLight: new ambientLight(
            new Color(Math.random() * 1, Math.random() * 1, Math.random() * 1),
            new Color(0.05, 0.05, 0.05),
        ),
        pointLights: [
            new pointLight(
                new Vector3(-300, -0.5, 0), // location
                new Color(0.8, 0.3, 0.3), // id
                new Color(0.8, 0.8, 0.8) // is
            ),
            new pointLight(
                new Vector3(30, 25, -120), // location
                new Color(0.4, 0.4, 0.9), // id
                new Color(0.8, 0.8, 0.8) // is
            )
        ]
    },
    mu: 1,

    setupObjects: function () {
        for (let i = 1; i <= this.numberOfSpheres; i++) {
            const sphereInstance = new Sphere(
                Math.floor((Math.random() - 1 / 2) * 60), // x
                Math.floor(((Math.random() - 1 / 2) * 80)), // y
                -100 + Math.floor(Math.random() * 3),
                // Math.floor(Math.random() * 200 - (Math.random() + 500) * (1 / 2)), // z
                Math.floor((Math.random()) * 15)) // radius

            sphereInstance._setColor(new Color(Math.random(), Math.random(), Math.random())) // color

            sphereInstance._setMaterial(
                new Material(
                    new Color(0.1, 0.1, 0.1),
                    new Color(0.5, 0.5, 0.9),
                    new Color(1, 1, 1),
                    new Color(0.8, 0.8, 0.8),
                    Math.floor(Math.random() + 0.01 * 1), // transparency
                    Math.random() + 1, // mu
                    50,// alpha
                    Math.min((Math.random() + 0.8 * 1), 1),  // opacity
                )
            )

            this.objectsInScene.push(sphereInstance);
        }
        // 1 transparent sphere
        this.objectsInScene.push(new Sphere(0, 0, -100, 20, Material._TransparentMaterial()))
    }
};


/////////////////
// SCENE SETUP //
/////////////////
const image = new Image(WIDTH, HEIGHT, false);
const onScreenImage = new Image(WIDTH, HEIGHT, true);
// document.image = image;
SCENE.setupObjects();

//  color vector stores values from 0 to 1 , convert into 0 to 255 range
const imageColorFromColor = color => ({
    r: Math.floor(color.r * 255),
    g: Math.floor(color.g * 255),
    b: Math.floor(color.b * 255)
});

const tracer = new RayTracer(SCENE, WIDTH, HEIGHT);

// for each pixel in the image plane run a ray trace and get corresponding color value for the pixel based on intersection detection
window.onload = function () {
    const BLOCK_SIZE = 100; // Update blocks of pixels
    document.getElementById('loadingText').style.display = "block";
    for (let y = 0; y < HEIGHT; y += BLOCK_SIZE) {
        for (let x = 0; x < WIDTH; x += BLOCK_SIZE) {
            for (let dy = 0; dy < BLOCK_SIZE; dy++) {
                for (let dx = 0; dx < BLOCK_SIZE; dx++) {
                    const pixelX = x + dx;
                    const pixelY = y + dy;

                    tracer.FourXSSAA(pixelX, pixelY, WIDTH, HEIGHT, image, SCENE);
                }
            }
        }
    }
    onScreenImage.context.putImageData(image.imageData, 0, 0)
    document.getElementById('loadingText').style.display = "none";
    console.log('yo')

}