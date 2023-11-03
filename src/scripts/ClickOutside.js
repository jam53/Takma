/**
 * Dispatch event on click outside of node
 * From: https://svelte.dev/repl/0ace7a508bd843b798ae599940a91783?version=3.16.7
 */
export function clickOutside(node) {
    const handleClick = event => {
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
            node.dispatchEvent(
                new CustomEvent('click_outside', node)
            );
        }
    }

    // Add event listeners for both left-click (click) and right-click (contextmenu)
    document.addEventListener('click', handleClick, true);
    document.addEventListener('contextmenu', handleClick, true);

    return {
        destroy() {
            // Remove both event listeners
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('contextmenu', handleClick, true);
        }
    };
}
