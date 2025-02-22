<script lang="ts">
    import { onMount } from "svelte"
    import type { Card, Relation } from "../types/card"
    
    export let cards: Card[] = [];
    export let cardsRel: Relation[] = [];

    let canv: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    const windowRatio = window.innerWidth/window.innerHeight;

    function DrawCards() {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < cards.length; i++) {
            if (!cards[i] || !cards[i].DOM) continue;
            ctx.fillStyle = cards[i].color;
            const aabb = cards[i].DOM.getBoundingClientRect();
            const posUV = [aabb.left/window.innerWidth,aabb.top/window.innerHeight];
            const sizeUV = [aabb.width/window.innerWidth,aabb.height/window.innerHeight];
            ctx.fillRect(posUV[0]*canv.width,posUV[1]*canv.height, sizeUV[0]*canv.width,sizeUV[1]*canv.height);
            ctx.strokeRect(posUV[0]*canv.width,posUV[1]*canv.height, sizeUV[0]*canv.width,sizeUV[1]*canv.height);
        }
    }
    function DrawLines() {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        for (let i = 0; i < cardsRel.length; i++) {
            const first = cards.find((v)=>{return v.id==cardsRel[i].first});
            const second = cards.find((v)=>{return v.id==cardsRel[i].second});

            if (!first || !second || !first.DOM || !second.DOM) continue;

            const firstRect = first.DOM.getBoundingClientRect();
            const secondRect = second.DOM.getBoundingClientRect();

            const firstUV = [(firstRect.left+firstRect.width/2)/window.innerWidth,(firstRect.top+firstRect.height/2)/window.innerHeight];
            const secondUV = [(secondRect.left+secondRect.width/2)/window.innerWidth,(secondRect.top+secondRect.height/2)/window.innerHeight];

            ctx.moveTo(firstUV[0]*canv.width,firstUV[1]*canv.height);
            ctx.lineTo(secondUV[0]*canv.width,secondUV[1]*canv.height);
        }
        ctx.stroke();
    }
    export function RenderMiniature() {
        ctx.clearRect(0, 0, canv.width, canv.height);

        DrawCards();
        DrawLines();
    }
    onMount(()=>{
        ctx = canv.getContext('2d');
        RenderMiniature();
    });
</script>

<canvas id="miniature" bind:this={canv} width={200*windowRatio} height={200*(1-windowRatio)} style="border: 1px solid rgba(255, 255, 255, 0.427)"></canvas>