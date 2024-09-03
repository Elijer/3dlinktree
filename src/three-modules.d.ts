declare module 'three/examples/jsm/controls/OrbitControls' {
  export class OrbitControls {
    constructor(camera: THREE.Camera, domElement?: HTMLElement);
    update(): void;
  }
}

declare module 'three/examples/jsm/geometries/TextGeometry' {
  export class TextGeometry extends THREE.ExtrudeGeometry {
    constructor(text: string, parameters?: any);
  }
}

declare module 'three/examples/jsm/loaders/FontLoader' {
  export class FontLoader extends THREE.Loader {
    load(url: string, onLoad?: (responseFont: Font) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
    parse(json: any): Font;
  }

  export class Font {
    constructor(jsondata: any);
  }
}