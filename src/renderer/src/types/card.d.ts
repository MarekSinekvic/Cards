
export interface Card {
    id: number;
    content: string;
    posx: number; posy: number;
    color: string;
    
    DOM: HTMLElement|undefined;
    isSelected: boolean;
    parents: Card[];
    childs: Card[];
}
export interface Relation {
    id: number;
    first: number;
    second: number;
}