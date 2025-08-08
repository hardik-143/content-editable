# 📝 Content Editable Popover

A lightweight JavaScript plugin that makes elements editable via a small popover containing an input field and save/cancel buttons.

---

## 1. Installation

Include the CSS and JavaScript files in your HTML:

```html
<link rel="stylesheet" href="editable-popover.css" />
<script src="editable-popover.js"></script>
```

---

## 2. (Optional) Set Global Defaults

Set before including `editable-popover.js`:

> Global defaults affect **all** plugin instances unless overridden.

```html
<script>
  window.CE_DEFAULT_OPTIONS = {
    placeholder: "Type here...",
    sanitize: true,
    closeOnBlur: true,
  };
</script>
```

---

## 3. Initialize Plugin

```html
<script>
  contentEditable(".editable", {
    sanitize: false,
    placeholder: "Edit content here...",
    closeOnBlur: false,
    onOpen: function (element) {
      console.log("Popover opened for:", element);
    },
    onClose: function (element) {
      console.log("Popover closed for:", element);
    },
    onSave: function (element, value) {
      console.log("Content saved for:", element, "Value:", value);
    },
    onCancel: function (element) {
      console.log("Edit cancelled for:", element);
    },
  });
</script>
```

---

## 4. Default Options

| Option              | Type       | Default            | Description                                                             |
| ------------------- | ---------- | ------------------ | ----------------------------------------------------------------------- |
| `sanitize`          | `boolean`  | `false`            | Whether to strip HTML tags from the input value.                        |
| `placeholder`       | `string`   | `"Type something"` | Placeholder text shown in the popover input.                            |
| `onOpen`            | `function` | `null`             | Callback when the popover opens. Receives the element being edited.     |
| `onClose`           | `function` | `null`             | Callback when the popover closes. Receives the element being edited.    |
| `onSave`            | `function` | `null`             | Callback when content is saved. Receives the element and the new value. |
| `onCancel`          | `function` | `null`             | Callback when editing is cancelled. Receives the element.               |
| `showFlashOnSave`   | `boolean`  | `true`             | Whether to highlight the element briefly after saving.                  |
| `flashElementColor` | `string`   | `"#fde68a"`        | Color used for the save highlight.                                      |
| `closeOnBlur`       | `boolean`  | `true`             | Close the popover when clicking outside of it.                          |

---

## 5. Example Usage

```html
<p class="editable">Click me to edit</p>

<script>
  contentEditable(".editable", {
    sanitize: true,
    placeholder: "Edit text...",
    onSave: (el, value) => {
      console.log("Saved:", value, "to", el);
    },
  });
</script>
```

---

## 6. Notes

- The popover is positioned **below** the clicked element.
- The `.editable` class marks elements that should be editable.
- If you want HTML content to be preserved, set `sanitize: false`.
