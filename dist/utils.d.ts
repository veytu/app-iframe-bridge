import type { AppContext } from "@netless/window-manager";
export interface UserPayload {
    memberId: number;
    uid: string;
    userId: string;
    nickName: string;
    cursorName: string;
}
export declare function getUserPayload(context: AppContext): UserPayload;
export declare function parse(url: string): {
    search: string;
    pathname: string;
};
export declare function appendQuery(url: string, query: string): string;
export declare function element<T extends keyof HTMLElementTagNameMap>(tag: T): HTMLElementTagNameMap[T];
export declare function attr(el: HTMLElement, key: string, value: string | null): void;
export declare function append(el: HTMLElement, node: HTMLElement): HTMLElement;
export declare function detach(el: HTMLElement): HTMLElement | undefined;
export declare function noop(): void;
export declare const nextTick: Promise<void>;
export declare function writable<T>(value: T): {
    readonly value: T;
    set(newValue: T): void;
    subscribe(listener: (value: T) => void): () => void;
};
