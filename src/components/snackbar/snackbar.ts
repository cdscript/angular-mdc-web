import {
	AfterViewInit,
	Component,
	ElementRef,
	HostBinding,
	OnDestroy,
	Renderer2,
	ViewEncapsulation
} from '@angular/core';

const { MDCSnackbar, MDCSnackbarFoundation } = require('@material/snackbar');
const { getCorrectEventName } = require('@material/animation');
const MDC_SNACKBAR_STYLES = require('@material/snackbar/mdc-snackbar.scss');

const { ACTION_BUTTON_SELECTOR } = MDCSnackbarFoundation.strings;
const { ROOT } = MDCSnackbarFoundation.cssClasses;

type UnlistenerMap = WeakMap<EventListener, Function>;

@Component({
	selector: 'mdc-snackbar',
	templateUrl: './snackbar.html',
	styles: [String(MDC_SNACKBAR_STYLES)],
	encapsulation: ViewEncapsulation.None
})
export class SnackbarComponent implements AfterViewInit, OnDestroy {
	private message: string;
	private actionText: string;
	@HostBinding('class') className: string = 'mdc-snackbar';
	@HostBinding('attr.aria-live') ariaLive: string = 'assertive';
	@HostBinding('attr.aria-atomic') ariaAtomic: string = 'true';
	@HostBinding('attr.aria-hidden') ariaHidden: string = 'true';

	private _unlisteners: Map<string, UnlistenerMap> = new Map<string, UnlistenerMap>();

	private _mdcAdapter: MDCSnackbarAdapter = {
		addClass: (className: string) => {
			const { _renderer: renderer, _root: root } = this;
			renderer.addClass(root.nativeElement, className);
		},
		removeClass: (className: string) => {
			const { _renderer: renderer, _root: root } = this;
			renderer.removeClass(root.nativeElement, className);
		},
		setAriaHidden: () => {
			const { _renderer: renderer, _root: root } = this;
			root.nativeElement.setAttribute('aria-hidden', 'true');
		},
		unsetAriaHidden: () => {
			const { _renderer: renderer, _root: root } = this;
			root.nativeElement.removeAttribute('aria-hidden');
		},
		setMessageText: (message: string) => {
			this.message = message;
		},
		setActionText: (actionText: string) => {
			this.actionText = actionText;
		},
		setActionAriaHidden: () => {
			const { _renderer: renderer, _root: root } = this;
			renderer.setAttribute(root.nativeElement.querySelector(ACTION_BUTTON_SELECTOR), 'aria-hidden', 'true');
		},
		unsetActionAriaHidden: () => {
			const { _renderer: renderer, _root: root } = this;
			renderer.removeAttribute(root.nativeElement.querySelector(ACTION_BUTTON_SELECTOR), 'aria-hidden');
		},
		registerActionClickHandler: (handler: EventListener) => {
			if (this._root) {
				this.listen_('click', handler);
			}
		},
		deregisterActionClickHandler: (handler: EventListener) => {
			if (this._root) {
				this.unlisten_('click', handler);
			}
		},
		registerTransitionEndHandler: (handler: EventListener) => {
			if (this._root) {
				this.listen_(getCorrectEventName(window, 'transitionend'), handler);
			}
		},
		deregisterTransitionEndHandler: (handler: EventListener) => {
			if (this._root) {
				this.unlisten_(getCorrectEventName(window, 'transitionend'), handler);
			}
		}
	};

	// Instantiate foundation with adapter.
	private _foundation: { init: Function, destroy: Function, show: Function } =
	new MDCSnackbarFoundation(this._mdcAdapter);

	constructor(private _renderer: Renderer2, private _root: ElementRef) { }

	// Lifecycle methods to initialize and destroy the foundation.
	ngAfterViewInit() {
		this._foundation.init();
	}
	ngOnDestroy() {
		this._foundation.destroy();
	}

	show(data: any) {
		this._foundation.show(data);
	}

	listen_(type: string, listener: EventListener, ref: ElementRef = this._root) {
		if (!this._unlisteners.has(type)) {
			this._unlisteners.set(type, new WeakMap<EventListener, Function>());
		}
		const unlistener = this._renderer.listen(ref.nativeElement, type, listener);
		this._unlisteners.get(type).set(listener, unlistener);
	}

	unlisten_(type: string, listener: EventListener) {
		if (!this._unlisteners.has(type)) {
			return;
		}
		const unlisteners = this._unlisteners.get(type);
		if (!unlisteners.has(listener)) {
			return;
		}
		unlisteners.get(listener)();
		unlisteners.delete(listener);
	}
}