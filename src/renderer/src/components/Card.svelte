<style>
    .card {
        border: 1px solid #333333; 
        background-color: rgba(255,255,255,0.1);
        backdrop-filter: blur(5px);
        max-width: 250px;
        min-width: 50px;
        position: absolute;
        line-height: 18px;
    }
    .card .header {
        /* height: 12px; */
        line-height: 13px;
        padding: 0px 4px;
        font-size: 10px;
        color: rgb(64, 64, 64);
        background-color: rgb(201, 201, 201);
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .card .body {
        padding: 4px;
        word-wrap: break-word;
        white-space: pre-wrap;
        font-family: 'Times New Roman', Times, serif;
    }
    .color-circle {
        width: 8px; 
        height: 8px; 
        border-radius: 50%; border: 1px solid black
    }
    .color-list {
        position: absolute;
        top: 16px;
        z-index: 2;
        background-color: rgb(201, 201, 201);
        padding: 2px;
        max-width: 44px;
        flex-wrap: wrap;
    }
</style>
<script lang="ts">
    import type { Card } from "../types/card"

    export let card: Card;
    export let cards: Card[] = [];
    export let addMouseMove: (func: (e: MouseEvent) => void) => void = ()=>{};
    export let addMouseDown: (func: (e:MouseEvent) => void) => void = ()=>{};
    export let addMouseUp: (func: (e:MouseEvent) => void) => void = ()=>{};
    export let createNewCard: (content:string,x:number,y:number,color:string) => Promise;
    export let createNewRelation: (first:number,second:number) => Promise;

    export let deleteCard: (id:number) => Promise<void> = ()=>{};
    export let onChange: () => void = () => {};

    export let otherDragging:boolean = false;
    export let isDragging:boolean = false;
    let isHidden: boolean = false;
    let colorPicking:boolean = false;
    export let rerenderer = false;
    
    addMouseMove((e: MouseEvent)=>{                
        if (isDragging || (card.isSelected && otherDragging)) {
            card.posx += e.movementX;
            card.posy += e.movementY;
            onChange();
        }
    });
    addMouseUp((e: MouseEvent)=>{
        isDragging = false;
        otherDragging = false;
        window.api.updateCard(['posx','posy'], [card.posx, card.posy], 'id='+card.id);
    });
    addMouseDown((e: MouseEvent) => {
        if (e.target instanceof HTMLCanvasElement || e.target instanceof HTMLBodyElement){
            card.isSelected = false;
            colorPicking = false;
        }
    }); //.replace(/(cd?:\/\/[^\s]+)/g, (url)=>{})
</script>

<div class="card" style="left: {card.posx}px; top: {card.posy}px; background-color: {card.isSelected ? '#ffffff33' : card.color}" bind:this={card.DOM}>
    <div class="header" role="button" tabindex="0"
        on:dblclick={()=>{
            let targets = [card];
            while (targets.length > 0) {
                let newTargets = [];
                for (let i = 0; i < targets.length; i++) {
                    newTargets = [...newTargets,...targets[i].childs];
                    targets[i].isSelected = true;
                }
                targets = newTargets;
            }
            rerenderer = !rerenderer;
        }}
        on:mousedown={(e)=>{
            if (e.buttons === 1) {
                isDragging=true;
                otherDragging=true;
                if (e.ctrlKey) {
                    card.isSelected = true;
                    console.log(card.color);
                }
            }
            
            if (e.buttons === 2) {
                createNewCard("",card.posx,card.posy,card.color).then((newCard)=>{
                    createNewRelation(card.id,newCard.id).then(()=>{onChange()});
                });
            }
        }}
    >
        <div style="display: flex; gap: 4px">
            <div style="display: flex; flex-direction: column; justify-content:center">
                <div class="color-circle" style="background-color: {card.color}" on:mousedown={()=>{colorPicking=!colorPicking}} role="button" tabindex="0"></div>
                {#if colorPicking}
                    <div class="color-list" style="display: flex; gap: 4px">
                        <div class="color-circle" role="button" tabindex="-1" style="background-color: #ffffff11" on:mousedown={()=>{card.color="#ffffff11"; window.api.updateCard(['color'], [`'${card.color}'`], 'id='+card.id);}}></div>
                        <div class="color-circle" role="button" tabindex="-1" style="background-color: rgb(128, 24, 20)" on:mousedown={()=>{card.color="rgb(128, 24, 20)"; window.api.updateCard(['color'], [`'${card.color}'`], 'id='+card.id);}}></div>
                        <div class="color-circle" role="button" tabindex="-1" style="background-color: rgb(20, 128, 38)" on:mousedown={()=>{card.color="rgb(20, 128, 38)"; window.api.updateCard(['color'], [`'${card.color}'`], 'id='+card.id);}}></div>
                        <div class="color-circle" role="button" tabindex="-1" style="background-color: rgb(20, 25, 128)" on:mousedown={()=>{card.color="rgb(20, 25, 128)"; window.api.updateCard(['color'], [`'${card.color}'`], 'id='+card.id);}}></div>
                    </div>
                {/if}
            </div>
        </div>
        <div>
            <div on:mousedown={(e)=>{if (e.buttons == 1) {deleteCard(card.id).then(()=>{onChange()});}}} role="button" tabindex="-3">X</div>
        </div>
    </div>
    <div class="body">
        <div bind:innerText={card.content} on:keydown={()=>{
            window.api.updateCard(['content'], [`'${card.content}'`], 'id='+card.id);
        }} role="textbox" tabindex="-2" contenteditable>
            {card.content}
        </div>
    </div>
    <!-- <div>Resize</div> -->
</div>