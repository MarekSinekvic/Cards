<style>
    .hider {
        display: flex;
        width: 100%;
        height: 24px;
        align-items: center;
        justify-content: center;
        position: relative;
    }
</style>
<script lang="ts">
    
    export let isHidden = true;
</script>

<div class="hider" on:click={() => {isHidden = !isHidden}} role="button" tabindex=0 on:keydown={()=>{}}>
    <div style="position:absolute; background: radial-gradient({!isHidden ? 'white' : 'gray'} 0%, transparent 80%); height: 1px; width: 100%"></div>
    <div style="z-index: 1; background-color: #1b1b1f; color: {!isHidden ? 'white': 'gray'}; padding: 0px 5px; border-left: 1px solid #999999; border-right: 1px solid #999999;">
        {#if isHidden} Expand {:else} Collapse {/if}
    </div>
</div>
{#if !isHidden}
    <div style="text-align: right; padding-right: 4px">
        <slot></slot>
    </div>
{/if}