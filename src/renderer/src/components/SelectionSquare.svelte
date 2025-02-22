<script lang="ts">

    import type { Card } from "../types/card"

    export let ctx: CanvasRenderingContext2D;
    export let cards: Card[];
    export let rerender: boolean;

    export let addMouseMove: (func: (e: MouseEvent) => void) => void = ()=>{};
    export let addMouseDown: (func: (e:MouseEvent) => void) => void = ()=>{};
    export let addMouseUp: (func: (e:MouseEvent) => void) => void = ()=>{};

    let isSelecting: boolean = false;
    let startPoint: number[] = null;
    let endPoint: number[] = null;

    function isCardInSquare(card: Card, min: number[], max: number[]): boolean {
        const cardRect = card.DOM.getBoundingClientRect();
        if (min[0] < cardRect.left && max[0] > cardRect.right &&
            min[1] < cardRect.top && max[1] > cardRect.bottom) {

            return true;
        }
        return false;
    }
    addMouseDown((e)=>{
        if (e.target instanceof HTMLCanvasElement && e.ctrlKey) {
            isSelecting = true;
            startPoint = [e.offsetX,e.offsetY];
        }
    });
    addMouseMove((e)=>{endPoint = [e.offsetX,e.offsetY];});
    addMouseUp((e)=>{
        if (!startPoint || !endPoint || !isSelecting) return;
        cards.forEach((card)=>{
            let min = [...startPoint], max = [...endPoint];
            if (startPoint[0] > endPoint[0]) {
                min[0] = endPoint[0]; max[0] = startPoint[0];
            }
            if (startPoint[1] > endPoint[1]) {
                min[1] = endPoint[1]; max[1] = startPoint[1];
            }
            
            card.isSelected = isCardInSquare(card, min, max);            
            rerender = !rerender;
        });
        isSelecting = false;
    });

    export function RenderSelection() {
        if (!startPoint || !endPoint || !isSelecting) return;
        ctx.fillStyle = 'white';
        ctx.strokeRect(startPoint[0],startPoint[1], endPoint[0]-startPoint[0],endPoint[1]-startPoint[1]);
    }
</script>

