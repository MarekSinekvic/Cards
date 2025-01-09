
<script lang="ts">
  import type { Card, Relation } from "./types/card"

  let cards: Card[] = ([]), cardsRel: Relation[] = ([]);
  window.api.getCards().then((v: Card[])=>{cards=v; console.log(v)});
  window.api.getCardsRel().then((v: Relation[])=>{cardsRel=v;});
</script>

<main>
  <h1>Card List</h1>
  <ul>
    {#each cards as card}
      <li>{card.content}</li>
    {/each}
  </ul>
  <h1>Relation List</h1>
  <ul>
    {#each cardsRel as cardRel}
      <li>{cardRel.first} {'->'} {cardRel.second}</li>
    {/each}
  </ul>
</main>


