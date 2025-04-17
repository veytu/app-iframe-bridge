var ve=Object.defineProperty,Pe=Object.defineProperties;var ke=Object.getOwnPropertyDescriptors;var ie=Object.getOwnPropertySymbols;var De=Object.prototype.hasOwnProperty,Re=Object.prototype.propertyIsEnumerable;var ne=(p,g,h)=>g in p?ve(p,g,{enumerable:!0,configurable:!0,writable:!0,value:h}):p[g]=h,T=(p,g)=>{for(var h in g||(g={}))De.call(g,h)&&ne(p,h,g[h]);if(ie)for(var h of ie(g))Re.call(g,h)&&ne(p,h,g[h]);return p},oe=(p,g)=>Pe(p,ke(g));var NetlessAppIframeBridge=function(p,g){var X;"use strict";const h="!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",z=[],ae=()=>{for(let t=0;t<20;t++)z[t]=h.charAt(Math.random()*87);return z.join("")};function G(t){try{return t()}catch(e){console.error(e)}}class de{constructor(){this.push=this.addDisposer,this.disposers=new Map}addDisposer(e,r=this.genUID()){return this.flush(r),this.disposers.set(r,Array.isArray(e)?ce(e):e),r}add(e,r=this.genUID()){const s=e();return s?this.addDisposer(s,r):r}addEventListener(e,r,s,i,l=this.genUID()){return e.addEventListener(r,s,i),this.addDisposer(()=>e.removeEventListener(r,s,i),l),l}setTimeout(e,r,s=this.genUID()){const i=window.setTimeout(()=>{this.remove(s),e()},r);return this.addDisposer(()=>window.clearTimeout(i),s)}setInterval(e,r,s=this.genUID()){const i=window.setInterval(e,r);return this.addDisposer(()=>window.clearInterval(i),s)}remove(e){const r=this.disposers.get(e);return this.disposers.delete(e),r}flush(e){const r=this.remove(e);r&&r()}flushAll(){this.disposers.forEach(G),this.disposers.clear()}genUID(){let e;do e=ae();while(this.disposers.has(e));return e}}function ce(t){return()=>t.forEach(G)}function ue(t){return t!=null&&typeof t=="object"&&!Array.isArray(t)}function le(t,e){let r=t.getAttributes();if(r||(t.setAttributes(e),r=t.getAttributes()),!r)throw new Error("[NetlessAppMonaco] No attributes");return ue(e)&&Object.keys(e).forEach(s=>{Object.prototype.hasOwnProperty.call(r,s)||t.updateAttributes([s],e[s])}),r}const y=new WeakMap,D=new WeakMap,v=new WeakMap,j=Symbol("anyProducer"),q=Promise.resolve(),R=Symbol("listenerAdded"),C=Symbol("listenerRemoved");let U=!1;function A(t){if(typeof t!="string"&&typeof t!="symbol")throw new TypeError("eventName must be a string or a symbol")}function I(t){if(typeof t!="function")throw new TypeError("listener must be a function")}function E(t,e){const r=D.get(t);return r.has(e)||r.set(e,new Set),r.get(e)}function P(t,e){const r=typeof e=="string"||typeof e=="symbol"?e:j,s=v.get(t);return s.has(r)||s.set(r,new Set),s.get(r)}function fe(t,e,r){const s=v.get(t);if(s.has(e))for(const i of s.get(e))i.enqueue(r);if(s.has(j)){const i=Promise.all([e,r]);for(const l of s.get(j))l.enqueue(i)}}function H(t,e){e=Array.isArray(e)?e:[e];let r=!1,s=()=>{},i=[];const l={enqueue(n){i.push(n),s()},finish(){r=!0,s()}};for(const n of e)P(t,n).add(l);return{async next(){return i?i.length===0?r?(i=void 0,this.next()):(await new Promise(n=>{s=n}),this.next()):{done:!1,value:await i.shift()}:{done:!0}},async return(n){i=void 0;for(const c of e)P(t,c).delete(l);return s(),arguments.length>0?{done:!0,value:await n}:{done:!0}},[Symbol.asyncIterator](){return this}}}function _(t){if(t===void 0)return J;if(!Array.isArray(t))throw new TypeError("`methodNames` must be an array of strings");for(const e of t)if(!J.includes(e))throw typeof e!="string"?new TypeError("`methodNames` element must be a string"):new Error(`${e} is not Emittery method`);return t}const $=t=>t===R||t===C;class S{static mixin(e,r){return r=_(r),s=>{if(typeof s!="function")throw new TypeError("`target` must be function");for(const n of r)if(s.prototype[n]!==void 0)throw new Error(`The property \`${n}\` already exists on \`target\``);function i(){return Object.defineProperty(this,e,{enumerable:!1,value:new S}),this[e]}Object.defineProperty(s.prototype,e,{enumerable:!1,get:i});const l=n=>function(...c){return this[e][n](...c)};for(const n of r)Object.defineProperty(s.prototype,n,{enumerable:!1,value:l(n)});return s}}static get isDebugEnabled(){if(typeof process!="object")return U;const{env:e}=process||{env:{}};return e.DEBUG==="emittery"||e.DEBUG==="*"||U}static set isDebugEnabled(e){U=e}constructor(e={}){y.set(this,new Set),D.set(this,new Map),v.set(this,new Map),this.debug=e.debug||{},this.debug.enabled===void 0&&(this.debug.enabled=!1),this.debug.logger||(this.debug.logger=(r,s,i,l)=>{l=JSON.stringify(l),typeof i=="symbol"&&(i=i.toString());const n=new Date,c=`${n.getHours()}:${n.getMinutes()}:${n.getSeconds()}.${n.getMilliseconds()}`;console.log(`[${c}][emittery:${r}][${s}] Event Name: ${i}
	data: ${l}`)})}logIfDebugEnabled(e,r,s){(S.isDebugEnabled||this.debug.enabled)&&this.debug.logger(e,this.debug.name,r,s)}on(e,r){I(r),e=Array.isArray(e)?e:[e];for(const s of e)A(s),E(this,s).add(r),this.logIfDebugEnabled("subscribe",s,void 0),$(s)||this.emit(R,{eventName:s,listener:r});return this.off.bind(this,e,r)}off(e,r){I(r),e=Array.isArray(e)?e:[e];for(const s of e)A(s),E(this,s).delete(r),this.logIfDebugEnabled("unsubscribe",s,void 0),$(s)||this.emit(C,{eventName:s,listener:r})}once(e){return new Promise(r=>{const s=this.on(e,i=>{s(),r(i)})})}events(e){e=Array.isArray(e)?e:[e];for(const r of e)A(r);return H(this,e)}async emit(e,r){A(e),this.logIfDebugEnabled("emit",e,r),fe(this,e,r);const s=E(this,e),i=y.get(this),l=[...s],n=$(e)?[]:[...i];await q,await Promise.all([...l.map(async c=>{if(s.has(c))return c(r)}),...n.map(async c=>{if(i.has(c))return c(e,r)})])}async emitSerial(e,r){A(e),this.logIfDebugEnabled("emitSerial",e,r);const s=E(this,e),i=y.get(this),l=[...s],n=[...i];await q;for(const c of l)s.has(c)&&await c(r);for(const c of n)i.has(c)&&await c(e,r)}onAny(e){return I(e),this.logIfDebugEnabled("subscribeAny",void 0,void 0),y.get(this).add(e),this.emit(R,{listener:e}),this.offAny.bind(this,e)}anyEvent(){return H(this)}offAny(e){I(e),this.logIfDebugEnabled("unsubscribeAny",void 0,void 0),this.emit(C,{listener:e}),y.get(this).delete(e)}clearListeners(e){e=Array.isArray(e)?e:[e];for(const r of e)if(this.logIfDebugEnabled("clear",r,void 0),typeof r=="string"||typeof r=="symbol"){E(this,r).clear();const s=P(this,r);for(const i of s)i.finish();s.clear()}else{y.get(this).clear();for(const s of D.get(this).values())s.clear();for(const s of v.get(this).values()){for(const i of s)i.finish();s.clear()}}}listenerCount(e){e=Array.isArray(e)?e:[e];let r=0;for(const s of e){if(typeof s=="string"){r+=y.get(this).size+E(this,s).size+P(this,s).size+P(this).size;continue}typeof s!="undefined"&&A(s),r+=y.get(this).size;for(const i of D.get(this).values())r+=i.size;for(const i of v.get(this).values())r+=i.size}return r}bindMethods(e,r){if(typeof e!="object"||e===null)throw new TypeError("`target` must be an object");r=_(r);for(const s of r){if(e[s]!==void 0)throw new Error(`The property \`${s}\` already exists on \`target\``);Object.defineProperty(e,s,{enumerable:!1,value:this[s].bind(this)})}}}const J=Object.getOwnPropertyNames(S.prototype).filter(t=>t!=="constructor");Object.defineProperty(S,"listenerAdded",{value:R,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(S,"listenerRemoved",{value:C,writable:!1,enumerable:!0,configurable:!1});var ge=S;function K(t,e,r){return{sceneState:{sceneName:`${t}`,scenePath:`${r}/${t}`,contextPath:r,scenes:V(e),index:t-1}}}function V(t){const e=[];for(let r=1;r<=t;++r)e.push({name:String(r)});return e}function pe(t){return Math.max(1,t-1)}function he(t,e){return Math.min(e,t+1)}const be=350;var u=(t=>(t.Init="Init",t.AttributesUpdate="AttributesUpdate",t.SetAttributes="SetAttributes",t.RegisterMagixEvent="RegisterMagixEvent",t.RemoveMagixEvent="RemoveMagixEvent",t.RemoveAllMagixEvent="RemoveAllMagixEvent",t.RoomStateChanged="RoomStateChanged",t.DispatchMagixEvent="DispatchMagixEvent",t.ReceiveMagixEvent="ReciveMagixEvent",t.NextPage="NextPage",t.PrevPage="PrevPage",t.SDKCreate="SDKCreate",t.OnCreate="OnCreate",t.SetPage="SetPage",t.GetAttributes="GetAttributes",t.Ready="Ready",t.Destroy="Destory",t.StartCreate="StartCreate",t.WrapperDidUpdate="WrapperDidUpdate",t.DisplayIframe="DisplayIframe",t.HideIframe="HideIframe",t.PageTo="PageTo",t))(u||{}),F=(t=>(t.WrapperDidMount="WrapperDidMount",t.IframeLoad="IframeLoad",t))(F||{});function ye(t){var f;const e=t.getRoom(),r=t.getDisplayer(),s=r.observerId,i=(f=r.state.roomMembers.find(Q=>Q.memberId===s))==null?void 0:f.payload,l=(i==null?void 0:i.uid)||(e==null?void 0:e.uid)||"",n=(i==null?void 0:i.nickName)||l,c=(i==null?void 0:i.userId)||l,b=(i==null?void 0:i.cursorName)||n||"";return{memberId:s,uid:l,userId:c,nickName:n,cursorName:b}}const k=(X=window.navigator)==null?void 0:X.userAgent;k==null||k.match(/(Edge?)\/(\d+)/);const me=()=>typeof navigator!="undefined"&&typeof window!="undefined"&&/iPad|iPhone|iPod/.test(k),we=()=>typeof navigator!="undefined"&&/Android/.test(k),Se=new Set(["clicker","selector"]),Ae={kind:"IframeBridge",setup(t){const e=t.getBox(),r=t.getView(),s=t.getDisplayer(),i=t.getRoom(),{uid:l}=ye(t),n=le(t,{src:"about:blank",displaySceneDir:"/h5",lastEvent:null,state:{},page:0,maxPage:0}),c=new de,b=document.createElement("div");Object.assign(b.style,{width:"100%",height:"100%",position:"relative"});const f=document.createElement("iframe");if(Object.assign(f.style,{width:"100%",height:"100%",border:"none",display:"block"}),b.appendChild(f),(t.storage.state.uid===l?0:2)==0){const a=document.createElement("button");Object.assign(a.style,{position:"absolute",right:"10px",top:"10px",zIndex:1e3,background:"white",border:"none",borderRadius:"100%",width:"30px",height:"30px",boxShadow:"0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a"}),a.innerHTML="X",b.appendChild(a),a.onclick=function(d){d.preventDefault(),d.stopPropagation(),e._delegateEvents.emit("close")}}e.mountContent(b);let W=()=>{};const Y=a=>me()||we()||g.WindowManager.appReadonly?!1:Se.has(a);if(r){const a=document.createElement("div");Object.assign(a.style,{width:"100%",height:"100%",position:"absolute",top:0,left:0,overflow:"hidden"}),b.appendChild(a),t.mountView(a),r.disableCameraTransform=!0,c.add(()=>{const d=()=>{const x=b.getBoundingClientRect().height/be;r.moveCamera({scale:x,animationMode:"immediately"})},o=new ResizeObserver(d);return o.observe(b),()=>o.disconnect()}),W=d=>{a.style.pointerEvents=d?"none":"auto"},W(Y(i==null?void 0:i.state.memberState.currentApplianceName))}const B=a=>oe(T({},a),{url:n.src,displaySceneDir:n.displaySceneDir,width:f.scrollWidth,height:f.scrollHeight,useClicker:!0,lastEvent:n.lastEvent}),M=new ge,O=new Map,Z=()=>{O.forEach((a,d)=>{s.removeMagixEventListener(d,a)}),O.clear()},N=(...a)=>!1,m=a=>{var d;N("[IframeBridge] postMessage %s %O",a.kind,a.payload),(d=f.contentWindow)==null||d.postMessage(JSON.parse(JSON.stringify(a)),"*")},L=(a,d)=>{t.getIsWritable()&&(t.updateAttributes(["lastEvent"],{name:a,payload:d}),i==null||i.dispatchMagixEvent(a,d))},ee=()=>{m({kind:u.Init,payload:{attributes:B(n.state),roomState:s.state,currentPage:n.page,observerId:s.observerId}})};let te=n.src.includes("cocos");const re=a=>{ee(),M.emit(F.IframeLoad,a),M.on(u.Ready,()=>{var d,o;(d=n.lastEvent)!=null&&d.payload&&m((o=n.lastEvent)==null?void 0:o.payload)}),te&&(setTimeout(()=>{m({kind:u.RoomStateChanged,payload:K(1,n.maxPage,n.displaySceneDir)})},500),te=!1),f.removeEventListener("load",re)};c.addEventListener(f,"load",re);let Ee=0;const Me=()=>{Ee++<3&&(f.src=n.src)};c.addEventListener(f,"error",Me),f.src=n.src,c.add(()=>t.mobxUtils.autorun(()=>{m({kind:u.AttributesUpdate,payload:B(n.state)})})),c.add(()=>t.mobxUtils.autorun(()=>{f.src=n.src})),c.add(()=>t.mobxUtils.autorun(()=>{m({kind:u.RoomStateChanged,payload:K(n.page,n.maxPage,n.displaySceneDir)})}));const se={emitter:M,postMessage:m,context:t};return M.emit(u.StartCreate),M.emit(u.OnCreate,se),i&&c.add(()=>{const a=d=>{d.memberState&&W(Y(d.memberState.currentApplianceName))};return i.callbacks.on("onRoomStateChanged",a),()=>i.callbacks.off("onRoomStateChanged",a)}),c.addEventListener(window,"message",a=>{if(a.source!==f.contentWindow)return;const d=a.data;switch(N("[IframeBridge] received",d.kind,d.payload),d.kind){case u.SetAttributes:{t.updateAttributes(["state"],T(T({},n.state),d.payload));break}case u.RegisterMagixEvent:{const o=x=>{x.authorId!==s.observerId&&m({kind:u.ReceiveMagixEvent,payload:x})},w=d.payload;O.set(w,o),s.addMagixEventListener(w,o);break}case u.RemoveMagixEvent:{const o=d.payload,w=O.get(o);s.removeMagixEventListener(o,w);break}case u.DispatchMagixEvent:{const o=d.payload;L(o.event,o.payload);break}case u.RemoveAllMagixEvent:{Z();break}case u.NextPage:{if(t.getIsWritable()&&i){const o=he(n.page,n.maxPage);if(o===n.page)break;t.setScenePath([n.displaySceneDir,o].join("/")),t.updateAttributes(["page"],o),L(u.NextPage,{})}break}case u.PrevPage:{if(t.getIsWritable()&&i){const o=pe(n.page);if(o===n.page)break;t.setScenePath([n.displaySceneDir,o].join("/")),t.updateAttributes(["page"],o),L(u.PrevPage,{})}break}case u.SetPage:{const o=Number(d.payload)||0;if(t.getIsWritable()&&i)if(!o)i.removeScenes(n.displaySceneDir);else{const w=i.entireScenes()[n.displaySceneDir];(!w||w.length!==o)&&(i.removeScenes(n.displaySceneDir),i.putScenes(n.displaySceneDir,V(o))),t.setScenePath(`${n.displaySceneDir}/1`),t.updateAttributes(["maxPage"],o)}break}case u.PageTo:{const o=d.payload;if(t.getIsWritable()&&i){if(!Number.isSafeInteger(o)||o<=0)break;t.setScenePath(`${n.displaySceneDir}/${o}`),t.updateAttributes(["page"],o),L(u.PageTo,o-1)}break}case u.SDKCreate:{ee();break}case u.GetAttributes:{m({kind:u.GetAttributes,payload:B(n.state)});break}default:console.warn(`[IframeBridge]: unknown event kind "${d.kind}"`)}}),t.emitter.on("destroy",()=>{console.log("[IframeBridge]: destroy"),M.emit(u.Destroy),c.flushAll(),Z(),f.remove()}),se}};return p.default=Ae,Object.defineProperties(p,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}}),p}({},windowManager);
//# sourceMappingURL=main.iife.js.map
