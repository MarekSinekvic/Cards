<style>
  #background {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
  }
  #ui {
    position: absolute;
    right: 5px;
    top: 5px;

    display: flex;
    flex-direction: column;
  }
  .file-history {
    display: flex; 
    flex-direction: column;
    align-items: center; 
    max-height: 200px; 
    max-width: 100%;
    overflow-y: auto;
  }
  .file-history-row {
    display:flex; 
    flex-direction: row; 
    justify-content: space-between;
    width: 100%;
    padding: 3px;
  }
  .file-history-row:hover {
    background-color: #ffffff11;
  }
  ::-webkit-scrollbar {
    width: 3px;
  }
  ::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
  }
</style>
<script lang="ts">
  import { onMount } from "svelte"
  import Card from "./components/Card.svelte"
  import { DrawRelations } from "./components/Lines"
  import Miniature from "./components/Miniature.svelte"
  // import SelectionSquare from "./components/SelectionSquare.svelte"
  import type { Card as CardType, Relation } from "./types/card"
  import Hider from "./components/Hider.svelte"

  function GenerateCard(BackCard: any): Card {
    return {...BackCard, isSelected: false, DOM: undefined, parents: [], childs: []};
  };

  let cards: CardType[] = ([]), cardsRel: Relation[] = ([]);
  // let selection: number[] = [];

  let sharedDragging:boolean = false;

  let canv: HTMLCanvasElement = null;
  let ctx: CanvasRenderingContext2D = null;
  let rerender = false;

  let historyFiles = [];
  // let SelectionRenderer: ()=>void = null;
  
  async function Init() {
    cardsRel = await window.api.getCardsRel();
    window.api.getCards().then((v: CardType[])=>{
      cards = v.map((vv)=>{return GenerateCard(vv, cardsRel)});
      for (let i = 0; i < cardsRel.length; i++) {
        cards.find((v)=>{return v.id==cardsRel[i].first}).childs.push(cards.find((v)=>{return v.id==cardsRel[i].second}));
        cards.find((v)=>{return v.id==cardsRel[i].second}).parents.push(cards.find((v)=>{return v.id==cardsRel[i].first}));
      }
      rerender=!rerender;
    });
    window.api.getFilesHistory().then((v: object[])=>{if (v) historyFiles=v;});
  }
  Init();

  let mouseMoveListeners = [];
  let mouseUpListeners = [];
  let mouseDownListeners = [];
  window.onmousemove = (e:MouseEvent) => {
    mouseMoveListeners.forEach((f) => f(e));
  }
  window.onmouseup = (e:MouseEvent) => {
    mouseUpListeners.forEach((f) => f(e));
  }
  window.onmousedown = (e:MouseEvent) => {
    mouseDownListeners.forEach((f) => f(e));
  }
  function AddMouseMoveListener(f: (e: MouseEvent) => void) {
    mouseMoveListeners.push(f);
  }
  function AddMouseUpListener(f: (e: MouseEvent) => void) {
    mouseUpListeners.push(f);
  }
  function AddMouseDownListener(f: (e: MouseEvent) => void) {
    mouseDownListeners.push(f);
  }
  function CreateNewCard(content:string,x:number,y:number,color:string) {
    return new Promise<Card>((resolve)=>{
      window.api.insertCard(content,x,y,color).then((newCard)=>{
        window.api.getCards().then((v: CardType[])=>{cards=[...cards,GenerateCard(newCard)];});
        
        resolve(newCard);
      });
    });
  }
  function CreateNewRelation(first:number, second:number) {
    
    return new Promise<Relation>((resolve)=>{
      window.api.insertCardRel(first, second).then((newRelation: Relation)=>{
        window.api.getCardsRel().then((v: Relation[])=>{cardsRel=[...v,newRelation];});
        cards.find((v)=>{return v.id==newRelation.first}).childs.push(cards.find((v)=>{return v.id==newRelation.second}));
        cards.find((v)=>{return v.id==newRelation.second}).parents.push(cards.find((v)=>{return v.id==newRelation.first}));
        console.log(cards,newRelation);
        resolve(newRelation);
      });
    });
  }
  function DeleteCard(id: number) {
    return new Promise<void>((resolve)=>{
      window.api.deleteCard(id).then(()=>{
        (async ()=>{
          // const newCards = await window.api.getCards();
          // const newRelations = await window.api.getCardsRel();

          // cards=newCards.map((vv)=>{return GenerateCard(vv)});
          // cardsRel=newRelations;
          await Init();
          resolve();
        })();
      });
    });
  }
  function RenderRelations() {
      ctx.clearRect(0, 0, canv.width, canv.height);
      
      // SelectionRenderer();
      DrawRelations(ctx, cards, cardsRel);
  }
  let RenderMiniature: () => void;
  onMount(()=>{
    ctx = canv.getContext('2d');
    canv.width = window.innerWidth;
    canv.height = window.innerHeight;
    
    window.onresize = () => {
        canv.width = window.innerWidth;
        canv.height = window.innerHeight;
    }
    
    RenderRelations();
  });
  window.onload = () =>{
    RenderRelations();
    RenderMiniature();
  }
  
</script>
<main>
  <canvas id="background" bind:this={canv}></canvas>
    {#key rerender}
      <!-- <SelectionSquare bind:RenderSelection={SelectionRenderer} bind:rerender={rerender} ctx={ctx} cards={cards}
                      addMouseDown={AddMouseDownListener}
                      addMouseMove={AddMouseMoveListener}
                      addMouseUp={AddMouseUpListener}/> -->
      <div id="ui">
        <Miniature cardsRel={cardsRel} cards={cards} bind:RenderMiniature={RenderMiniature}/>
        <Hider>
          <div class="file-history">
            {#each historyFiles as file}
              <div class="file-history-row" on:click={()=>{window.api.openFile(file.path).then(()=>{Init()})}} role="button" tabindex="0" on:keydown={()=>{}}>
                <!-- <div>{file.path.split('\\').at().split('.')[0]}</div>
                <div style="font-size: 7px; align-self: flex-end; text-transform: uppercase;">{file.path}</div> -->
                <div>{file.path}</div>
              </div>
            {/each}
          </div>
        </Hider>
      </div>
      {#each cards as card}
        <Card card={card} cards={cards} addMouseMove={AddMouseMoveListener} 
              createNewCard={CreateNewCard} createNewRelation={CreateNewRelation}
              deleteCard={DeleteCard} 
              addMouseUp={AddMouseUpListener} addMouseDown={AddMouseDownListener}
              onChange={()=>{RenderRelations(); RenderMiniature()}}
              bind:otherDragging={sharedDragging}
              bind:rerenderer={rerender}/>
      {/each}
    {/key}
</main>


