
//  canvas dimensions
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const SCENE = {
  objectsInScene: [],
  numberOfSpheres: 10,
  backgroundColor: new Color(0.25, 0.5, 0.5),
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
        new Color(0.5, 0.5, 0.5) // is
      ),
      new pointLight(
        new Vector3(300, 0.5, 0), // location
        new Color(0.4, 0.4, 0.9), // id
        new Color(0.5, 0.5, 0.5) // is
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

class RayTracer {


  constructor(scene, w, h) {
    this.scene = scene
    this.w = w
    this.h = h
  }

  findIntersectingSphere(ray, center, radius, depth, shadowRay = false) {
    // reflection and refraction depth call breaking condition
    if (depth <= 0) {
      return { found: false, parameter: null };
    }

    // Calculate
    const a = Vector3.dotProduct(ray.direction, ray.direction)
    const b = 2 * Vector3.dotProduct(ray.origin.minus(center), ray.direction)
    const c = Vector3.dotProduct(ray.origin.minus(center), ray.origin.minus(center)) - radius * radius
    let D = ((b * b) - (4 * a * c))

    //  NO REAL ROOTS
    if (D < 0) return { found: false, parameter: null };
    // Real roots make sure t>=1 so that intersection between image plane and camera are not considered
    D = Math.sqrt(D)
    const t1 = shadowRay ? ((-1 * b + D) / (2 * a) > 0 && (-1 * b + D) / (2 * a) < 1 ? (-1 * b + D) / (2 * a) : false) : ((-1 * b + D) / (2 * a) >= 1 ? (-1 * b + D) / (2 * a) : false);
    const t2 = shadowRay ? ((-1 * b - D) / (2 * a) > 0 && (-1 * b - D) / (2 * a) < 1 ? (-1 * b - D) / (2 * a) : false) : ((-1 * b - D) / (2 * a) >= 1 ? (-1 * b - D) / (2 * a) : false);
    //  make sure t>=1 considered for normal rays
    if (t1 === false && t2 === false) return { found: false, parameter: null }
    else if (t1 === false) return { found: true, parameter: t2 };
    else if (t2 === false) return { found: true, parameter: t1 };
    else return { found: true, parameter: Math.min(t1, t2) }
  }


  createRay(x, y) {
    // create ray ( normalize coordinates to [0,1] for x , flip coordinates for y to start from bottom left)
    const xt = x / this.w;
    const yt = (this.h - y - 1) / this.h;
    //  calculate vector point for given coordinates based on 
    const top = Vector3.lerp(
      this.scene.imagePlane.topLeft,
      this.scene.imagePlane.topRight,
      xt
    )
    const bottom = Vector3.lerp(
      this.scene.imagePlane.bottomLeft,
      this.scene.imagePlane.bottomRight,
      xt
    )
    const point = Vector3.lerp(bottom, top, yt)
    const ray = new Ray(
      point,
      point.minus(this.scene.camera)
    )
    return ray;
  }

  fresnelFactor(thetaI, eta1, eta2, p) {
    const cosThetaI = Math.cos(thetaI);
    const etaRatio = eta1 / eta2;
    const sin2ThetaI = 1 - Math.pow(cosThetaI, 2);
    const etaRatio2 = Math.pow(etaRatio, 2);
    const term1 = Math.pow((etaRatio - Math.sqrt(etaRatio2 + sin2ThetaI)), 2);
    const term2 = Math.pow((etaRatio + Math.sqrt(etaRatio2 + sin2ThetaI)), 2);

    return (p === 'p' ? term1 : term2) / (term1 + term2);
  }
  easingCurve(radius) {
    if (radius < 0) {
      throw new Error("Radius cannot be negative.");
    }

    const clampedRadius = Math.max(radius, 0.001); // Clamp to avoid division by zero
    return 0.1 + (1 - 0.1) * (3 * clampedRadius ** 2 - 2 * clampedRadius ** 3);
  }

  tracedValueAtPixel(ray, SCENE, depth = 3) {

    // intersection logic
    const intersectionParameters = []
    let pixelOpacity = 1;
    // run intersection for each object in the scene per raycast
    // store intersection object index and distanceParameter in array
    SCENE.objectsInScene.forEach((sphere, index) => {
      const intersection = this.findIntersectingSphere(ray, sphere.center, sphere.radius, depth)
      if (intersection.found === true) {
        intersectionParameters.push({ intersectionParameter: intersection.parameter, index })
      }
    })

    // use array to find closest intersection to camera
    let tracedColor = new Color(0, 0, 0)


    if (intersectionParameters.length > 0) {
      intersectionParameters.sort((a, b) => a.intersectionParameter - b.intersectionParameter)
      const sphereIndex = intersectionParameters[0].index
      // found closest intersection with SCENE.objectsInScene[sphereIndex]
      const intersectedSphere = SCENE.objectsInScene[sphereIndex]

      Object.assign(tracedColor, intersectedSphere.color)

      // Transparency
      const objectTransparency = intersectedSphere.material.transparency
      if (objectTransparency > 0) {
        tracedColor = tracedColor._addColorComponent(Color.mix(tracedColor, SCENE.backgroundColor, objectTransparency))
      }


      // AMBIENT LIGHT
      tracedColor = tracedColor._addColorComponent(SCENE.lighting.ambientLight.color.multiply(SCENE.lighting.ambientLight.ia))

      // // CONSIDER PHONG SHADING MODEL FOR COLOR
      const pointOfIntersection = ray.origin.plus(ray.direction.scale(intersectionParameters[0].intersectionParameter))
      const normalVector = Vector3.normalize(pointOfIntersection.minus(intersectedSphere.center))


      SCENE.lighting.pointLights.forEach((pointLight) => {

        const lightVector = Vector3.normalize(pointLight.location.minus(pointOfIntersection))

        // CHECK IF POINT IS IN SHADOW OF ANOTHER OBJECT ( FOR THIS PARTICULAR LIGHT )
        const shadowRay = new Ray(pointOfIntersection, pointLight.location.minus(pointOfIntersection))

        let isShadowed = false
        SCENE.objectsInScene.forEach((sphere) => {
          if (sphere !== intersectedSphere) {
            const intersection = this.findIntersectingSphere(shadowRay, sphere.center, sphere.radius, depth, true)
            if (intersection.found === true) isShadowed = true;
          }
        })
        if (isShadowed === false) {


          const normalLightDotProduct = Vector3.dotProduct(normalVector, lightVector);
          if (normalLightDotProduct > 0) {
            // when light and normal vector in similar directions

            //////////////////////
            // DIFFUSE LIGHTING //
            //////////////////////

            const diffuseComponent = intersectedSphere.material.kd.multiply(pointLight.id).scale(normalLightDotProduct);
            tracedColor = tracedColor._addColorComponent(diffuseComponent.scale(0.8))

            ///////////////////////
            // SPECULAR LIGHTING //
            ///////////////////////

            const specularFactor = normalVector.scale(2 * normalLightDotProduct).minus(lightVector)
            const viewVector = Vector3.normalize(SCENE.camera.minus(pointOfIntersection))

            let specularComponent = intersectedSphere.material.ks.multiply(pointLight.is).scale(
              Math.pow(Vector3.dotProduct(specularFactor, viewVector), intersectedSphere.material.alpha)
            )
            tracedColor = tracedColor._addColorComponent(specularComponent)

          }
          ////////////////////////
          // RECURSIVE RAYTRACE //
          ////////////////////////

          // Reflectiveness, Transparency and Refraction //
          if (depth > 0) {
            const thetaI = Math.acos(Vector3.dotProduct(Vector3.normalize(ray.direction), normalVector)); // Angle of incidence
            let fresnelFactor = this.fresnelFactor(thetaI, SCENE.mu, intersectedSphere.material.mu, 'p');
            fresnelFactor = Math.min(fresnelFactor, 0.5);


            //  Reflection
            const reflectionViewVector = Vector3.normalize(ray.direction.scale(-1))
            const reflectanceVector = normalVector.scale(2 * Vector3.dotProduct(reflectionViewVector, normalVector)).minus(reflectionViewVector)
            const reflectRay = new Ray(
              pointOfIntersection,
              reflectanceVector
            )

            const reflectedColorComponent = this.tracedValueAtPixel(reflectRay, SCENE, depth - 1).pixelColor;
            tracedColor = tracedColor._addColorComponent(reflectedColorComponent.multiply(intersectedSphere.material.kt).scale(0.1))

            // Refraction
            if (objectTransparency > 0) {
              tracedColor = Color.mix(reflectedColorComponent, intersectedSphere.color, 0)

              const objectRI = intersectedSphere.material.mu
              if (objectRI > 1) {
                const cosTheta1 = Vector3.dotProduct(Vector3.normalize(ray.direction), normalVector)
                const refractiveRatio = SCENE.mu / objectRI
                const cosTheta2 = Math.sqrt(1 - Math.pow(refractiveRatio, 2) * (1 - Math.pow(cosTheta1, 2)))

                // TRANSPARENCY
                const blendedOpacity = Math.max(0.1, this.easingCurve(intersectedSphere.radius)) * (1 - fresnelFactor) + fresnelFactor;
                pixelOpacity = Math.min((1 - blendedOpacity) * 0.5 + 1 * blendedOpacity, intersectedSphere.material.opacity)

                if ((isNaN(cosTheta2)) || ((SCENE.mu * cosTheta1) < objectRI && Math.abs(cosTheta1) > (1 / objectRI))) {
                  // Total Internal Reflection or imaginary value for cosTheta2

                  const TIR_RAY_DIRECTION = Vector3.normalize(ray.direction.minus(normalVector.scale(Vector3.dotProduct(ray.direction, normalVector))))
                  const TIR_RAY = new Ray(
                    pointOfIntersection,
                    TIR_RAY_DIRECTION
                  )
                  let TIR_Color_Component = this.tracedValueAtPixel(TIR_RAY, SCENE, depth - 1).pixelColor;
                  TIR_Color_Component = Color.mix(TIR_Color_Component, SCENE.backgroundColor, 0.8)

                  tracedColor = Color.mix(TIR_Color_Component, tracedColor, 0.2);

                }
                else {
                  const refractiveRatio = SCENE.mu / objectRI
                  const refractedRayDirection = ray.direction.scale(refractiveRatio).minus(normalVector.scale(refractiveRatio * (cosTheta1) + cosTheta2))
                  const refractedRay = new Ray(
                    pointOfIntersection,
                    refractedRayDirection
                  )

                  const refractedColorComponent = Color.mix(this.tracedValueAtPixel(refractedRay, SCENE, depth - 1).pixelColor, (SCENE.backgroundColor), 0.9)
                  tracedColor = Color.mix(refractedColorComponent, tracedColor, 0.2);
                }
              }
            }
          }
        }
      })
    }
    else {
      tracedColor = Object.assign(tracedColor, SCENE.backgroundColor)
    }
    Color.clampColors(tracedColor)
    // if(tracedColor.r || tracedColor.g || tracedColor.b ) console.log(tracedColor)
    return { pixelColor: tracedColor, pixelOpacity }
  }



}

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

// for each pixel in the image plane run a ray trace and get corresponding color value for the pixel based on intersection detection
for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    const ray = tracer.createRay(x, y)
    const pixelData = tracer.tracedValueAtPixel(ray, SCENE)
    image.putPixel(x, y, imageColorFromColor(pixelData.pixelColor), pixelData.pixelOpacity);
  }
}

image.renderIntoElement(document.querySelector('body'));
