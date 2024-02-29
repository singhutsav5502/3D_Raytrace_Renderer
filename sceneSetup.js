//  canvas dimensions
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const SCENE = {
    objectsInScene: [],
    numberOfSpheres: 3,
    backgroundColor: new Color(0.75, 0.75, 0.75),
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
                    new Color(0.5, 0.5, 0.5),
                    new Color(0.5, 0.5, 0.5),
                    Math.floor(Math.random() + 0.01 * 1), // transparency
                    Math.random() + 1, // mu
                    100,// alpha
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
const image = new Image(WIDTH, HEIGHT);
document.image = image;
SCENE.setupObjects();

//  color vector stores values from 0 to 1 , convert into 0 to 255 range
const imageColorFromColor = color => ({
    r: Math.floor(color.r * 255),
    g: Math.floor(color.g * 255),
    b: Math.floor(color.b * 255)
});

const tracer = new RayTracer(SCENE, WIDTH, HEIGHT);

function FourXSSAA(x, y, WIDTH, HEIGHT, image, SCENE) {
    const alpha = 1 / WIDTH;
    const beta = 1 / HEIGHT;

    const pixelDataOne = tracer.tracedValueAtPixel(tracer.createRay(x, y), SCENE).pixelColor
    const pixelDataTwo = tracer.tracedValueAtPixel(tracer.createRay(x + alpha / 2, y), SCENE).pixelColor
    const pixelDataThree = tracer.tracedValueAtPixel(tracer.createRay(x + alpha / 2, y + beta / 2), SCENE).pixelColor
    const pixelDataFour = tracer.tracedValueAtPixel(tracer.createRay(x, y + beta / 2), SCENE).pixelColor
    let pixelData = new Color(0, 0, 0)
    pixelData = pixelData._addColorComponent(pixelDataOne)._addColorComponent(pixelDataTwo)._addColorComponent(pixelDataThree)._addColorComponent(pixelDataFour).scale(0.25) // average of all 4

    image.putPixel(x, y, imageColorFromColor(pixelData), pixelDataOne.pixelOpacity);
}
// for each pixel in the image plane run a ray trace and get corresponding color value for the pixel based on intersection detection
for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
        FourXSSAA(x, y, WIDTH, HEIGHT, image, SCENE)
    }
}

image.renderIntoElement(document.querySelector('body'));
