/**

the page api for iframe bridge

iframe -> me:
  SetPage(3) // pages = [1,2,3]
  PageTo(1)  // page = 1
  PrevPage() // page = Math.max(1, page - 1)
  NextPage() // page = Math.min(pages.length, page + 1)

me -> iframe:
  RoomStateChanged(pageEvent(page))

*/
import type { RoomState } from "white-web-sdk";
export declare function fakeRoomStateChanged(page: number, maxPage: number, contextPath: string): Partial<RoomState>;
export declare function pageToScenes(maxPage: number): {
    name: string;
}[];
export declare function prevPage(page: number): number;
export declare function nextPage(page: number, maxPage: number): number;
