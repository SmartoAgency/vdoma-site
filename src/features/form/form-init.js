import * as yup from "yup";
import i18next from "i18next";
import FormMonster from "./form";
import SexyInput from "./input";
// import { successPopup } from "@shared/scripts/popup/successPopup";

const openSuccessPopup = () => {
  const popup = document.getElementById("success-popup");
  if (popup) {
    popup.classList.add("popup--open");
    popup.style.display = "flex";
  }
};

const initCustomSelects = (formRef) => {
  const selects = formRef.querySelectorAll("[data-custom-select]");

  selects.forEach((select) => {
    const input = select.querySelector("[data-select-input]");
    const triggerText = select.querySelector(".select-trigger__text");
    const items = select.querySelectorAll(".select-item");

    items.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const value = item.getAttribute("data-value");
        const text = item.innerText;

        // Записуємо значення в прихований інпут
        input.value = value;

        // Міняємо текст у "голові" селекта
        triggerText.innerText = text;
        triggerText.style.color = "#ffffff";

        // Повідомляємо Yup і FormMonster, що значення змінилося
        input.dispatchEvent(new Event("input", { bubbles: true }));
        select.classList.add("just-selected");

        select.addEventListener(
          "mouseleave",
          () => {
            select.classList.remove("just-selected");
          },
          { once: true },
        );
      });
    });
  });
};

const configureForm = (formRef, onSuccess) => {
  const btnRef = formRef.querySelector("[data-btn-submit]");

  initCustomSelects(formRef);

  new FormMonster({
    elements: {
      $form: formRef,
      $btnSubmit: btnRef,
      showSuccessMessage: false,
      successAction: () => {
        // successPopup.open();
        openSuccessPopup();
        onSuccess && onSuccess();
      },
      fields: {
        name: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-name]"),
            typeInput: "name",
          }),
          rule: yup.string().required(i18next.t("required")).trim(),
          defaultMessage: i18next.t("name"),
          valid: false,
          error: [],
        },
        phone: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-phone]"),
            typeInput: "phone",
          }),
          rule: yup
            .string()
            .required(i18next.t("required"))
            .min(17, i18next.t("field_too_short", { cnt: 19 - 7 })),
          defaultMessage: i18next.t("phone"),
          valid: false,
          error: [],
        },
        goal: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-goal]"),
            $input: formRef.querySelector("[data-select-input]"),
          }),
          rule: yup.string().required(i18next.t("required")),
          valid: false,
          error: [],
        },
        agreement: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-checkbox]"),
            typeInput: "checkbox",
          }),
          // Змінюємо правило тут:
          rule: yup
            .mixed()
            .nullable()
            .test("is-checked", i18next.t("required"), (value) => value === true || value === "on"),
        },
      },
    },
  });
};
const configureFormFooter = (formRef, onSuccess) => {
  const btnRef = formRef.querySelector("[data-btn-submit]");

  initCustomSelects(formRef);

  new FormMonster({
    elements: {
      $form: formRef,
      $btnSubmit: btnRef,
      showSuccessMessage: false,
      successAction: () => {
        openSuccessPopup();
        onSuccess && onSuccess();
      },
      fields: {
        name: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-name]"),
            typeInput: "name",
          }),
          rule: yup.string().required(i18next.t("required")).trim(),
          defaultMessage: i18next.t("name"),
          valid: false,
          error: [],
        },
        phone: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-phone]"),
            typeInput: "phone",
          }),
          rule: yup
            .string()
            .required(i18next.t("required"))
            .min(17, i18next.t("field_too_short", { cnt: 19 - 7 })),
          defaultMessage: i18next.t("phone"),
          valid: false,
          error: [],
        },

        agreement: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-checkbox]"),
            typeInput: "checkbox",
          }),
          // Змінюємо правило тут:
          rule: yup
            .mixed()
            .nullable()
            .test("is-checked", i18next.t("required"), (value) => value === true || value === "on"),
        },
      },
    },
  });
};

const configurePartnershipForm = (formRef, onSuccess) => {
  const btnRef = formRef.querySelector("[data-btn-submit]");

  initCustomSelects(formRef);

  new FormMonster({
    elements: {
      $form: formRef,
      $btnSubmit: btnRef,
      showSuccessMessage: false,
      successAction: () => {
        openSuccessPopup();
        onSuccess && onSuccess();
      },
      fields: {
        name: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-name]"),
            typeInput: "name",
          }),
          rule: yup.string().required(i18next.t("required")).trim(),
          defaultMessage: i18next.t("name"),
          valid: false,
          error: [],
        },
        phone: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-phone]"),
            typeInput: "phone",
          }),
          rule: yup
            .string()
            .required(i18next.t("required"))
            .min(17, i18next.t("field_too_short", { cnt: 19 - 7 })),
          defaultMessage: i18next.t("phone"),
          valid: false,
          error: [],
        },
        theme: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-theme]"),
            typeInput: "text",
          }),
          rule: yup.string().trim(),
          valid: true,
          error: [],
        },
        comment: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-comment]"),
            typeInput: "text",
          }),
          rule: yup.string().trim(),
          valid: true,
          error: [],
        },
        agreement: {
          inputWrapper: new SexyInput({
            animation: "none",
            $field: formRef.querySelector("[data-field-checkbox]"),
            typeInput: "checkbox",
          }),
          rule: yup
            .mixed()
            .nullable()
            .test("is-checked", i18next.t("required"), (value) => value === true || value === "on"),
        },
      },
    },
  });
};

const initAllForms = () => {
  const forms = document.querySelectorAll("[contact-form-js]");

  if (forms.length === 0) return;

  forms.forEach((formElement) => {
    if ("footer" === formElement.getAttribute("data-form")) {
      configureFormFooter(formElement, () => {});
    } else if ("partnership" === formElement.getAttribute("data-form")) {
      configurePartnershipForm(formElement, () => {});
    } else {
      configureForm(formElement, () => {});
    }
  });
};

initAllForms();
