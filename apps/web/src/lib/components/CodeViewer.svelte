<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        content,
        label = 'code',
        children
    }: {
        content?: string;
        label?: string;
        children?: Snippet;
    } = $props();
</script>

<pre
    class="max-h-96 overflow-auto rounded-md border border-slate-300 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-slate-100"
    aria-label={label}><code
        >{#if children}{@render children()}{:else}{content}{/if}</code
    ></pre>
