var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const SOUP = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SOUP_LEN = 87;
const ID_LEN = 20;
const reusedIdCarrier = [];
const genUID = () => {
  for (let i = 0; i < ID_LEN; i++) {
    reusedIdCarrier[i] = SOUP.charAt(Math.random() * SOUP_LEN);
  }
  return reusedIdCarrier.join("");
};
function invoke(fn) {
  try {
    return fn();
  } catch (e) {
    console.error(e);
  }
}
class SideEffectManager {
  constructor() {
    this.push = this.addDisposer;
    this.disposers = /* @__PURE__ */ new Map();
  }
  addDisposer(disposer, disposerID = this.genUID()) {
    this.flush(disposerID);
    this.disposers.set(disposerID, Array.isArray(disposer) ? joinDisposers(disposer) : disposer);
    return disposerID;
  }
  add(executor, disposerID = this.genUID()) {
    const disposers = executor();
    return disposers ? this.addDisposer(disposers, disposerID) : disposerID;
  }
  addEventListener(el, type, listener, options, disposerID = this.genUID()) {
    el.addEventListener(type, listener, options);
    this.addDisposer(() => el.removeEventListener(type, listener, options), disposerID);
    return disposerID;
  }
  setTimeout(handler, timeout, disposerID = this.genUID()) {
    const ticket = window.setTimeout(() => {
      this.remove(disposerID);
      handler();
    }, timeout);
    return this.addDisposer(() => window.clearTimeout(ticket), disposerID);
  }
  setInterval(handler, timeout, disposerID = this.genUID()) {
    const ticket = window.setInterval(handler, timeout);
    return this.addDisposer(() => window.clearInterval(ticket), disposerID);
  }
  remove(disposerID) {
    const disposer = this.disposers.get(disposerID);
    this.disposers.delete(disposerID);
    return disposer;
  }
  flush(disposerID) {
    const disposer = this.remove(disposerID);
    if (disposer) {
      disposer();
    }
  }
  flushAll() {
    this.disposers.forEach(invoke);
    this.disposers.clear();
  }
  genUID() {
    let uid;
    do {
      uid = genUID();
    } while (this.disposers.has(uid));
    return uid;
  }
}
function joinDisposers(disposers) {
  return () => disposers.forEach(invoke);
}
function isObject(val) {
  return val != null && typeof val === "object" && !Array.isArray(val);
}
function ensureAttributes(context, initAttrs) {
  let attrs = context.getAttributes();
  if (!attrs) {
    context.setAttributes(initAttrs);
    attrs = context.getAttributes();
  }
  if (!attrs) {
    throw new Error("[NetlessAppMonaco] No attributes");
  }
  if (isObject(initAttrs)) {
    Object.keys(initAttrs).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) {
        context.updateAttributes([key], initAttrs[key]);
      }
    });
  }
  return attrs;
}
const anyMap = /* @__PURE__ */ new WeakMap();
const eventsMap = /* @__PURE__ */ new WeakMap();
const producersMap = /* @__PURE__ */ new WeakMap();
const anyProducer = Symbol("anyProducer");
const resolvedPromise = Promise.resolve();
const listenerAdded = Symbol("listenerAdded");
const listenerRemoved = Symbol("listenerRemoved");
let isGlobalDebugEnabled = false;
function assertEventName(eventName) {
  if (typeof eventName !== "string" && typeof eventName !== "symbol") {
    throw new TypeError("eventName must be a string or a symbol");
  }
}
function assertListener(listener) {
  if (typeof listener !== "function") {
    throw new TypeError("listener must be a function");
  }
}
function getListeners(instance, eventName) {
  const events = eventsMap.get(instance);
  if (!events.has(eventName)) {
    events.set(eventName, /* @__PURE__ */ new Set());
  }
  return events.get(eventName);
}
function getEventProducers(instance, eventName) {
  const key = typeof eventName === "string" || typeof eventName === "symbol" ? eventName : anyProducer;
  const producers = producersMap.get(instance);
  if (!producers.has(key)) {
    producers.set(key, /* @__PURE__ */ new Set());
  }
  return producers.get(key);
}
function enqueueProducers(instance, eventName, eventData) {
  const producers = producersMap.get(instance);
  if (producers.has(eventName)) {
    for (const producer of producers.get(eventName)) {
      producer.enqueue(eventData);
    }
  }
  if (producers.has(anyProducer)) {
    const item = Promise.all([eventName, eventData]);
    for (const producer of producers.get(anyProducer)) {
      producer.enqueue(item);
    }
  }
}
function iterator(instance, eventNames) {
  eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
  let isFinished = false;
  let flush = () => {
  };
  let queue = [];
  const producer = {
    enqueue(item) {
      queue.push(item);
      flush();
    },
    finish() {
      isFinished = true;
      flush();
    }
  };
  for (const eventName of eventNames) {
    getEventProducers(instance, eventName).add(producer);
  }
  return {
    async next() {
      if (!queue) {
        return { done: true };
      }
      if (queue.length === 0) {
        if (isFinished) {
          queue = void 0;
          return this.next();
        }
        await new Promise((resolve) => {
          flush = resolve;
        });
        return this.next();
      }
      return {
        done: false,
        value: await queue.shift()
      };
    },
    async return(value) {
      queue = void 0;
      for (const eventName of eventNames) {
        getEventProducers(instance, eventName).delete(producer);
      }
      flush();
      return arguments.length > 0 ? { done: true, value: await value } : { done: true };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
function defaultMethodNamesOrAssert(methodNames) {
  if (methodNames === void 0) {
    return allEmitteryMethods;
  }
  if (!Array.isArray(methodNames)) {
    throw new TypeError("`methodNames` must be an array of strings");
  }
  for (const methodName of methodNames) {
    if (!allEmitteryMethods.includes(methodName)) {
      if (typeof methodName !== "string") {
        throw new TypeError("`methodNames` element must be a string");
      }
      throw new Error(`${methodName} is not Emittery method`);
    }
  }
  return methodNames;
}
const isListenerSymbol = (symbol) => symbol === listenerAdded || symbol === listenerRemoved;
class Emittery {
  static mixin(emitteryPropertyName, methodNames) {
    methodNames = defaultMethodNamesOrAssert(methodNames);
    return (target) => {
      if (typeof target !== "function") {
        throw new TypeError("`target` must be function");
      }
      for (const methodName of methodNames) {
        if (target.prototype[methodName] !== void 0) {
          throw new Error(`The property \`${methodName}\` already exists on \`target\``);
        }
      }
      function getEmitteryProperty() {
        Object.defineProperty(this, emitteryPropertyName, {
          enumerable: false,
          value: new Emittery()
        });
        return this[emitteryPropertyName];
      }
      Object.defineProperty(target.prototype, emitteryPropertyName, {
        enumerable: false,
        get: getEmitteryProperty
      });
      const emitteryMethodCaller = (methodName) => function(...args) {
        return this[emitteryPropertyName][methodName](...args);
      };
      for (const methodName of methodNames) {
        Object.defineProperty(target.prototype, methodName, {
          enumerable: false,
          value: emitteryMethodCaller(methodName)
        });
      }
      return target;
    };
  }
  static get isDebugEnabled() {
    if (typeof process !== "object") {
      return isGlobalDebugEnabled;
    }
    const { env } = process || { env: {} };
    return env.DEBUG === "emittery" || env.DEBUG === "*" || isGlobalDebugEnabled;
  }
  static set isDebugEnabled(newValue) {
    isGlobalDebugEnabled = newValue;
  }
  constructor(options = {}) {
    anyMap.set(this, /* @__PURE__ */ new Set());
    eventsMap.set(this, /* @__PURE__ */ new Map());
    producersMap.set(this, /* @__PURE__ */ new Map());
    this.debug = options.debug || {};
    if (this.debug.enabled === void 0) {
      this.debug.enabled = false;
    }
    if (!this.debug.logger) {
      this.debug.logger = (type, debugName, eventName, eventData) => {
        eventData = JSON.stringify(eventData);
        if (typeof eventName === "symbol") {
          eventName = eventName.toString();
        }
        const currentTime = new Date();
        const logTime = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}.${currentTime.getMilliseconds()}`;
        console.log(`[${logTime}][emittery:${type}][${debugName}] Event Name: ${eventName}
	data: ${eventData}`);
      };
    }
  }
  logIfDebugEnabled(type, eventName, eventData) {
    if (Emittery.isDebugEnabled || this.debug.enabled) {
      this.debug.logger(type, this.debug.name, eventName, eventData);
    }
  }
  on(eventNames, listener) {
    assertListener(listener);
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    for (const eventName of eventNames) {
      assertEventName(eventName);
      getListeners(this, eventName).add(listener);
      this.logIfDebugEnabled("subscribe", eventName, void 0);
      if (!isListenerSymbol(eventName)) {
        this.emit(listenerAdded, { eventName, listener });
      }
    }
    return this.off.bind(this, eventNames, listener);
  }
  off(eventNames, listener) {
    assertListener(listener);
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    for (const eventName of eventNames) {
      assertEventName(eventName);
      getListeners(this, eventName).delete(listener);
      this.logIfDebugEnabled("unsubscribe", eventName, void 0);
      if (!isListenerSymbol(eventName)) {
        this.emit(listenerRemoved, { eventName, listener });
      }
    }
  }
  once(eventNames) {
    return new Promise((resolve) => {
      const off = this.on(eventNames, (data) => {
        off();
        resolve(data);
      });
    });
  }
  events(eventNames) {
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    for (const eventName of eventNames) {
      assertEventName(eventName);
    }
    return iterator(this, eventNames);
  }
  async emit(eventName, eventData) {
    assertEventName(eventName);
    this.logIfDebugEnabled("emit", eventName, eventData);
    enqueueProducers(this, eventName, eventData);
    const listeners = getListeners(this, eventName);
    const anyListeners = anyMap.get(this);
    const staticListeners = [...listeners];
    const staticAnyListeners = isListenerSymbol(eventName) ? [] : [...anyListeners];
    await resolvedPromise;
    await Promise.all([
      ...staticListeners.map(async (listener) => {
        if (listeners.has(listener)) {
          return listener(eventData);
        }
      }),
      ...staticAnyListeners.map(async (listener) => {
        if (anyListeners.has(listener)) {
          return listener(eventName, eventData);
        }
      })
    ]);
  }
  async emitSerial(eventName, eventData) {
    assertEventName(eventName);
    this.logIfDebugEnabled("emitSerial", eventName, eventData);
    const listeners = getListeners(this, eventName);
    const anyListeners = anyMap.get(this);
    const staticListeners = [...listeners];
    const staticAnyListeners = [...anyListeners];
    await resolvedPromise;
    for (const listener of staticListeners) {
      if (listeners.has(listener)) {
        await listener(eventData);
      }
    }
    for (const listener of staticAnyListeners) {
      if (anyListeners.has(listener)) {
        await listener(eventName, eventData);
      }
    }
  }
  onAny(listener) {
    assertListener(listener);
    this.logIfDebugEnabled("subscribeAny", void 0, void 0);
    anyMap.get(this).add(listener);
    this.emit(listenerAdded, { listener });
    return this.offAny.bind(this, listener);
  }
  anyEvent() {
    return iterator(this);
  }
  offAny(listener) {
    assertListener(listener);
    this.logIfDebugEnabled("unsubscribeAny", void 0, void 0);
    this.emit(listenerRemoved, { listener });
    anyMap.get(this).delete(listener);
  }
  clearListeners(eventNames) {
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    for (const eventName of eventNames) {
      this.logIfDebugEnabled("clear", eventName, void 0);
      if (typeof eventName === "string" || typeof eventName === "symbol") {
        getListeners(this, eventName).clear();
        const producers = getEventProducers(this, eventName);
        for (const producer of producers) {
          producer.finish();
        }
        producers.clear();
      } else {
        anyMap.get(this).clear();
        for (const listeners of eventsMap.get(this).values()) {
          listeners.clear();
        }
        for (const producers of producersMap.get(this).values()) {
          for (const producer of producers) {
            producer.finish();
          }
          producers.clear();
        }
      }
    }
  }
  listenerCount(eventNames) {
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    let count = 0;
    for (const eventName of eventNames) {
      if (typeof eventName === "string") {
        count += anyMap.get(this).size + getListeners(this, eventName).size + getEventProducers(this, eventName).size + getEventProducers(this).size;
        continue;
      }
      if (typeof eventName !== "undefined") {
        assertEventName(eventName);
      }
      count += anyMap.get(this).size;
      for (const value of eventsMap.get(this).values()) {
        count += value.size;
      }
      for (const value of producersMap.get(this).values()) {
        count += value.size;
      }
    }
    return count;
  }
  bindMethods(target, methodNames) {
    if (typeof target !== "object" || target === null) {
      throw new TypeError("`target` must be an object");
    }
    methodNames = defaultMethodNamesOrAssert(methodNames);
    for (const methodName of methodNames) {
      if (target[methodName] !== void 0) {
        throw new Error(`The property \`${methodName}\` already exists on \`target\``);
      }
      Object.defineProperty(target, methodName, {
        enumerable: false,
        value: this[methodName].bind(this)
      });
    }
  }
}
const allEmitteryMethods = Object.getOwnPropertyNames(Emittery.prototype).filter((v) => v !== "constructor");
Object.defineProperty(Emittery, "listenerAdded", {
  value: listenerAdded,
  writable: false,
  enumerable: true,
  configurable: false
});
Object.defineProperty(Emittery, "listenerRemoved", {
  value: listenerRemoved,
  writable: false,
  enumerable: true,
  configurable: false
});
var emittery = Emittery;
function fakeRoomStateChanged(page, maxPage, contextPath) {
  return {
    sceneState: {
      sceneName: `${page}`,
      scenePath: `${contextPath}/${page}`,
      contextPath,
      scenes: pageToScenes(maxPage),
      index: page - 1
    }
  };
}
function pageToScenes(maxPage) {
  const scenes = [];
  for (let page = 1; page <= maxPage; ++page) {
    scenes.push({ name: String(page) });
  }
  return scenes;
}
function prevPage(page) {
  return Math.max(1, page - 1);
}
function nextPage(page, maxPage) {
  return Math.min(maxPage, page + 1);
}
const height = 350;
var IframeEvents = /* @__PURE__ */ ((IframeEvents2) => {
  IframeEvents2["Init"] = "Init";
  IframeEvents2["AttributesUpdate"] = "AttributesUpdate";
  IframeEvents2["SetAttributes"] = "SetAttributes";
  IframeEvents2["RegisterMagixEvent"] = "RegisterMagixEvent";
  IframeEvents2["RemoveMagixEvent"] = "RemoveMagixEvent";
  IframeEvents2["RemoveAllMagixEvent"] = "RemoveAllMagixEvent";
  IframeEvents2["RoomStateChanged"] = "RoomStateChanged";
  IframeEvents2["DispatchMagixEvent"] = "DispatchMagixEvent";
  IframeEvents2["ReceiveMagixEvent"] = "ReciveMagixEvent";
  IframeEvents2["NextPage"] = "NextPage";
  IframeEvents2["PrevPage"] = "PrevPage";
  IframeEvents2["SDKCreate"] = "SDKCreate";
  IframeEvents2["OnCreate"] = "OnCreate";
  IframeEvents2["SetPage"] = "SetPage";
  IframeEvents2["GetAttributes"] = "GetAttributes";
  IframeEvents2["Ready"] = "Ready";
  IframeEvents2["Destroy"] = "Destory";
  IframeEvents2["StartCreate"] = "StartCreate";
  IframeEvents2["WrapperDidUpdate"] = "WrapperDidUpdate";
  IframeEvents2["DisplayIframe"] = "DisplayIframe";
  IframeEvents2["HideIframe"] = "HideIframe";
  IframeEvents2["PageTo"] = "PageTo";
  return IframeEvents2;
})(IframeEvents || {});
var DomEvents = /* @__PURE__ */ ((DomEvents2) => {
  DomEvents2["WrapperDidMount"] = "WrapperDidMount";
  DomEvents2["IframeLoad"] = "IframeLoad";
  return DomEvents2;
})(DomEvents || {});
function getUserPayload(context) {
  var _a;
  const room = context.getRoom();
  const displayer = context.getDisplayer();
  const memberId = displayer.observerId;
  const userPayload = (_a = displayer.state.roomMembers.find((member) => member.memberId === memberId)) == null ? void 0 : _a.payload;
  const uid = (userPayload == null ? void 0 : userPayload.uid) || (room == null ? void 0 : room.uid) || "";
  const nickName = (userPayload == null ? void 0 : userPayload.nickName) || uid;
  const userId = (userPayload == null ? void 0 : userPayload.userId) || uid;
  const cursorName = (userPayload == null ? void 0 : userPayload.cursorName) || nickName || "";
  return { memberId, uid, userId, nickName, cursorName };
}
const ClickThroughAppliances = /* @__PURE__ */ new Set(["clicker", "selector"]);
const IframeBridge = {
  kind: "IframeBridge",
  setup(context) {
    const box = context.getBox();
    const view = context.getView();
    const displayer = context.getDisplayer();
    const room = context.getRoom();
    const { uid } = getUserPayload(context);
    const attrs = ensureAttributes(context, {
      src: "about:blank",
      displaySceneDir: "/h5",
      lastEvent: null,
      state: {},
      page: 0,
      maxPage: 0
    });
    const sideEffectManager = new SideEffectManager();
    const container = document.createElement("div");
    Object.assign(container.style, { width: "100%", height: "100%", position: "relative" });
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "none",
      display: "block"
    });
    container.appendChild(iframe);
    const role = context.storage.state.uid === uid ? 0 : 2;
    if (role == 0) {
      const closeBtn = document.createElement("button");
      Object.assign(closeBtn.style, {
        position: "absolute",
        right: "10px",
        top: "10px",
        zIndex: 1e3,
        background: "white",
        border: "none",
        borderRadius: "100%",
        width: "30px",
        height: "30px",
        boxShadow: "0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a"
      });
      closeBtn.innerHTML = "X";
      container.appendChild(closeBtn);
      closeBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        box._delegateEvents.emit("close");
      };
    }
    box.mountContent(container);
    let toggleClickThrough = () => {
    };
    const shouldClickThrough = (tool) => {
      return ClickThroughAppliances.has(tool);
    };
    if (view) {
      const viewBox = document.createElement("div");
      Object.assign(viewBox.style, {
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden"
      });
      container.appendChild(viewBox);
      context.mountView(viewBox);
      view.disableCameraTransform = true;
      sideEffectManager.add(() => {
        const onResize = () => {
          const clientRect = container.getBoundingClientRect();
          const scale = clientRect.height / height;
          view.moveCamera({ scale, animationMode: "immediately" });
        };
        const observer = new ResizeObserver(onResize);
        observer.observe(container);
        return () => observer.disconnect();
      });
      toggleClickThrough = (enable) => {
        viewBox.style.pointerEvents = enable ? "none" : "auto";
      };
      toggleClickThrough(shouldClickThrough(room == null ? void 0 : room.state.memberState.currentApplianceName));
    }
    const withReadonlyAttributes = (state) => __spreadProps(__spreadValues({}, state), {
      url: attrs.src,
      displaySceneDir: attrs.displaySceneDir,
      width: iframe.scrollWidth,
      height: iframe.scrollHeight,
      useClicker: true,
      lastEvent: attrs.lastEvent
    });
    const emitter = new emittery();
    const magixEventMap = /* @__PURE__ */ new Map();
    const removeAllMagixEvent = () => {
      magixEventMap.forEach((listener, event) => {
        displayer.removeMagixEventListener(event, listener);
      });
      magixEventMap.clear();
    };
    const log = (...args) => false;
    const postMessage = (message) => {
      var _a;
      log("[IframeBridge] postMessage %s %O", message.kind, message.payload);
      (_a = iframe.contentWindow) == null ? void 0 : _a.postMessage(JSON.parse(JSON.stringify(message)), "*");
    };
    const dispatchMagixEvent = (event, payload) => {
      if (context.getIsWritable()) {
        context.updateAttributes(["lastEvent"], { name: event, payload });
        room == null ? void 0 : room.dispatchMagixEvent(event, payload);
      }
    };
    const sendInitMessage = () => {
      postMessage({
        kind: IframeEvents.Init,
        payload: {
          attributes: withReadonlyAttributes(attrs.state),
          roomState: displayer.state,
          currentPage: attrs.page,
          observerId: displayer.observerId
        }
      });
    };
    let hackCocos = attrs.src.includes("cocos");
    const onLoad = (ev) => {
      sendInitMessage();
      emitter.emit(DomEvents.IframeLoad, ev);
      emitter.on(IframeEvents.Ready, () => {
        var _a, _b;
        if ((_a = attrs.lastEvent) == null ? void 0 : _a.payload) {
          postMessage((_b = attrs.lastEvent) == null ? void 0 : _b.payload);
        }
      });
      if (hackCocos) {
        setTimeout(() => {
          postMessage({
            kind: IframeEvents.RoomStateChanged,
            payload: fakeRoomStateChanged(1, attrs.maxPage, attrs.displaySceneDir)
          });
        }, 500);
        hackCocos = false;
      }
      iframe.removeEventListener("load", onLoad);
    };
    sideEffectManager.addEventListener(iframe, "load", onLoad);
    let retryCount = 0;
    const onError = () => {
      if (retryCount++ < 3) {
        iframe.src = attrs.src;
      }
    };
    sideEffectManager.addEventListener(iframe, "error", onError);
    iframe.src = attrs.src;
    sideEffectManager.add(() => context.mobxUtils.autorun(() => {
      postMessage({
        kind: IframeEvents.AttributesUpdate,
        payload: withReadonlyAttributes(attrs.state)
      });
    }));
    sideEffectManager.add(() => context.mobxUtils.autorun(() => {
      iframe.src = attrs.src;
    }));
    sideEffectManager.add(() => context.mobxUtils.autorun(() => {
      postMessage({
        kind: IframeEvents.RoomStateChanged,
        payload: fakeRoomStateChanged(attrs.page, attrs.maxPage, attrs.displaySceneDir)
      });
    }));
    const bridge = {
      emitter,
      postMessage,
      context
    };
    emitter.emit(IframeEvents.StartCreate);
    emitter.emit(IframeEvents.OnCreate, bridge);
    if (room) {
      sideEffectManager.add(() => {
        const onRoomStateChanged = (e) => {
          if (e.memberState) {
            toggleClickThrough(shouldClickThrough(e.memberState.currentApplianceName));
          }
        };
        room.callbacks.on("onRoomStateChanged", onRoomStateChanged);
        return () => room.callbacks.off("onRoomStateChanged", onRoomStateChanged);
      });
    }
    sideEffectManager.addEventListener(window, "message", (ev) => {
      if (ev.source !== iframe.contentWindow) {
        return;
      }
      const data = ev.data;
      log("[IframeBridge] received", data.kind, data.payload);
      switch (data.kind) {
        case IframeEvents.SetAttributes: {
          context.updateAttributes(["state"], __spreadValues(__spreadValues({}, attrs.state), data.payload));
          break;
        }
        case IframeEvents.RegisterMagixEvent: {
          const listener = (ev2) => {
            if (ev2.authorId === displayer.observerId) {
              return;
            }
            postMessage({ kind: IframeEvents.ReceiveMagixEvent, payload: ev2 });
          };
          const eventName = data.payload;
          magixEventMap.set(eventName, listener);
          displayer.addMagixEventListener(eventName, listener);
          break;
        }
        case IframeEvents.RemoveMagixEvent: {
          const eventName = data.payload;
          const listener = magixEventMap.get(eventName);
          displayer.removeMagixEventListener(eventName, listener);
          break;
        }
        case IframeEvents.DispatchMagixEvent: {
          const ev2 = data.payload;
          dispatchMagixEvent(ev2.event, ev2.payload);
          break;
        }
        case IframeEvents.RemoveAllMagixEvent: {
          removeAllMagixEvent();
          break;
        }
        case IframeEvents.NextPage: {
          if (context.getIsWritable() && room) {
            const page = nextPage(attrs.page, attrs.maxPage);
            if (page === attrs.page)
              break;
            context.setScenePath([attrs.displaySceneDir, page].join("/"));
            context.updateAttributes(["page"], page);
            dispatchMagixEvent(IframeEvents.NextPage, {});
          }
          break;
        }
        case IframeEvents.PrevPage: {
          if (context.getIsWritable() && room) {
            const page = prevPage(attrs.page);
            if (page === attrs.page)
              break;
            context.setScenePath([attrs.displaySceneDir, page].join("/"));
            context.updateAttributes(["page"], page);
            dispatchMagixEvent(IframeEvents.PrevPage, {});
          }
          break;
        }
        case IframeEvents.SetPage: {
          const maxPage = Number(data.payload) || 0;
          if (context.getIsWritable() && room) {
            if (!maxPage) {
              room.removeScenes(attrs.displaySceneDir);
            } else {
              const scenes = room.entireScenes()[attrs.displaySceneDir];
              if (!scenes || scenes.length !== maxPage) {
                room.removeScenes(attrs.displaySceneDir);
                room.putScenes(attrs.displaySceneDir, pageToScenes(maxPage));
              }
              context.setScenePath(`${attrs.displaySceneDir}/1`);
              context.updateAttributes(["maxPage"], maxPage);
            }
          }
          break;
        }
        case IframeEvents.PageTo: {
          const page = data.payload;
          if (context.getIsWritable() && room) {
            if (!Number.isSafeInteger(page) || page <= 0)
              break;
            context.setScenePath(`${attrs.displaySceneDir}/${page}`);
            context.updateAttributes(["page"], page);
            dispatchMagixEvent(IframeEvents.PageTo, page - 1);
          }
          break;
        }
        case IframeEvents.SDKCreate: {
          sendInitMessage();
          break;
        }
        case IframeEvents.GetAttributes: {
          postMessage({
            kind: IframeEvents.GetAttributes,
            payload: withReadonlyAttributes(attrs.state)
          });
          break;
        }
        default: {
          console.warn(`[IframeBridge]: unknown event kind "${data.kind}"`);
        }
      }
    });
    context.emitter.on("destroy", () => {
      console.log("[IframeBridge]: destroy");
      emitter.emit(IframeEvents.Destroy);
      sideEffectManager.flushAll();
      removeAllMagixEvent();
      iframe.remove();
    });
    return bridge;
  }
};
export { IframeBridge as default };
//# sourceMappingURL=main.es.js.map
