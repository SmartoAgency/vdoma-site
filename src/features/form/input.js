import Cleave from "cleave.js";
// import intlTelInput from "intl-tel-input"; // Не потрібно для фіксованого +380

export default class SexyInput {
  constructor(setting) {
    if (!setting.$field) {
      return;
    }
    this.selected = false;
    this.$field = setting.$field;
    this.$input = setting.$input || setting.$field.querySelector("input, select");
    this.typeInput = setting.typeInput || "text";
    this.animation = setting.animation || "none";
    this.$message = setting.$message || setting.$field.querySelector("[data-input-message]");

    this.$body = document.querySelector("body");

    this.init();
  }

  get input() {
    return this.$input;
  }

  selectIn(self) {
    return () => {
      if (this.getStatusField() !== "field--error") {
        self.showSelectedStyle();
        self.addSelectedStyle();
      }
    };
  }

  selectOut(self) {
    return ({ target }) => {
      if (this.getStatusField() === "field--error" || target.value !== "") return;

      self.showDefaultStyle();
      self.removeSelectedStyle();
    };
  }

  /*  */
  getStatusField() {
    return this.$field.getAttribute("data-status");
  }

  /*  */
  showSuccessStyle() {
    this.changeStatus(this.$field, "success");
  }

  showDefaultStyle() {
    this.changeStatus(this.$field, "default");
  }

  showErrorStyle() {
    this.changeStatus(this.$field, "error");
  }

  showSelectedStyle() {
    this.changeStatus(this.$field, "selected");
  }

  showLoadingStyle() {
    this.changeStatus(this.$field, "loading");
  }

  addSelectedStyle() {
    if (this.animation === "focus") {
      this.$field.classList.add("selected");
    }
  }

  removeSelectedStyle() {
    this.$field.classList.remove("selected");
  }

  writeMessage(text) {
    this.$message.innerHTML = text;
  }
  /*  */

  changeStatus(fieldBlock, status) {
    switch (status) {
      case "default":
        fieldBlock.classList.remove("selected");
        fieldBlock.setAttribute("data-status", "field--inactive");

        break;
      case "success":
        fieldBlock.setAttribute("data-status", "field--success");

        break;
      case "error":
        fieldBlock.setAttribute("data-status", "field--error");
        break;
      case "selected":
        fieldBlock.classList.add("selected");
        fieldBlock.setAttribute("data-status", "field--active");
        break;
      case "loading":
        fieldBlock.classList.add("selected");
        fieldBlock.setAttribute("data-status", "field--loading");
        break;

      default:
        throw new Error(`Unknown change status ${status}`);
    }
  }

  /*  */

  listeners(input) {
    const self = this;

    if (this.typeInput === "phone") {
      input.setAttribute("inputmode", "tel");

      // Функція ініціалізації маски
      const initPhoneMask = () => {
        // Якщо Cleave вже створений, нічого не робимо
        if (input.cleaveInstance) return;

        input.cleaveInstance = new Cleave(input, {
          numericOnly: true,
          prefix: "+380",
          noImmediatePrefix: false, // Префікс з'явиться відразу при фокусі
          blocks: [4, 2, 3, 2, 2],
          delimiters: [" ", " ", " ", ""],
        });

        // Ставимо курсор в кінець після появи префікса
        setTimeout(() => {
          input.setSelectionRange(input.value.length, input.value.length);
        }, 1);
      };

      // Слухаємо фокус для активації маски
      input.addEventListener("focus", initPhoneMask);

      // Додатково: якщо користувач вийшов з порожнього поля — видаляємо маску,
      // щоб знову відобразився placeholder "Телефон"
      input.addEventListener("blur", () => {
        if (input.value === "+380" || input.value === "+380 " || input.value === "") {
          if (input.cleaveInstance) {
            input.cleaveInstance.destroy(); // Видаляємо Cleave
            input.cleaveInstance = null; // Обнуляємо посилання
            input.value = ""; // Очищуємо поле для повернення placeholder
          }
        }
      });
    }

    if (this.animation === "focus") {
      input.addEventListener("focus", self.selectIn(self));
      input.addEventListener("blur", self.selectOut(self));
    }
  }

  prepareMarkup() {
    if (this.animation === "focus") {
      this.$field.setAttribute("data-animation", "focus");
    }
    if (this.animation === "none") {
      this.$field.setAttribute("data-animation", "none");
    }
  }

  init() {
    this.listeners(this.$input);
    this.prepareMarkup(this.$input);
  }
}
