import { Group, Vector3 } from 'three';
import type { Object3D } from 'three';
import { Prop } from '../interaction/Prop';
import type { BoxSize, Physics } from '../physics/Physics';
import { box, cylinder, glow } from '../rendering/Primitives';
import { CARTRIDGE_POSITION } from './Office';
import { FILTER_POSITION } from './OfficeStations';

export function makeProps(scene: Object3D, physics: Physics): Prop[] {
  const spawn = (id: string, label: string, position: Vector3, size: BoxSize, draw: (mesh: Group) => void) => {
    const mesh = new Group();
    mesh.position.copy(position);
    draw(mesh);
    scene.add(mesh);
    return new Prop(id, label, mesh, physics, size);
  };
  const cartridge = spawn('cartridge', 'Картридж', CARTRIDGE_POSITION, [0.49, 0.31, 0.35], (mesh) => {
    box(mesh, [0.49, 0.29, 0.35], 0, 0, 0, '#ff9c3f');
    box(mesh, [0.35, 0.069, 0.27], 0, 0.142, 0, '#293c45');
    box(mesh, [0.38, 0.11, 0.018], 0, 0.027, 0.177, '#f6e4b6');
    glow(mesh, [0.11, 0.044, 0.023], 0.11, 0.027, 0.187, '#5ef4c3');
    for (let i = 0; i < 4; i++) box(mesh, [0.022, 0.084, 0.025], -0.153 + i * 0.044, 0.027, 0.186, '#293c45');
  });
  const mug = spawn('mug', 'Кружка', new Vector3(-0.42, 1.23, -3.26), [0.27, 0.27, 0.22], (mesh) => {
    cylinder(mesh, 0.11, 0.095, 0.26, 10, 0, 0, 0, '#bf6d57');
    cylinder(mesh, 0.09, 0.09, 0.008, 10, 0, 0.132, 0, '#442e2c');
    box(mesh, [0.075, 0.035, 0.048], 0.128, 0.056, 0, '#bf6d57');
    box(mesh, [0.075, 0.035, 0.048], 0.128, -0.045, 0, '#bf6d57');
    box(mesh, [0.03, 0.115, 0.045], 0.165, 0.007, 0, '#bf6d57');
  });
  const filter = spawn('filter', 'Фильтр BREW-OPS', FILTER_POSITION, [0.24, 0.24, 0.24], (mesh) => {
    cylinder(mesh, 0.11, 0.11, 0.23, 10, 0, 0, 0, '#557c7f');
    cylinder(mesh, 0.12, 0.12, 0.04, 10, 0, 0.106, 0, '#ffd077');
    cylinder(mesh, 0.12, 0.12, 0.04, 10, 0, -0.106, 0, '#ffd077');
    glow(mesh, [0.069, 0.044, 0.009], 0, 0.015, 0.111, '#87f5cb');
  });
  const packages = [[-4.75, -0.41], [-4.05, -0.53], [7.26, -6.48], [-5.15, -6.26]] as const;
  return [cartridge, mug, filter, ...packages.map(([x, z], index) => spawn(
    `box-${index}`, 'Архивная коробка', new Vector3(x, 1.23, z), [0.42, 0.34, 0.38],
    (mesh) => {
      box(mesh, [0.42, 0.34, 0.38], 0, 0, 0, '#c29b6a');
      box(mesh, [0.13, 0.009, 0.38], 0, 0.172, 0, '#f2ce91');
      box(mesh, [0.22, 0.096, 0.01], 0, 0.034, 0.193, '#ece2cc');
      box(mesh, [0.138, 0.025, 0.012], 0, 0.032, 0.198, '#3e5050');
    },
  ))];
}
