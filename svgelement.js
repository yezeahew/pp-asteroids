"use strict";
class Elem {
    constructor(svg, tag, parent = svg) {
        this.elem = document.createElementNS(svg.namespaceURI, tag);
        parent.appendChild(this.elem);
    }
    attr(name, value) {
        if (typeof value === 'undefined') {
            return this.elem.getAttribute(name);
        }
        this.elem.setAttribute(name, value.toString());
        return this;
    }
    text(content) {
        this.elem.textContent = content;
    }
    observe(event) {
        return Observable.fromEvent(this.elem, event);
    }
}
//# sourceMappingURL=svgelement.js.map