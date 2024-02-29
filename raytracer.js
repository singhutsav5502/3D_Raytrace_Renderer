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
  getIntersectingSpheres(ray, SCENE, depth) {
    const intersectionParameters = []
    // run intersection for each object in the scene per raycast
    // store intersection object index and distanceParameter in array
    SCENE.objectsInScene.forEach((sphere, index) => {
      const intersection = this.findIntersectingSphere(ray, sphere.center, sphere.radius, depth)
      if (intersection.found === true) {
        intersectionParameters.push({ intersectionParameter: intersection.parameter, index })
      }
    })
    intersectionParameters.sort((a, b) => a.intersectionParameter - b.intersectionParameter)

    return intersectionParameters
  }
  addTransparency(objectTransparency, pixelColor) {
    // blend original object color with background color based on its Material Transparency
    if (objectTransparency > 0) {
      pixelColor = pixelColor._addColorComponent(Color.mix(pixelColor, SCENE.backgroundColor, objectTransparency))
    }
    return pixelColor
  }
  addAmbientLight(SCENE, pixelColor) {
    // add ambient lighting component for the SCENE object to the existing object color
    pixelColor._addColorComponent(SCENE.lighting.ambientLight.color.multiply(SCENE.lighting.ambientLight.ia))
    return pixelColor
  }
  addDifuseLighting(intersectedSphere, pixelColor, pointLight, normalLightDotProduct) {
    const diffuseComponent = intersectedSphere.material.kd.multiply(pointLight.id).scale(normalLightDotProduct);
    pixelColor = pixelColor._addColorComponent(diffuseComponent.scale(0.8))
    return pixelColor
  }
  addSpecularLighting(intersectedSphere, pixelColor, pointLight, normalLightDotProduct, pointOfIntersection, lightVector, normalVector) {
    const specularFactor = normalVector.scale(2 * normalLightDotProduct).minus(lightVector)
    const viewVector = Vector3.normalize(SCENE.camera.minus(pointOfIntersection))

    let specularComponent = intersectedSphere.material.ks.multiply(pointLight.is).scale(
      Math.pow(Vector3.dotProduct(specularFactor, viewVector), intersectedSphere.material.alpha)
    )
    pixelColor = pixelColor._addColorComponent(specularComponent)
    return pixelColor
  }
  getPointOfIntersection(ray, intersectionParameters) {
    return ray.origin.plus(ray.direction.scale(intersectionParameters[0].intersectionParameter))

  }
  isInShadow(pointOfIntersection, pointLight, SCENE, intersectedSphere, depth) {
    const shadowRay = new Ray(pointOfIntersection, pointLight.location.minus(pointOfIntersection))

    let isInShadow = false

    SCENE.objectsInScene.forEach((sphere) => {
      if (sphere !== intersectedSphere) {
        const intersection = this.findIntersectingSphere(shadowRay, sphere.center, sphere.radius, depth, true)
        if (intersection.found === true) isInShadow = true;
      }
    })
    return isInShadow
  }
  adjustPixelOpacity(pixelOpacity, intersectedSphere, fresnelFactor) {
    const blendedOpacity = Math.max(0.1, this.easingCurve(intersectedSphere.radius)) * (1 - fresnelFactor) + fresnelFactor;
    pixelOpacity = Math.min((1 - blendedOpacity) * 1 + intersectedSphere.material.opacity * blendedOpacity, intersectedSphere.material.opacity) + intersectedSphere.material.opacity
    return pixelOpacity
  }
  didRayIntersect(intersectionParameters) { return intersectionParameters.length > 0 }
  addReflectingComponents(ray, normalVector, pointOfIntersection, SCENE, depth, intersectedSphere, pixelColor) {
    const reflectionViewVector = Vector3.normalize(ray.direction.scale(-1))
    const reflectanceVector = normalVector.scale(2 * Vector3.dotProduct(reflectionViewVector, normalVector)).minus(reflectionViewVector)
    const reflectRay = new Ray(
      pointOfIntersection,
      reflectanceVector
    )

    const reflectedColorComponent = this.tracedValueAtPixel(reflectRay, SCENE, depth - 1).pixelColor;
    const pixelColorAfterReflection = pixelColor._addColorComponent(reflectedColorComponent.multiply(intersectedSphere.material.kt).scale(0.1))
    return { pixelColorAfterReflection, reflectedColorComponent }
  }
  isTotalInternalReflection(cosTheta2, cosTheta1, SCENE, objectRI) { return (isNaN(cosTheta2)) || ((SCENE.mu * cosTheta1) < objectRI && Math.abs(cosTheta1) > (1 / objectRI)) }
  handleTotalInternalReflection(ray, normalVector, pointOfIntersection, SCENE, depth, fresnelFactor, pixelColor) {
    const TIR_RAY_DIRECTION = Vector3.normalize(ray.direction.minus(normalVector.scale(Vector3.dotProduct(Vector3.normalize(ray.direction), normalVector))))
    const TIR_RAY = new Ray(
      pointOfIntersection,
      TIR_RAY_DIRECTION
    )
    let TIR_Color_Component = this.tracedValueAtPixel(TIR_RAY, SCENE, depth - 1).pixelColor;
    TIR_Color_Component = Color.mix(TIR_Color_Component, SCENE.backgroundColor, fresnelFactor)

    pixelColor = Color.mix(TIR_Color_Component, pixelColor, 0.2);
    return pixelColor
  }
  tracedValueAtPixel(ray, SCENE, depth = 3) {

    // intersection logic
    const intersectionParameters = this.getIntersectingSpheres(ray, SCENE, depth)
    let pixelOpacity = 1;

    // use array to find closest intersection to camera
    let pixelColor = new Color(0, 0, 0)


    if (this.didRayIntersect(intersectionParameters)) {

      const sphereIndex = intersectionParameters[0].index // get index of object closest to the camera ( that was intersected )
      const intersectedSphere = SCENE.objectsInScene[sphereIndex]

      Object.assign(pixelColor, intersectedSphere.color)

      // Transparency
      const objectTransparency = intersectedSphere.material.transparency
      pixelColor = this.addTransparency(objectTransparency, pixelColor)

      // AMBIENT LIGHT
      pixelColor = this.addAmbientLight(SCENE, pixelColor)

      // CONSIDER PHONG SHADING MODEL FOR COLOR DIFFUSION AND SPECULARITY

      const pointOfIntersection = this.getPointOfIntersection(ray, intersectionParameters)
      const normalVector = Vector3.normalize(pointOfIntersection.minus(intersectedSphere.center))

      //  diffuse and specular components are affected by all lights
      SCENE.lighting.pointLights.forEach((pointLight) => {
        const lightVector = Vector3.normalize(pointLight.location.minus(pointOfIntersection))  // Vector from object towards light source
        const isInShadow = this.isInShadow(pointOfIntersection, pointLight, SCENE, intersectedSphere)
        if (isInShadow === false) {
          //  not shadowed by another object

          const normalLightDotProduct = Vector3.dotProduct(normalVector, lightVector); // cos theta angle between Normal of object and the lightVector
          if (normalLightDotProduct > 0) { // makes sure the the light Vector and the normal from object are roughly in the same direction , i.e. object faces the light

            // when object faces light

            //////////////////////
            // DIFFUSE LIGHTING //
            //////////////////////

            pixelColor = this.addDifuseLighting(intersectedSphere, pixelColor, pointLight, normalLightDotProduct)

            ///////////////////////
            // SPECULAR LIGHTING //
            ///////////////////////

            pixelColor = this.addSpecularLighting(intersectedSphere, pixelColor, pointLight, normalLightDotProduct, pointOfIntersection, lightVector, normalVector)
          }
        }
      })


      ////////////////////////
      // RECURSIVE RAYTRACE //
      ////////////////////////

      // Reflectiveness, Transparency and Refraction //
      if (depth > 0) {
        //  Reflection

        const { pixelColorAfterReflection, reflectedColorComponent } = this.addReflectingComponents(ray, normalVector, pointOfIntersection, SCENE, depth, intersectedSphere, pixelColor) // recursive calls to add color of reflected objects
        pixelColor = pixelColorAfterReflection

        // Refraction
        if (objectTransparency > 0) {

          const objectRI = intersectedSphere.material.mu
          const thetaI = Math.acos(Vector3.dotProduct(Vector3.normalize(ray.direction), normalVector)); // Angle of incidence
          let fresnelFactor = this.fresnelFactor(thetaI, SCENE.mu, objectRI, 'p');
          fresnelFactor = Math.min(fresnelFactor, 0.5);

          pixelColor = Color.mix(intersectedSphere.color, reflectedColorComponent, objectTransparency) // remove most of object color if transparency present

          if (objectRI > 1) {
            // SNELL's LAW
            const cosTheta1 = Vector3.dotProduct(Vector3.normalize(ray.direction), normalVector)
            const refractiveRatio = SCENE.mu / objectRI
            const cosTheta2 = Math.sqrt(1 - Math.pow(refractiveRatio, 2) * (1 - Math.pow(cosTheta1, 2)))

            // TRANSPARENCY
            pixelOpacity = this.adjustPixelOpacity(pixelOpacity, intersectedSphere, fresnelFactor)

            if (this.isTotalInternalReflection(cosTheta2, cosTheta1, SCENE, objectRI)) {
              // Total Internal Reflection or imaginary value for cosTheta2
              pixelColor = this.handleTotalInternalReflection(ray, normalVector, pointOfIntersection, SCENE, depth, fresnelFactor, pixelColor)
            }
            else {
              const refractiveRatio = SCENE.mu / objectRI
              const refractedRayDirection = ray.direction.scale(refractiveRatio).minus(normalVector.scale(refractiveRatio * (cosTheta1) + cosTheta2))
              const refractedRay = new Ray(
                pointOfIntersection,
                refractedRayDirection
              )

              const refractedColorComponent = Color.mix(this.tracedValueAtPixel(refractedRay, SCENE, depth - 1).pixelColor, (SCENE.backgroundColor), fresnelFactor)
              pixelColor = Color.mix(refractedColorComponent, pixelColor, 0.2);
            }
          }
        }
      }
    }
    else {
      // no object intersected
      pixelColor = Object.assign(pixelColor, SCENE.backgroundColor)
    }
    Color.clampColors(pixelColor)
    // if(pixelColor.r || pixelColor.g || pixelColor.b ) console.log(pixelColor)
    return { pixelColor: pixelColor, pixelOpacity }
  }



}

