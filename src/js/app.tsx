import * as React from "react";
import * as ReactDOM from "react-dom";
import * as THREE from "three";
// import "../css/style.scss";

import frag from "./shaders/shader.frag";
import vert from "./shaders/shader.vert";

function degToRad(d: number) {
  return d * (Math.PI / 180);
}

function radToDeg(r: number) {
  return r * (180 / Math.PI);
}

function randomGen(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function easeInOutCubic(t: number, b: number, c: number, d: number) {
	t /= d/2;
	if (t < 1) return c/2*t*t*t + b;
	t -= 2;
	return c/2*(t*t*t + 2) + b;
}

let canvas: HTMLCanvasElement;

let
font: THREE.Font,
textMaterial: THREE.ShaderMaterial,
particlesMaterial: THREE.ShaderMaterial,
textGeometry: THREE.BufferGeometry,
particlesGeometry: THREE.BufferGeometry,
camera: THREE.PerspectiveCamera,
scene: THREE.Scene,
renderer: THREE.WebGLRenderer;


const fontStyle = {
  size: 64,
  height: 0,  
};

class Canvas3d {
  cw: number;
  ch: number;
  vol: number;
  tick: number;
  currentText: string;

  constructor(width: number, height:number){
    this.cw = width;
    this.ch = height;
    this.vol = 10;
    this.tick = 0;
    this.currentText = "Ikeda Takumi";
  }

  fontLoader(){
    return new Promise((resolve, reject) => {
      const loader = new THREE.FontLoader();
      loader.load("/assets/oswald.typeface.json", (font) => {
        resolve(font);
      });    
    });
  }

  async init(){
    await this.fontLoader().then((res: any) => {
      font = res;
    });

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setClearColor( 0xffffff, 0);

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( this.cw, this.ch );
    
    const fov = 70;
    const distance = (this.ch / 2) / Math.tan(degToRad(fov / 2));

    camera = new THREE.PerspectiveCamera( fov, this.cw / this.ch, 1, distance * 2 );
    camera.aspect = this.cw / this.ch;
    camera.updateProjectionMatrix();
    camera.position.set( 0, 0, distance );
    camera.lookAt( 0, 0, 0 );

    scene = new THREE.Scene();

    // const axes = new THREE.AxesHelper(25);
    // scene.add(axes);

    renderer.render( scene, camera );
    this.init3dText();
    window.addEventListener("resize", () => {
      this.handleResize();
    });
  }

  init3dText(){
    textMaterial = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.DoubleSide,
      // wireframe: true,
      uniforms: {
        ticker: {
          type: "f",
          value: 0
        }
      }
    });
    const textGeometry = new THREE.TextBufferGeometry(this.currentText, {
      ...fontStyle,
      font: font
    });
    textGeometry.center();
    textGeometry.addAttribute("fPosition", new THREE.BufferAttribute(textGeometry.attributes.position.array, 3));

    const mesh = new THREE.Mesh( textGeometry, textMaterial );
    mesh.name = "current";
    scene.add(mesh);
    renderer.render(scene, camera);
  }

  update3dText(text: string){
    for(let i = 0, len = scene.children.length; i < len; i++){
      if(scene.children[i] && scene.children[i].name === "current"){
        scene.remove( scene.children[i] );
      }
    }
    let currentTextGeometryStore, nextTextGeometryStore,  maxVertCount = 0;

    const nextText = text;

    currentTextGeometryStore = new THREE.TextBufferGeometry(this.currentText, {
      ...fontStyle,
      font: font
    });
    currentTextGeometryStore.center();
    nextTextGeometryStore = new THREE.TextBufferGeometry(nextText, {
      ...fontStyle,
      font: font
    });
    nextTextGeometryStore.center();
    maxVertCount = Math.max(currentTextGeometryStore.attributes.position.count, nextTextGeometryStore.attributes.position.count);
    this.currentText = text;

    let
      fPosition = new Float32Array(maxVertCount * 3),
      tPosition = new Float32Array(maxVertCount * 3),
      rPosition = new Float32Array(maxVertCount * 3),
      color = new Float32Array(maxVertCount * 3),
      index = new Uint16Array(maxVertCount);

    for(let i = 0, len = maxVertCount; i < len; i++){
      const fi = i % currentTextGeometryStore.attributes.position.count;
      const ti = i % nextTextGeometryStore.attributes.position.count;
      const x = i * 3 + 0, y =  i * 3 + 1, z = i * 3 + 2;
      fPosition[x] = currentTextGeometryStore.attributes.position.array[fi * 3 + 0] || 0;
      fPosition[y] = currentTextGeometryStore.attributes.position.array[fi * 3 + 1] || 0;
      fPosition[z] = currentTextGeometryStore.attributes.position.array[fi * 3 + 2] || 0;

      tPosition[x] = nextTextGeometryStore.attributes.position.array[ti * 3 + 0] || 0;
      tPosition[y] = nextTextGeometryStore.attributes.position.array[ti * 3 + 1] || 0;
      tPosition[z] = nextTextGeometryStore.attributes.position.array[ti * 3 + 2] || 0;

      // rPosition[x] = Math.random() * 100 - 50;
      // rPosition[y] = Math.random() * 100 - 50;
      // rPosition[z] = Math.random() * 100 - 50;
      rPosition[x] = 0;
      rPosition[y] = 0;
      rPosition[z] = 0;

      const c = new THREE.Color(Math.floor(Math.random() * 16777215));

      color[x] = c.r;
      color[y] = c.g;
      color[z] = c.b;

      index[i] = i;
    }

    textMaterial = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.DoubleSide,
      // wireframe: true,
      uniforms: {
        ticker: {
          type: "f",
          value: 0
        }
      }
    });

    textGeometry = new THREE.BufferGeometry();
    textGeometry.addAttribute("fPosition", new THREE.BufferAttribute(fPosition, 3));
    textGeometry.addAttribute("tPosition", new THREE.BufferAttribute(tPosition, 3));
    textGeometry.addAttribute("rPosition", new THREE.BufferAttribute(rPosition, 3));
    textGeometry.setIndex(new THREE.BufferAttribute(index, 1));

    const mesh = new THREE.Mesh(textGeometry, textMaterial);
    scene.add(mesh);
    mesh.name = "current";
    renderer.render(scene, camera);
    this.tick = 0;
    this.update();
  }


  render(){
    renderer.render( scene, camera );
  }

  update(){
    this.tick++;
    const ticker = this.tick * .01;
    // material.uniforms.ticker.value = ( 1 - Math.cos(ticker)) / 2;
    textMaterial.uniforms.ticker.value = easeInOutCubic(this.tick, 0, 1, 50);
    this.render();
    if(textMaterial.uniforms.ticker.value < 1){
      const timer = window.requestAnimationFrame(() => {
        this.update();
      });
    }
  }

  handleResize(){
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    this.render();
  }
}

interface IProps{

}

interface IState{
  width: number;
  height: number;
  canvas3d: Canvas3d;
}

export class App extends React.Component<IProps, IState> {
  constructor(props: any){
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      canvas3d: new Canvas3d(window.innerWidth, window.innerHeight)
    };
    this.handleBtnClick = this.handleBtnClick.bind(this);
  }

  componentDidMount(){
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
      canvas3d: new Canvas3d(this.state.width, this.state.height)
    });

    canvas.width = this.state.width;
    canvas.height = this.state.height;
    this.state.canvas3d.init();
  }

  handleBtnClick(ev: any){
    this.state.canvas3d.update3dText(ev.target.dataset.text);
  }

  render(){
    const btnStyle: React.CSSProperties = {
      zIndex: 999,
      position: "relative"
    };
    
    return (
      <div>
        <canvas id="canvas" width="640" height="480" ref={ (elm: HTMLCanvasElement) => { canvas = elm; } } />
        <ul className="btn" style={btnStyle}>
          <li>
            <button data-text="TOP" onClick={this.handleBtnClick}>
              TOP
            </button>
          </li>
          <li>
            <button data-text="ABOUT" onClick={this.handleBtnClick}>
              ABOUT
            </button>
          </li>
          <li>
            <button data-text="WORKS" onClick={this.handleBtnClick}>
              WORKS
            </button>
          </li>
          <li>
            <button data-text="BLOG" onClick={this.handleBtnClick}>
              BLOG
            </button>
          </li>
          <li>
            <button data-text="CONTACT" onClick={this.handleBtnClick}>
              CONTACT
            </button>
          </li>
        </ul>
      </div>
    );
  }

}

ReactDOM.render(<App />, document.getElementById("root"));
export default App;