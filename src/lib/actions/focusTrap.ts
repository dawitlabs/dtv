const FOCUSABLE =
	'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function focusTrap(node: HTMLElement): { destroy(): void } {
	const prevActive = document.activeElement as HTMLElement | null;

	function focusables(): HTMLElement[] {
		return [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
			(el) =>
				!!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
		);
	}

	function onKeydown(e: KeyboardEvent): void {
		if (e.key !== 'Tab') return;

		const els = focusables();

		if (els.length === 0) {
			e.preventDefault();
			node.focus();
			return;
		}

		const first = els[0];
		const last = els[els.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	node.addEventListener('keydown', onKeydown);
	(focusables()[0] ?? node).focus();

	function destroy(): void {
		node.removeEventListener('keydown', onKeydown);
		prevActive?.focus();
	}

	return { destroy };
}
