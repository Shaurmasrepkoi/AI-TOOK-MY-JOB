import './ui/game.css';
import { Platform } from './platform/Platform';
import { Save } from './save/Save';
import { UI } from './ui/UI';

const platform = new Platform();
const ui = new UI(document.querySelector<HTMLElement>('#app')!, platform.touch);

try {
  const [{ Game }, { Physics }] = await Promise.all([
    import('./core/Game'),
    import('./physics/Physics'),
  ]);
  const physics = await Physics.create();
  new Game(ui, physics, platform, new Save());
  platform.ready();
} catch (error) {
  console.error(error);
  ui.error(error instanceof Error && error.message.includes('WebGL')
    ? 'Для запуска нужен браузер с WebGL 2 и включённым аппаратным ускорением.'
    : 'Не удалось загрузить офис. Попробуйте перезапустить страницу.');
}
