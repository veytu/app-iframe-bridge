import type { NetlessApp } from "@netless/window-manager";
export interface Attributes {
    src: string;
    displaySceneDir: string;
    lastEvent: {
        name: string;
        payload: unknown;
    } | null;
    state: Record<string, unknown>;
    page: number;
    maxPage: number;
    uid?: string | null;
}
declare const IframeBridge: NetlessApp<Attributes>;
export default IframeBridge;
