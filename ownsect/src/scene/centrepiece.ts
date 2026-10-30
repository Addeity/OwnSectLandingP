/*
 * What stands at the still centre of the ring of cards: the brand's 3D mark
 * when there is one (BRAND.mark3d, a glTF file under public/), and a chrome
 * ring until then. Either way it wears the chrome, so a model made anywhere,
 * in whatever materials, matches the ring around it.
 *
 * The chrome is a matcap: the mirror metal, its studio and its lights baked
 * into one image by tools/matcap.html. It shades exactly as the lit,
 * reflecting material did, for the cost of a texture lookup.
 */
import {
  Box3, Group, ImageBitmapLoader, type Material, Mesh, MeshMatcapMaterial, SRGBColorSpace, Texture, TorusGeometry, Vector3,
} from 'three';
import chromeUrl from './chrome-matcap.jpg';

/** how wide the mark stands, as a share of the ring's radius: its wider side, the chrome ring's own width */
const MARK_SPAN = 0.6;

/** the baked chrome, decoded off the main thread */
export async function loadChrome(): Promise<Texture> {
  const bitmap = await new ImageBitmapLoader().setOptions({ imageOrientation: 'flipY' }).loadAsync(chromeUrl);
  const texture = new Texture(bitmap);
  texture.flipY = false;   // already flipped while decoding
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * The 3D mark, loaded from its file. The loader is fetched only when a mark
 * is set (the page without one never downloads it), and the file's own
 * materials are let go at once, since every mesh is given the chrome.
 * Expects a plain .glb or .gltf: a Draco-compressed file needs a decoder
 * this page does not carry.
 */
export async function loadMark(url: string): Promise<Group> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);
  gltf.scene.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    for (const m of [mesh.material].flat()) (m as Material).dispose();
    // the chrome is looked up by the surface's direction: a model saved without normals is given them
    if (!mesh.geometry.getAttribute('normal')) mesh.geometry.computeVertexNormals();
  });
  return gltf.scene;
}

/**
 * The centrepiece: the mark if there is one, centred on its own bounds and
 * sized to the ring's middle, or the chrome ring. A mark is flagged as a
 * word (userData.word): the stage sways it rather than spinning it, so it
 * is never read from behind.
 */
export function createCentrepiece(radius: number, chromeMap: Texture, mark?: Group | null): Group {
  const chrome = new MeshMatcapMaterial({ matcap: chromeMap });
  const group = new Group();
  if (mark) {
    const model = mark.clone(true);
    model.traverse((o) => { if ((o as Mesh).isMesh) (o as Mesh).material = chrome; });
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const scale = (radius * MARK_SPAN) / Math.max(size.x, size.y, 1e-6);
    // scaled about its own origin, so its place scales with it; then moved so the middle of its bounds is the ring's
    model.scale.multiplyScalar(scale);
    model.position.multiplyScalar(scale).sub(box.getCenter(new Vector3()).multiplyScalar(scale));
    group.add(model);
    // the geometry is the loaded file's, shared by every build of the centre: only the chrome is the centre's own to dispose
    group.userData = { word: true, sharedGeometry: true };
  } else {
    group.add(new Mesh(new TorusGeometry(radius * 0.22, radius * 0.064, 64, 192), chrome));
  }
  group.position.z = -0.6;
  return group;
}

export function disposeGroup(g: Group): void {
  const shared = g.userData.sharedGeometry === true;
  g.traverse((o) => {
    const m = o as Mesh;
    if (!shared) m.geometry?.dispose();
    (m.material as Material | undefined)?.dispose?.();
  });
}
