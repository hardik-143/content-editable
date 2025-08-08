/**
 * initializeEditable(selector, options)
 * - selector: CSS selector for items you want to be editable (default '.editable')
 * - options: { sanitize?: boolean } - whether to sanitize HTML when applying (default: false)
 */
(function () {
  const checkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`;
  const closeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

  const _DEFAULT_OPTIONS = {
    sanitize: false, // default no sanitization
    placeholder: "Type something", // default placeholder text
    onOpen: null, // callback when popover opens
    onClose: null, // callback when popover closes
    onSave: null, // callback when content is saved
    onCancel: null, // callback when content is cancelled
    showFlashOnSave: true, // whether to flash element on save
    flashElementColor: "#fde68a", // default flash color
    closeOnBlur: true, // close popover on click outside
  };

  function initializeEditable(selector = ".editable", options = {}) {
    const op_sanitize = !!options.sanitize ?? _DEFAULT_OPTIONS.sanitize;
    const op_placeholder = options.placeholder || _DEFAULT_OPTIONS.placeholder;
    const op_onOpen = options.onOpen || _DEFAULT_OPTIONS.onOpen;
    const op_onClose = options.onClose || _DEFAULT_OPTIONS.onClose;
    const op_onSave = options.onSave || _DEFAULT_OPTIONS.onSave;
    const op_onCancel = options.onCancel || _DEFAULT_OPTIONS.onCancel;
    const op_closeOnBlur = options.closeOnBlur ?? _DEFAULT_OPTIONS.closeOnBlur;
    const op_showFlashOnSave =
      options.showFlashOnSave ?? _DEFAULT_OPTIONS.showFlashOnSave;
    const op_flashElementColor =
      options.flashElementColor || _DEFAULT_OPTIONS.flashElementColor;

    const _id = Math.random().toString(36).substring(2, 9);
    let activePopover = null;

    document.querySelectorAll(selector).forEach((node) => {
      // Ensure the element is contenteditable
      node.classList.add("ce-editable");
      node.setAttribute("data-ce-editable", _id);
    });

    document.addEventListener("click", (e) => {
      // If clicking an editable element -> open popover
      const targetEditable = e.target.closest(selector);
      if (targetEditable) {
        e.preventDefault();
        openPopoverFor(targetEditable);
        return;
      }

      // If click outside popover, close it
      if (op_closeOnBlur && activePopover && !e.target.closest(".ce-popover")) {
        closePopover();
      }
    });

    // key handling for Escape to close and Enter to submit for single-line
    document.addEventListener("keydown", (e) => {
      if (!activePopover) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closePopover();
      }
    });

    function openPopoverFor(el) {
      // If a popover already open for same element, do nothing
      if (activePopover && activePopover.targetEl === el) return;

      // Close previous
      closePopover();

      // call onOpen callback if provided
      if (op_onOpen && typeof op_onOpen === "function") {
        op_onOpen(el);
      }

      // Create popover DOM
      const pop = document.createElement("div");
      pop.className = "ce-popover";
      pop.id = `ce-popover-${_id}`;
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", "Edit content");

      // Decide single-line or multiline via data attribute
      const multiline = el.dataset.multiline === "true";

      // Current content (trimmed)
      const current = multiline
        ? el.innerText
        : el.innerText.replace(/\s+/g, " ").trim();

      const ceBtnWrapper = document.createElement("div");
      ceBtnWrapper.className = "ce-btn-wrapper";
      ceBtnWrapper.innerHTML = `
            <button class="ce-btn check" title="Save" aria-label="Save (Enter)">${checkSVG}</button>
            <button class="ce-btn close" title="Close" aria-label="Close">${closeSVG}</button>
        `;

      // Build inner html
      const controlHtml = multiline
        ? `<div class="row">
                 <textarea id="ce-editcontrol-${_id}" class="ce-editcontrol" placeholder="${op_placeholder}" rows="3" aria-label="Edit content">${escapeHtml(
            current
          )}</textarea>
          ${ceBtnWrapper.outerHTML}
               </div>`
        : `<div class="row">
                 <input  id="ce-editcontrol-${_id}" class="ce-editcontrol" placeholder="${op_placeholder}" type="text" aria-label="Edit content" value="${escapeAttr(
            current
          )}" />
                ${ceBtnWrapper.outerHTML}
               </div>`;

      pop.innerHTML = controlHtml;
      document.body.appendChild(pop);

      // Positioning
      positionPopover(el, pop);

      // keep reference
      activePopover = { pop, targetEl: el };

      // Focus input/textarea caret at end
      const control = pop.querySelector(
        multiline ? "textarea" : 'input[type="text"]'
      );
      control.focus();
      setCaretToEnd(control);

      // Button listeners
      const btnCheck = pop.querySelector(".ce-btn.check");
      const btnClose = pop.querySelector(".ce-btn.close");

      btnClose.addEventListener("click", (ev) => {
        ev.stopPropagation();
        closePopover("close");
      });

      btnCheck.addEventListener("click", (ev) => {
        ev.stopPropagation();
        applyAndClose(control, el, op_sanitize, multiline);
      });

      control.addEventListener("input", (ev) => {
        let value = control.value;
        if (value.trim() !== "") {
          control.classList.remove("error");
        }
      });

      // Submit on Enter (only for single-line)
      if (!multiline) {
        control.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            applyAndClose(control, el, op_sanitize, false);
          }
        });
      } else {
        // For textarea: Ctrl+Enter to save
        control.addEventListener("keydown", (ev) => {
          if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
            ev.preventDefault();
            applyAndClose(control, el, op_sanitize, true);
          }
        });
      }

      // Reposition on window resize/scroll for better UX
      const reposition = () => positionPopover(el, pop);
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);

      // cleanup when popover closed
      pop._cleanup = () => {
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
      };
    }

    function closePopover(from = null) {
      if (!activePopover) return;
      const { pop } = activePopover;
      let targetEl = activePopover.targetEl;
      if (pop._cleanup) pop._cleanup();
      pop.remove();
      activePopover = null;
      // call onClose callback if provided
      if (op_onClose && typeof op_onClose === "function") {
        op_onClose(targetEl);
      }

      if (
        from === "close" &&
        op_onCancel &&
        typeof op_onCancel === "function"
      ) {
        op_onCancel(targetEl);
      }
    }

    function applyAndClose(control, el, op_sanitize, multiline) {
      const value = control.value;
      if (value.trim() === "") {
        if (activePopover && activePopover.pop) {
          control.classList.add("error");
        }
        return;
      }
      if (op_sanitize) {
        // Very simple sanitization - strip tags. For production use a proper sanitizer.
        const safe = value.replace(/<[^>]+>/g, "");
        el.innerText = safe;
      } else {
        // Apply as plain text to avoid injecting arbitrary HTML
        el.innerText = value;
      }
      // Add a small flash animation to show change
      if (op_showFlashOnSave) {
        flashElement(el);
      }
      closePopover();

      // call onSave callback if provided
      if (op_onSave && typeof op_onSave === "function") {
        op_onSave(el, value);
      }
    }

    function positionPopover(targetEl, popEl) {
      const rect = targetEl.getBoundingClientRect();
      const popRect = popEl.getBoundingClientRect();
      const margin = 8;
      let top = window.scrollY + rect.bottom + margin;
      let left = window.scrollX + rect.left;

      // try center-align the popover to target if space
      left = left + (rect.width - popRect.width) / 2;

      // keep inside viewport horizontally
      const vw = document.documentElement.clientWidth;
      if (left < 8) left = 8;
      if (left + popRect.width > vw - 8) left = vw - popRect.width - 8;

      popEl.classList.remove("ce-popover-above");

      // if not enough space below, place above
      const vh = document.documentElement.clientHeight;
      if (
        rect.bottom + popRect.height + margin > vh &&
        rect.top - popRect.height - margin > 0
      ) {
        top = window.scrollY + rect.top - popRect.height - margin;
        popEl.classList.add("ce-popover-above");
      }

      popEl.style.left = left + "px";
      popEl.style.top = top + "px";
      // small transform to make appear slightly elevated
      popEl.style.transform = "translateY(0)";
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function escapeAttr(str) {
      return ("" + str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function setCaretToEnd(el) {
      if (el.setSelectionRange) {
        const length = el.value.length;
        el.setSelectionRange(length, length);
      } else if (el.createTextRange) {
        const range = el.createTextRange();
        range.collapse(false);
        range.select();
      }
    }

    function flashElement(el) {
      const orig = el.style.transition;
      el.style.transition = "background-color 0.25s ease";
      const prev = el.style.backgroundColor;
      el.style.backgroundColor = op_flashElementColor;
      setTimeout(() => {
        el.style.backgroundColor = prev || "";
        setTimeout(() => {
          el.style.transition = orig || "";
        }, 300);
      }, 250);
    }

    // return an object for potential future API
    return {
      destroy: () => {
        document.querySelectorAll(selector).forEach((node) => {
          // no per-element listeners were added; global listeners would be removed here if desired
        });
      },
    };
  }

  // Export to window for debug/usage if needed:
  window.ContentEditablePopover = initializeEditable;
})();
