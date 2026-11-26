const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./Game-DbiVRb6e.js","./Physics-muboJDTC.js","./Physics-BKKLwhFq.js"])))=>i.map(i=>d[i]);
(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{telegram=window.Telegram?.WebApp;touch=matchMedia(`(pointer: coarse)`).matches||navigator.maxTouchPoints>0&&!matchMedia(`(any-pointer: fine)`).matches;ready(){this.telegram?.ready(),this.telegram?.expand()}feedback(e){this.telegram?.HapticFeedback?.impactOccurred(e)}},t=`ai-took-my-job:v1`,n=class{data={muted:!1,bestSeconds:null,completed:0};constructor(){try{let e=JSON.parse(localStorage.getItem(t)??`null`);typeof e?.muted==`boolean`&&(this.data.muted=e.muted),typeof e?.bestSeconds==`number`&&Number.isFinite(e.bestSeconds)&&e.bestSeconds>0&&(this.data.bestSeconds=e.bestSeconds),typeof e?.completed==`number`&&Number.isSafeInteger(e.completed)&&e.completed>=0&&(this.data.completed=e.completed)}catch{}}get muted(){return this.data.muted}get bestSeconds(){return this.data.bestSeconds}setMuted(e){this.data.muted=e,this.persist()}finish(e){let t=this.data.bestSeconds===null||e<this.data.bestSeconds;return t&&(this.data.bestSeconds=e),this.data.completed++,this.persist(),t}persist(){try{localStorage.setItem(t,JSON.stringify(this.data))}catch{}}};function r(e){let t=Math.floor(e);return`${String(Math.floor(t/60)).padStart(2,`0`)}:${String(t%60).padStart(2,`0`)}`}var i=class{canvas;joystick;app;actions=new Map;dialog;prompt;toast;marker;goal;timer;counter;held;toastId=0;screen=`loading`;constructor(e,t){this.app=e,e.dataset.touch=String(t),e.innerHTML=`
      <canvas id="game" aria-label="Трёхмерный офис"></canvas>
      <div class="scrim"></div>
      <header class="masthead">
        <div class="brand"><span class="brand-mark" aria-hidden="true"><i></i></span><span>AUTO DIVISION<small>ОПЕРАЦИОННЫЙ ОТДЕЛ</small></span></div>
        <div class="mast-actions">
          <span class="build">ПРОТОТИП <span>0.1</span></span>
          <button type="button" class="icon-button" data-action="mute" aria-label="Выключить звук" title="Звук"><span class="speaker" aria-hidden="true"></span></button>
          <button type="button" class="icon-button pause-button" data-action="pause" aria-label="Пауза" title="Пауза"><span aria-hidden="true">Ⅱ</span></button>
        </div>
      </header>
      <section class="screen loading" data-panel="loading" aria-live="polite"><p class="label"><span class="status-dot"></span> Подключаем последнего сотрудника…</p></section>
      <section class="screen menu" data-panel="menu" hidden>
        <div class="hero">
          <div class="eyebrow"><span></span> ОФИСНЫЙ СИМУЛЯТОР &nbsp;/&nbsp; 2027</div>
          <h1>AI TOOK<br>MY <em>JOB.</em></h1>
          <p class="hero-copy">ИИ заменил весь офис. Кроме тебя.<br>Теперь ты отвечаешь за то, что он сломал.</p>
          <div class="menu-actions">
            <button type="button" class="primary" data-action="start"><span class="play-icon" aria-hidden="true"></span> Начать смену</button>
            <button type="button" class="secondary" data-action="help">Управление</button>
          </div>
        </div>
        <div class="scene-tag"><span></span><div><strong>ПОМОЩНИК HR-01</strong><small>СОКРАЩАЕТ ДИСТАНЦИЮ. И ШТАТ.</small></div></div>
        <footer class="menu-footer"><span>СМЕНА 01 <b>·</b> СБОЙ ПЕЧАТИ</span><span data-best>ОФИС AUTO DIVISION</span></footer>
      </section>
      <section class="screen hud" data-panel="playing" hidden>
        <div class="objective">
          <div class="objective-meta"><span><i></i> ТЕКУЩАЯ ЗАДАЧА</span><span data-counter>0 / 2</span></div>
          <strong data-goal>Возьмите картридж</strong>
          <div class="shift-line"><span>СМЕНА 01</span><span data-timer>00:00</span></div>
        </div>
        <div class="crosshair" aria-hidden="true"></div>
        <div class="world-marker" aria-hidden="true" hidden><i></i><span></span></div>
        <div class="focus" hidden></div>
        <div class="held" hidden></div>
        <div class="toast" role="status" hidden></div>
        <div class="hud-keys"><kbd>WASD</kbd> Ходить <kbd>E</kbd> Действие <kbd>Q</kbd> Бросить <kbd>F</kbd> Отпустить <kbd>Esc</kbd> Пауза</div>
        <div class="touch-controls">
          <div class="joystick" aria-label="Джойстик движения"><span></span></div>
          <div class="touch-buttons">
            <button type="button" data-action="drop">Отпустить</button>
            <button type="button" data-action="throw">Бросить</button>
            <button type="button" data-action="jump">Прыжок</button>
            <button type="button" data-action="use" class="touch-use">Действие</button>
          </div>
        </div>
      </section>
      <section class="screen overlay" data-panel="pause" hidden>
        <div class="card">
          <p class="label">СМЕНА ПРИОСТАНОВЛЕНА</p>
          <h2>Перерыв.</h2>
          <p>Ваше отсутствие зарегистрировано.</p>
          <button type="button" class="primary" data-action="resume">Продолжить</button>
          <button type="button" class="secondary" data-action="menu">В главное меню</button>
        </div>
      </section>
      <section class="screen overlay" data-panel="results" hidden>
        <div class="card">
          <p class="label"><span class="status-dot"></span> ЗАДАЧА ВЫПОЛНЕНА</p>
          <h2>Смена закрыта.</h2>
          <p>Принтер выдал справку о том, что люди больше не нужны.</p>
          <div class="score"><span>ВРЕМЯ СМЕНЫ</span><strong data-score>00:00</strong><span data-record></span></div>
          <button type="button" class="primary" data-action="restart">Ещё одна смена</button>
          <button type="button" class="secondary" data-action="menu">В главное меню</button>
        </div>
      </section>
      <section class="screen overlay" data-panel="error" hidden>
        <div class="card"><p class="label">СБОЙ ЗАПУСКА</p><h2>Офис закрыт.</h2><p data-error></p><button type="button" class="primary" data-reload>Повторить</button></div>
      </section>
      <dialog class="card help">
        <form method="dialog"><button class="icon-button close" aria-label="Закрыть">×</button></form>
        <p class="label">ПЕРЕД НАЧАЛОМ СМЕНЫ</p>
        <h2>Управление</h2>
        <dl class="desktop-help">
          <dt>Движение</dt><dd>WASD / стрелки</dd>
          <dt>Обзор</dt><dd>Мышь или перетаскивание по сцене</dd>
          <dt>Действие / взять</dt><dd>E</dd>
          <dt>Бросить / отпустить</dt><dd>Q / F</dd>
          <dt>Прыжок / пауза</dt><dd>Пробел / Esc</dd>
        </dl>
        <dl class="mobile-help">
          <dt>Движение</dt><dd>Джойстик слева</dd>
          <dt>Обзор</dt><dd>Проведите пальцем по офису</dd>
          <dt>Взять / использовать</dt><dd>Наведите прицел и нажмите «Действие»</dd>
        </dl>
      </dialog>`,this.canvas=this.get(`#game`),this.joystick=this.get(`.joystick`),this.dialog=this.get(`dialog`),this.prompt=this.get(`.focus`),this.toast=this.get(`.toast`),this.marker=this.get(`.world-marker`),this.goal=this.get(`[data-goal]`),this.timer=this.get(`[data-timer]`),this.counter=this.get(`[data-counter]`),this.held=this.get(`.held`);for(let t of e.querySelectorAll(`[data-action]`))t.addEventListener(`click`,()=>this.actions.get(t.dataset.action)?.());this.on(`help`,()=>this.dialog.showModal()),this.get(`[data-reload]`).addEventListener(`click`,()=>location.reload()),this.show(`loading`)}on(e,t){this.actions.set(e,t)}show(e){let t=this.screen;this.screen=e,this.app.dataset.screen=e;for(let t of this.app.querySelectorAll(`[data-panel]`))t.hidden=t.dataset.panel!==e;e===`playing`?document.activeElement?.blur():(this.prompt.hidden=this.marker.hidden=!0,e!==`loading`&&(e!==`menu`||t!==`loading`)&&this.app.querySelector(`[data-panel="${e}"] button`)?.focus({preventScroll:!0}))}hud(e,t,n,i,a){this.setText(this.goal,e===`printing`?`Принтер печатает…`:t?`Установите картридж в PR-404`:`Возьмите картридж`),this.setText(this.counter,e===`collect`?`0 / 2`:e===`deliver`?`1 / 2`:`2 / 2`),this.setText(this.timer,r(a)),this.setText(this.prompt,n?this.app.dataset.touch===`true`?n:`E  ·  ${n}`:``),this.prompt.hidden=!n,this.setText(this.held,i?`В РУКАХ · ${i}`:``),this.held.hidden=!i,this.app.dataset.holding=String(!!i)}mark(e,t,n){this.marker.hidden=!1,this.marker.style.left=`${e.toFixed(1)}%`,this.marker.style.top=`${t.toFixed(1)}%`,this.setText(this.marker.lastElementChild,n)}hideMarker(){this.marker.hidden=!0}notify(e,t=3.5){clearTimeout(this.toastId),this.toast.hidden=!1,this.toast.textContent=e,this.toastId=window.setTimeout(()=>{this.toast.hidden=!0},t*1e3)}clearNotification(){clearTimeout(this.toastId),this.toast.hidden=!0}sound(e){let t=this.get(`[data-action="mute"]`);t.setAttribute(`aria-label`,e?`Включить звук`:`Выключить звук`),t.setAttribute(`aria-pressed`,String(e)),t.classList.toggle(`muted`,e)}record(e){this.get(`[data-best]`).textContent=e===null?`ОФИС AUTO DIVISION`:`ЛИЧНЫЙ РЕКОРД · ${r(e)}`}results(e,t){this.get(`[data-score]`).textContent=r(e),this.get(`[data-record]`).textContent=t?`ЛИЧНЫЙ РЕКОРД`:``,this.show(`results`)}error(e){this.get(`[data-error]`).textContent=e,this.show(`error`)}get(e){return this.app.querySelector(e)}setText(e,t){e.textContent!==t&&(e.textContent=t)}},a=`modulepreload`,o=function(e,t){return new URL(e,t).href},s={},c={},l=function(e){return e.pathname.endsWith(`.css`)},u=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw delete e[t],n});return e[t]=i,i},d=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),d=i?.nonce||i?.getAttribute(`nonce`);function f(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function p(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=f(t.map(t=>{t=o(t,n);let r=p(t),i=l(r);return u(s,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}let t=i?e.styles:e.all,n=i?c[r.href]:void 0;if(!n&&t.has(r.href))return;let o=document.createElement(`link`);if(o.rel=i?`stylesheet`:a,i||(o.as=`script`),o.crossOrigin=``,o.href=r.href,d&&o.setAttribute(`nonce`,d),n&&delete c[r.href],n?.isConnected?n.replaceWith(o):document.head.appendChild(o),i)return new Promise((e,t)=>{let n=i=>{o.removeEventListener(`load`,n),o.removeEventListener(`error`,n),i.type===`error`?(c[r.href]=o,t(Error(`Unable to preload CSS for ${r}`))):e(i)};o.addEventListener(`load`,n),o.addEventListener(`error`,n)})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},f=new e,p=new i(document.querySelector(`#app`),f.touch);try{let[{Game:e},{Physics:t}]=await Promise.all([d(()=>import(`./Game-DbiVRb6e.js`),__vite__mapDeps([0,1]),import.meta.url),d(()=>import(`./Physics-BKKLwhFq.js`),__vite__mapDeps([2,1]),import.meta.url)]);new e(p,await t.create(),f,new n),f.ready()}catch(e){console.error(e),p.error(e instanceof Error&&e.message.includes(`WebGL`)?`Для запуска нужен браузер с WebGL 2 и включённым аппаратным ускорением.`:`Не удалось загрузить офис. Попробуйте перезапустить страницу.`)}